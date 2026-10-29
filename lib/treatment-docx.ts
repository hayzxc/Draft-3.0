import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  VerticalAlignTable,
  ImageRun,
  Packer,
} from "docx";
import { format } from "date-fns";
import { CERTIFICATE_CONSTANTS } from "@/lib/certificate-constants";
import { cleanPastedText, formatConsigneeDisplay, parseConsigneeAndNotifyParty } from "@/lib/form-helpers";
import { TreatmentCertificateData } from "@/components/treatment/TreatmentDocument";
import { generateQrDataUrl } from "@/lib/qr";
import { createGasClearanceDocxElements } from "@/lib/gas-clearance-docx";
import { mapTreatmentToGasClearanceData } from "@/lib/treatment-bundle-helpers";

const PRIMARY_BLUE = "0850A2";
const FONT_FAMILY = "Arial";

// Page dimensions in twips/dxa matching exact PDF specs (A4: 210mm x 297mm)
// Margins: Left 34pt (680 dxa), Right 34pt (680 dxa), Top 24pt (480 dxa), Bottom 22pt (440 dxa)
// Page Width = 11906 dxa. Usable Width = 11906 - 1360 = 10546 dxa.
const TOTAL_WIDTH = 10546;

const blackBorder = {
  style: BorderStyle.SINGLE,
  size: 6, // 0.75 pt in docx
  color: "000000",
};

const cellBorders = {
  top: blackBorder,
  bottom: blackBorder,
  left: blackBorder,
  right: blackBorder,
};

const cellMargins = {
  top: 50, // in dxa (~2.5pt)
  bottom: 50,
  left: 70, // in dxa (~3.5pt)
  right: 70,
};

const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    return format(d, "dd/MM/yyyy");
  } catch {
    return String(date);
  }
};

const formatDateTime = (date: Date | string | undefined | null): string => {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    return format(d, "dd/MM/yyyy - HH:mm");
  } catch {
    return String(date);
  }
};

const formatContinuousDisplay = (text: string | null | undefined): string => {
  if (!text) return "";
  return cleanPastedText(text, false);
};

/**
 * Resolves image URL or Data URL to byte array for docx ImageRun.
 * Supports browser environment and Node.js server environment.
 */
async function resolveImageBytes(
  urlOrDataUrl: string | null | undefined
): Promise<{ data: Uint8Array; type: "png" | "jpg" | "gif" | "bmp" } | null> {
  if (!urlOrDataUrl) return null;
  try {
    if (urlOrDataUrl.startsWith("data:")) {
      const match = urlOrDataUrl.match(/^data:image\/(png|jpeg|jpg|gif|bmp);base64,(.*)$/i);
      const ext = match ? match[1].toLowerCase() : "png";
      const type = (ext === "jpeg" ? "jpg" : ext) as "png" | "jpg" | "gif" | "bmp";
      const base64Data = match ? match[2] : urlOrDataUrl.split(",")[1];

      let uint8: Uint8Array;
      if (typeof window !== "undefined" && window.atob) {
        const bin = window.atob(base64Data);
        uint8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
          uint8[i] = bin.charCodeAt(i);
        }
      } else {
        uint8 = Uint8Array.from(Buffer.from(base64Data, "base64"));
      }
      return { data: uint8, type };
    }

    if (typeof window !== "undefined") {
      const resp = await fetch(urlOrDataUrl);
      if (!resp.ok) return null;
      const arrayBuf = await resp.arrayBuffer();
      const ext = urlOrDataUrl.split(".").pop()?.toLowerCase() || "png";
      const type = (ext === "jpeg" || ext === "jpg" ? "jpg" : "png") as "png" | "jpg";
      return { data: new Uint8Array(arrayBuf), type };
    } else {
      if (urlOrDataUrl.startsWith("/")) {
        const fs = await import("fs/promises");
        const path = await import("path");
        const fullPath = path.join(process.cwd(), "public", urlOrDataUrl);
        const buf = await fs.readFile(fullPath);
        const ext = urlOrDataUrl.split(".").pop()?.toLowerCase() || "png";
        const type = (ext === "jpeg" || ext === "jpg" ? "jpg" : "png") as "png" | "jpg";
        return { data: new Uint8Array(buf), type };
      } else {
        const resp = await fetch(urlOrDataUrl);
        if (!resp.ok) return null;
        const arrayBuf = await resp.arrayBuffer();
        const ext = urlOrDataUrl.split(".").pop()?.toLowerCase() || "png";
        const type = (ext === "jpeg" || ext === "jpg" ? "jpg" : "png") as "png" | "jpg";
        return { data: new Uint8Array(arrayBuf), type };
      }
    }
  } catch (err) {
    console.error("resolveImageBytes error:", err);
    return null;
  }
}

/**
 * Creates the complete docx Document instance matching the Treatment Certificate layout.
 */
export async function createTreatmentDocxDocument(
  data: TreatmentCertificateData
): Promise<Document> {
  const verificationLink = data.verificationUrl?.trim() || "";

  let qrCodeDataUrl = data.qrCodeDataUrl;
  if (!qrCodeDataUrl && verificationLink) {
    try {
      qrCodeDataUrl = await generateQrDataUrl(verificationLink);
    } catch {
      qrCodeDataUrl = "";
    }
  }

  const [qrImg, sigImg] = await Promise.all([
    resolveImageBytes(qrCodeDataUrl),
    resolveImageBytes(data.fumigatorSignatureUrl),
  ]);

  // Section Heading helper
  const createSectionHeader = (title: string): Paragraph => {
    return new Paragraph({
      spacing: { before: 80, after: 20, line: 220 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          color: PRIMARY_BLUE,
          size: 17, // 8.5pt
          font: FONT_FAMILY,
        }),
      ],
    });
  };

  // Helper for regular / bold text paragraph
  const createP = (
    text: string,
    bold = false,
    color = "000000",
    size = 14,
    alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT
  ): Paragraph => {
    return new Paragraph({
      alignment,
      spacing: { before: 0, after: 15, line: 215 },
      children: [
        new TextRun({
          text,
          bold,
          color,
          size,
          font: FONT_FAMILY,
        }),
      ],
    });
  };

  // Helper for multi-line text blocks
  const createMultiLineParagraphs = (
    text: string | null | undefined,
    bold = true,
    size = 14
  ): Paragraph[] => {
    const cleaned = formatContinuousDisplay(text) || "-";
    const lines = cleaned.split("\n");
    return lines.map((line) =>
      new Paragraph({
        spacing: { before: 0, after: 15, line: 215 },
        children: [
          new TextRun({
            text: line,
            bold,
            size,
            font: FONT_FAMILY,
          }),
        ],
      })
    );
  };

  // Consignment link paragraphs (Conditionally omit PTK or BL if empty!)
  const consignmentLinkParagraphs: Paragraph[] = [];
  if (data.consignmentLinkPpk?.trim()) {
    consignmentLinkParagraphs.push(
      new Paragraph({
        spacing: { before: 0, after: 15, line: 215 },
        children: [
          new TextRun({ text: "No. PTK Karantina (PPK) : ", size: 14, font: FONT_FAMILY }),
          new TextRun({ text: data.consignmentLinkPpk, bold: true, size: 14, font: FONT_FAMILY }),
        ],
      })
    );
  }
  consignmentLinkParagraphs.push(
    new Paragraph({
      spacing: { before: 0, after: 15, line: 215 },
      children: [
        new TextRun({ text: "No. DO : ", size: 14, font: FONT_FAMILY }),
        new TextRun({ text: data.consignmentLinkDo || "-", bold: true, size: 14, font: FONT_FAMILY }),
      ],
    })
  );
  if (data.consignmentLinkBl?.trim()) {
    consignmentLinkParagraphs.push(
      new Paragraph({
        spacing: { before: 0, after: 15, line: 215 },
        children: [
          new TextRun({ text: "No. BL (Bill of Lading) : ", size: 14, font: FONT_FAMILY }),
          new TextRun({ text: data.consignmentLinkBl, bold: true, size: 14, font: FONT_FAMILY }),
        ],
      })
    );
  }
  consignmentLinkParagraphs.push(
    new Paragraph({
      spacing: { before: 0, after: 15, line: 215 },
      children: [
        new TextRun({ text: "Containers : ", size: 14, font: FONT_FAMILY }),
        new TextRun({ text: data.containers || "-", bold: true, size: 14, font: FONT_FAMILY }),
      ],
    })
  );
  if (data.consignmentLinkOther?.trim()) {
    const otherLines = data.consignmentLinkOther.split(/[\r\n]+/);
    for (const line of otherLines) {
      if (line.trim()) {
        consignmentLinkParagraphs.push(
          new Paragraph({
            spacing: { before: 0, after: 15, line: 215 },
            children: [
              new TextRun({ text: line.trim(), bold: true, size: 14, font: FONT_FAMILY }),
            ],
          })
        );
      }
    }
  }


  // --- Page 1: Treatment Certificate Children ---
  const treatmentChildren: (Paragraph | Table)[] = [
    // Top Serial and Date Row
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 0, after: 30, line: 220 },
            children: [
              new TextRun({ text: "Serial No. ", size: 15, font: FONT_FAMILY }),
              new TextRun({ text: data.serialNo || "-", bold: true, size: 15, font: FONT_FAMILY }),
              new TextRun({ text: " | Date issued (dd/mm/yyyy): ", size: 15, font: FONT_FAMILY }),
              new TextRun({ text: formatDate(data.dateIssued), bold: true, size: 15, font: FONT_FAMILY }),
            ],
          }),

          // Main Title
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 20, after: 60, line: 220 },
            children: [
              new TextRun({
                text: "TREATMENT CERTIFICATE - Methyl Bromide Fumigation",
                bold: true,
                color: PRIMARY_BLUE,
                size: 21, // 10.5pt
                font: FONT_FAMILY,
              }),
            ],
          }),

          // Table 1: Certificate number & Treatment provider ID number
          new Table({
            width: { size: TOTAL_WIDTH, type: WidthType.DXA },
            columnWidths: [5273, 5273],
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 5273, type: WidthType.DXA },
                    shading: { fill: "000000" },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [
                      new Paragraph({
                        spacing: { before: 0, after: 0, line: 220 },
                        children: [
                          new TextRun({
                            text: "Certificate number",
                            bold: true,
                            color: "FFFFFF",
                            size: 15,
                            font: FONT_FAMILY,
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 5273, type: WidthType.DXA },
                    shading: { fill: "000000" },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [
                      new Paragraph({
                        spacing: { before: 0, after: 0, line: 220 },
                        children: [
                          new TextRun({
                            text: "Treatment provider ID number",
                            bold: true,
                            color: "FFFFFF",
                            size: 15,
                            font: FONT_FAMILY,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 5273, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP(data.certificateNumber || "-", true, "000000", 15)],
                  }),
                  new TableCell({
                    width: { size: 5273, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP(CERTIFICATE_CONSTANTS.registrationNumber, true, "000000", 15)],
                  }),
                ],
              }),
            ],
          }),

          // Section 1: Consignment details
          createSectionHeader("Consignment details"),
          new Table({
            width: { size: TOTAL_WIDTH, type: WidthType.DXA },
            // Grid columns: Col 1 = 3269, Col 2 = 2531, Col 3 = 2215, Col 4 = 2531 (Total: 10546 dxa)
            columnWidths: [3269, 2531, 2215, 2531],
            rows: [
              // Row 1: Consignment Link (Col 1: 3269, Col 2-4: 7277 with columnSpan: 3)
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 3269, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP("Consignment link (container numbers if applicable)", false, "000000", 14)],
                  }),
                  new TableCell({
                    columnSpan: 3,
                    width: { size: 7277, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: consignmentLinkParagraphs,
                  }),
                ],
              }),

              // Row 2: Seal and Carrier
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 3269, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP("Seal numbers(s) and Carrier/vessel (if applicable)", false, "000000", 14)],
                  }),
                  new TableCell({
                    columnSpan: 3,
                    width: { size: 7277, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [
                      new Paragraph({
                        spacing: { before: 0, after: 15, line: 215 },
                        children: [
                          new TextRun({ text: "Seal numbers : ", size: 14, font: FONT_FAMILY }),
                          new TextRun({ text: data.sealNumbers || "-", bold: true, size: 14, font: FONT_FAMILY }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 0, after: 15, line: 215 },
                        children: [
                          new TextRun({ text: "Carrier/vessel : ", size: 14, font: FONT_FAMILY }),
                          new TextRun({ text: data.carrierVessel || "-", bold: true, size: 14, font: FONT_FAMILY }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              // Row 3: Client name and address
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 3269, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP("Client name and address", false, "000000", 14)],
                  }),
                  new TableCell({
                    columnSpan: 3,
                    width: { size: 7277, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: createMultiLineParagraphs(data.clientNameAddress, true, 14),
                  }),
                ],
              }),

              // Row 4: Consignee
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 3269, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP("Consignee", false, "000000", 14)],
                  }),
                  new TableCell({
                    columnSpan: 3,
                    width: { size: 7277, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: createMultiLineParagraphs(
                      data.notifyParty !== undefined && data.notifyParty !== null
                        ? data.consignee
                        : parseConsigneeAndNotifyParty(data.consignee).consignee,
                      true,
                      14
                    ),
                  }),
                ],
              }),

              // Row 5: Notify party
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 3269, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP("Notify party", false, "000000", 14)],
                  }),
                  new TableCell({
                    columnSpan: 3,
                    width: { size: 7277, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: createMultiLineParagraphs(
                      data.notifyParty !== undefined && data.notifyParty !== null
                        ? data.notifyParty
                        : parseConsigneeAndNotifyParty(data.consignee).notifyParty,
                      true,
                      14
                    ),
                  }),
                ],
              }),

              // Row 5: Commodity description and quantity
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 3269, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP("Commodity description and quantity", false, "000000", 14)],
                  }),
                  new TableCell({
                    columnSpan: 3,
                    width: { size: 7277, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: createMultiLineParagraphs(data.commodityDescription, true, 14),
                  }),
                ],
              }),

              // Row 5: 4-column row (Origin, Destination, Loading, Unloading)
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 3269, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [
                      createP("Commodity country of origin", false, "000000", 14),
                      createP("Destination country", false, "000000", 14),
                    ],
                  }),
                  new TableCell({
                    width: { size: 2531, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [
                      createP(data.originCountry || "-", true, "000000", 14),
                      createP(data.destinationCountry || "-", true, "000000", 14),
                    ],
                  }),
                  new TableCell({
                    width: { size: 2215, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [
                      createP("Port of loading", false, "000000", 14),
                      createP("Port of unloading", false, "000000", 14),
                    ],
                  }),
                  new TableCell({
                    width: { size: 2531, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [
                      createP(data.portOfLoading || "-", true, "000000", 14),
                      createP(data.portOfUnloading || "-", true, "000000", 14),
                    ],
                  }),
                ],
              }),

              // Row 6: Target and Enclosure (4-columns)
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 3269, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP("Target of fumigation", false, "000000", 14)],
                  }),
                  new TableCell({
                    width: { size: 2531, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP(data.targetOfFumigation || "-", true, "000000", 14)],
                  }),
                  new TableCell({
                    width: { size: 2215, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP("Enclosure type", false, "000000", 14)],
                  }),
                  new TableCell({
                    width: { size: 2531, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP(data.enclosureType || "-", true, "000000", 14)],
                  }),
                ],
              }),
            ],
          }),

          // Section 2: Treatment schedule
          createSectionHeader("Treatment schedule (prescribed/specified treatment schedule)"),
          new Table({
            width: { size: TOTAL_WIDTH, type: WidthType.DXA },
            // Unified 6-column grid: 1476 + 1793 = 3269 (31%), 1793 + 1793 + 1793 + 1898 = 7277 (69%)
            columnWidths: [1476, 1793, 1793, 1793, 1793, 1898],
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 1476, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP("Dose rate", false, "000000", 14)],
                  }),
                  new TableCell({
                    width: { size: 1793, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP(data.prescribedDoseRate || "-", true, "000000", 14)],
                  }),
                  new TableCell({
                    width: { size: 1793, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP("Exposure period", false, "000000", 14)],
                  }),
                  new TableCell({
                    width: { size: 1793, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP(data.prescribedExposurePeriod || "-", true, "000000", 14)],
                  }),
                  new TableCell({
                    width: { size: 1793, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP("Temperature", false, "000000", 14)],
                  }),
                  new TableCell({
                    width: { size: 1898, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP(data.prescribedTemperature || "-", true, "000000", 14)],
                  }),
                ],
              }),
            ],
          }),

          // Section 3: Fumigation details
          createSectionHeader("Fumigation details (treatment applied)"),
          new Table({
            width: { size: TOTAL_WIDTH, type: WidthType.DXA },
            // Unified 6-column grid matching the 31% / 69% split perfectly:
            // Cols 1-2 = 1476 + 1793 = 3269 (31%)
            // Cols 3-6 = 1793 + 1793 + 1793 + 1898 = 7277 (69%)
            columnWidths: [1476, 1793, 1793, 1793, 1793, 1898],
            rows: [
              // Row 1: Applied values (6 columns)
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 1476, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP("Applied dose", false, "000000", 14)],
                  }),
                  new TableCell({
                    width: { size: 1793, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP(data.appliedDose || "-", true, "000000", 14)],
                  }),
                  new TableCell({
                    width: { size: 1793, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP("Exposure period", false, "000000", 14)],
                  }),
                  new TableCell({
                    width: { size: 1793, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP(data.appliedExposurePeriod || "-", true, "000000", 14)],
                  }),
                  new TableCell({
                    width: { size: 1793, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP("Temperature", false, "000000", 14)],
                  }),
                  new TableCell({
                    width: { size: 1898, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP(data.appliedTemperature || "-", true, "000000", 14)],
                  }),
                ],
              }),

              // Row 2: Place of fumigation (Col 1-2: 3269 dxa with columnSpan: 2, Col 3-6: 7277 dxa with columnSpan: 4)
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 2,
                    width: { size: 3269, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP("Place of fumigation (Full address)", false, "000000", 14)],
                  }),
                  new TableCell({
                    columnSpan: 4,
                    width: { size: 7277, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: createMultiLineParagraphs(data.placeOfFumigation, true, 14),
                  }),
                ],
              }),

              // Row 3: Commenced & Completed
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 2,
                    width: { size: 3269, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [
                      createP("Date and time fumigation commenced", false, "000000", 14),
                      createP("(dd/mm/yyyy - HH:MM)", false, "000000", 13),
                      new Paragraph({ spacing: { before: 0, after: 10, line: 120 }, children: [] }),
                      createP("Date and time fumigation completed", false, "000000", 14),
                      createP("(dd/mm/yyyy - HH:MM)", false, "000000", 13),
                    ],
                  }),
                  new TableCell({
                    columnSpan: 4,
                    width: { size: 7277, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [
                      createP(formatDateTime(data.commencingAt), true, "000000", 14),
                      new Paragraph({ spacing: { before: 0, after: 20, line: 200 }, children: [] }),
                      createP(formatDateTime(data.completedAt), true, "000000", 14),
                    ],
                  }),
                ],
              }),

              // Row 4: Final TLV reading
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 2,
                    width: { size: 3269, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP("Final TLV reading (ppm)", false, "000000", 14)],
                  }),
                  new TableCell({
                    columnSpan: 4,
                    width: { size: 7277, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    children: [createP(data.finalTlvReading || "-", true, "000000", 14)],
                  }),
                ],
              }),
            ],
          }),

          // Section 4: Declaration
          createSectionHeader("Declaration"),
          new Paragraph({
            spacing: { before: 0, after: 10, line: 215 },
            children: [
              new TextRun({ text: "I, the fumigator-in-charge declare:", size: 14, font: FONT_FAMILY }),
            ],
          }),
          new Paragraph({
            spacing: { before: 0, after: 10, line: 215 },
            children: [
              new TextRun({
                text: "1. The fumigation certified was conducted in accordance with the treatment schedule, import conditions, and all the requirements in the Methyl Bromide Fumigation Methodology, and",
                size: 14,
                font: FONT_FAMILY,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 0, after: 25, line: 215 },
            children: [
              new TextRun({
                text: "2. The information I have provided is true and correct.",
                size: 14,
                font: FONT_FAMILY,
              }),
            ],
          }),

          // Table 5: Signature & QR Code Box
          new Table({
            width: { size: TOTAL_WIDTH, type: WidthType.DXA },
            columnWidths: [2110, 5800, 2636],
            rows: [
              // Row 1: Signature Area
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 2110, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    verticalAlign: VerticalAlignTable.CENTER,
                    children: [createP("Signature", true, "000000", 14, AlignmentType.CENTER)],
                  }),
                  new TableCell({
                    width: { size: 5800, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    verticalAlign: VerticalAlignTable.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 15, after: 15, line: 220 },
                        children: sigImg
                          ? [
                              new ImageRun({
                                type: sigImg.type,
                                data: sigImg.data,
                                transformation: { width: 130, height: 48 },
                              }),
                            ]
                          : [new TextRun({ text: "", size: 14 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 2636, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    verticalAlign: VerticalAlignTable.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 10, after: 10, line: 220 },
                        children: qrImg
                          ? [
                              new ImageRun({
                                type: qrImg.type,
                                data: qrImg.data,
                                transformation: { width: 60, height: 60 },
                              }),
                            ]
                          : [new TextRun({ text: "[QR Code]", color: "888888", size: 12, font: FONT_FAMILY })],
                      }),
                    ],
                  }),
                ],
              }),

              // Row 2: Full Name (with Date spanned for 2 rows in Col 3)
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 2110, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    verticalAlign: VerticalAlignTable.CENTER,
                    children: [createP("Full name", true, "000000", 14, AlignmentType.RIGHT)],
                  }),
                  new TableCell({
                    width: { size: 5800, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    verticalAlign: VerticalAlignTable.CENTER,
                    children: [createP(data.fumigatorName || "-", true, "000000", 14)],
                  }),
                  new TableCell({
                    rowSpan: 2,
                    width: { size: 2636, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    verticalAlign: VerticalAlignTable.CENTER,
                    children: [
                      createP("Date (dd/mm/yyyy):", false, "000000", 14),
                      createP(formatDate(data.dateIssued), true, "000000", 14),
                    ],
                  }),
                ],
              }),

              // Row 3: Accreditation Number (Col 3 spanned from Row 2)
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 2110, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    verticalAlign: VerticalAlignTable.CENTER,
                    children: [createP("Accreditation number", true, "000000", 14, AlignmentType.RIGHT)],
                  }),
                  new TableCell({
                    width: { size: 5800, type: WidthType.DXA },
                    borders: cellBorders,
                    margins: cellMargins,
                    verticalAlign: VerticalAlignTable.CENTER,
                    children: [createP(data.fumigatorAccreditationNumber || "-", true, "000000", 14)],
                  }),
                ],
              }),
            ],
          }),

          // Section 5: Additional Declarations
          createSectionHeader("Additional Declarations"),
          new Paragraph({
            spacing: { before: 0, after: 40, line: 215 },
            children: [
              new TextRun({
                text: data.additionalDeclarations || "-",
                size: 14,
                font: FONT_FAMILY,
              }),
            ],
          }),

          // Footer
          new Paragraph({
            spacing: { before: 60, after: 15, line: 210 },
            border: {
              top: {
                style: BorderStyle.SINGLE,
                size: 6,
                color: "000000",
              },
            },
            children: [
              new TextRun({
                text: "Printed digitally through: ",
                size: 13, // 6.5pt
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: "FUMI TRUST by BARANTIN",
                bold: true,
                size: 13,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: verificationLink
                  ? ". The authenticity of this document can be verified through the QRcode above or via the following link:"
                  : ".",
                size: 13,
                font: FONT_FAMILY,
              }),
            ],
          }),
          ...(verificationLink
            ? [
                new Paragraph({
                  spacing: { before: 0, after: 0, line: 210 },
                  children: [
                    new TextRun({
                      text: verificationLink,
                      color: PRIMARY_BLUE,
                      size: 13,
                      font: FONT_FAMILY,
                      underline: {},
                    }),
                  ],
                }),
              ]
            : []),
  ];

  const sections: any[] = [
    {
      properties: {
        page: {
          size: {
            width: 11906, // A4 width in dxa
            height: 16838, // A4 height in dxa
          },
          margin: {
            top: 480, // 24 pt
            bottom: 440, // 22 pt
            left: 680, // 34 pt
            right: 680, // 34 pt
          },
        },
      },
      children: treatmentChildren,
    },
  ];

  if (data.includeGasClearance !== false) {
    const gcData = mapTreatmentToGasClearanceData(data);
    const gcChildren = await createGasClearanceDocxElements(gcData);
    sections.push({
      properties: {
        page: {
          size: {
            width: 11906,
            height: 16838,
          },
          margin: {
            top: 480,
            bottom: 440,
            left: 680,
            right: 680,
          },
        },
      },
      children: gcChildren,
    });
  }

  return new Document({ sections });
}

/**
 * Generates a Blob for client-side download in the browser.
 */
export async function generateTreatmentDocxBlob(
  data: TreatmentCertificateData
): Promise<Blob> {
  const doc = await createTreatmentDocxDocument(data);
  return await Packer.toBlob(doc);
}

/**
 * Generates a Buffer for server-side response in Next.js API route.
 */
export async function generateTreatmentDocxBuffer(
  data: TreatmentCertificateData
): Promise<Buffer> {
  const doc = await createTreatmentDocxDocument(data);
  return await Packer.toBuffer(doc);
}
