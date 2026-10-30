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
  ImageRun,
  Packer,
  UnderlineType,
} from "docx";
import { format } from "date-fns";
import { GAS_CLEARANCE_STATIC_TEXT } from "@/lib/certificate-static-text";
import { GasClearanceCertificateData } from "@/components/certificate/CertificateDocument";
import { generateQrDataUrl } from "@/lib/qr";

const PRIMARY_BLUE = "0047AB";
const FONT_FAMILY = "Arial";
const TOTAL_WIDTH = 10546; // A4 printable area width in dxa (margins 680 dxa each)

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
    console.error("Failed to load image for DOCX:", urlOrDataUrl, err);
    return null;
  }
}

export async function createGasClearanceDocxElements(
  data: GasClearanceCertificateData
): Promise<(Paragraph | Table)[]> {
  const verificationLink = data.verificationUrl?.trim() || "";

  // Generate QR if needed
  let qrBytes: { data: Uint8Array; type: "png" | "jpg" | "gif" | "bmp" } | null = null;
  if (data.qrCodeDataUrl || verificationLink) {
    try {
      const qrDataUrl = data.qrCodeDataUrl || (await generateQrDataUrl(verificationLink));
      qrBytes = await resolveImageBytes(qrDataUrl);
    } catch (e) {
      console.error("DOCX QR generation error:", e);
    }
  }

  // Load letterhead and signature images (no company stamp for draft)
  const letterheadBytes = await resolveImageBytes(data.logoImageUrl || "/images/letterhead.jpg");
  const signatureBytes = await resolveImageBytes(data.fumigatorSignatureUrl);

  const gasReading =
    data.gasLevelReading?.trim() ||
    (data.gasLevelPpm !== null && data.gasLevelPpm !== undefined && data.gasLevelPpm !== ""
      ? (data.containerNumber?.trim()
          ? `${data.containerNumber.trim()}: ${data.gasLevelPpm} ppm`
          : `${data.gasLevelPpm} ppm`)
      : "");

  const noTableBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
  };

  const noCellBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  };

  const metaTableBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
    bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
  };

  const borderBottomOnly = {
    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
    bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  };

  const borderTopOnly = {
    top: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  };

  const footerTableBorders = {
    top: { style: BorderStyle.SINGLE, size: 6, color: "999999" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
  };

  // 1. Header Image Element
  const headerElements: Paragraph[] = [];
  if (letterheadBytes) {
    headerElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new ImageRun({
            data: letterheadBytes.data,
            transformation: {
              width: 680,
              height: 92,
            },
            type: letterheadBytes.type,
          }),
        ],
      })
    );
  }

  // 2. Top Metadata Table
  const metaTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: metaTableBorders,
    columnWidths: [5800, 4746],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5800, type: WidthType.DXA },
            borders: borderBottomOnly,
            children: [
              new Paragraph({
                spacing: { after: 30 },
                children: [
                  new TextRun({ text: "Serial No. ", font: FONT_FAMILY, size: 17 }),
                  new TextRun({ text: data.serialNo || "-", font: FONT_FAMILY, bold: true, size: 17 }),
                ],
              }),
              new Paragraph({
                spacing: { after: 20 },
                children: [
                  new TextRun({ text: "Nomor GC / GC Number :", font: FONT_FAMILY, size: 17 }),
                ],
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: data.certificateNumber || "-", font: FONT_FAMILY, bold: true, size: 17 }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 4746, type: WidthType.DXA },
            borders: borderBottomOnly,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 40 },
                children: [
                  new TextRun({ text: "Nomor Registrasi / Registration Number : ", font: FONT_FAMILY, size: 17 }),
                  new TextRun({ text: data.registrationNumber || "ID0018MB", font: FONT_FAMILY, bold: true, size: 17 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: "Tanggal / Date (dd/mm/yyyy) : ", font: FONT_FAMILY, size: 17 }),
                  new TextRun({ text: formatDate(data.certificateDate), font: FONT_FAMILY, bold: true, size: 17 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // 3. Title Paragraphs
  const titleParagraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 140, after: 30 },
      children: [
        new TextRun({
          text: GAS_CLEARANCE_STATIC_TEXT.titleId,
          font: FONT_FAMILY,
          bold: true,
          size: 23,
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: GAS_CLEARANCE_STATIC_TEXT.titleEn,
          font: "Times New Roman",
          italics: true,
          size: 19,
        }),
      ],
    }),
  ];

  // 4. Salutation
  const salutationParagraphs = [
    new Paragraph({
      spacing: { after: 20 },
      children: [
        new TextRun({ text: GAS_CLEARANCE_STATIC_TEXT.headingId, font: FONT_FAMILY, size: 17 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: GAS_CLEARANCE_STATIC_TEXT.headingEn, font: "Times New Roman", italics: true, size: 16 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 20 },
      children: [
        new TextRun({ text: GAS_CLEARANCE_STATIC_TEXT.introId, font: FONT_FAMILY, size: 17 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: GAS_CLEARANCE_STATIC_TEXT.introEn, font: "Times New Roman", italics: true, size: 16 }),
      ],
    }),
  ];

  // 5. Bilingual Fields Table
  const makeFieldRow = (
    labelId: string,
    labelEn: string,
    value: string,
    isBold: boolean = true
  ) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 3800, type: WidthType.DXA },
          borders: noCellBorders,
          children: [
            new Paragraph({
              spacing: { after: 10 },
              children: [new TextRun({ text: labelId, font: FONT_FAMILY, size: 17 })],
            }),
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: labelEn, font: "Times New Roman", italics: true, size: 15 }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 300, type: WidthType.DXA },
          borders: noCellBorders,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: ":", font: FONT_FAMILY, bold: true, size: 17 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 6446, type: WidthType.DXA },
          borders: noCellBorders,
          children: (value || "-").split("\n").map((line, idx, arr) =>
            new Paragraph({
              spacing: { after: idx === arr.length - 1 ? 40 : 10 },
              children: [
                new TextRun({
                  text: line || " ",
                  font: FONT_FAMILY,
                  bold: isBold,
                  size: 17,
                }),
              ],
            })
          ),
        }),
      ],
    });
  };

  const fieldsTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: noTableBorders,
    columnWidths: [3800, 300, 6446],
    rows: [
      makeFieldRow("Nama komoditas/media pembawa", "Commodity/article", data.commodity || "-"),
      makeFieldRow("Nomor peti kemas", "Container number", data.containerNumber || "-"),
      makeFieldRow("Alat angkut", "Carrier/vessel", data.carrierVessel || "-"),
      makeFieldRow("Area / Lokasi fumigasi", "Area/Location of Fumigation", data.fumigationArea || "-"),
      makeFieldRow(
        "Fumigan yang digunakan",
        "Fumigant",
        data.fumigant || "Methyl Bromide (CH3Br)"
      ),
      makeFieldRow(
        "Waktu dimulainya fumigasi",
        "Commencing at (dd/mm/yyyy - HH:MM)",
        formatDateTime(data.commencingAt)
      ),
      makeFieldRow(
        "Waktu selesainya fumigasi",
        "Completed at (dd/mm/yyyy - HH:MM)",
        formatDateTime(data.completedAt)
      ),
    ],
  });

  // 6. Declarations
  const declarationParagraphs = [
    new Paragraph({
      spacing: { before: 120, after: 20 },
      children: [
        new TextRun({
          text: GAS_CLEARANCE_STATIC_TEXT.declaration1Id,
          font: FONT_FAMILY,
          size: 16,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: GAS_CLEARANCE_STATIC_TEXT.declaration1En,
          font: "Times New Roman",
          italics: true,
          size: 15,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: GAS_CLEARANCE_STATIC_TEXT.declaration2Id,
          font: FONT_FAMILY,
          size: 16,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: GAS_CLEARANCE_STATIC_TEXT.declaration2En,
          font: "Times New Roman",
          italics: true,
          size: 15,
        }),
      ],
    }),
  ];

  // 7. Gas Concentration Result (Left-Aligned, matching Barantin layout)
  const gasResultParagraph = new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 80, after: 120 },
    children: [
      new TextRun({
        text: `${GAS_CLEARANCE_STATIC_TEXT.gasLevelLabelId} / `,
        font: FONT_FAMILY,
        bold: true,
        size: 17,
      }),
      new TextRun({
        text: `${GAS_CLEARANCE_STATIC_TEXT.gasLevelLabelEn} : `,
        font: "Times New Roman",
        bold: true,
        italics: true,
        size: 17,
      }),
      new TextRun({
        text: gasReading,
        font: FONT_FAMILY,
        bold: true,
        size: 17,
      }),
    ],
  });

  // 8. Signature Block Table (no stamp for draft)
  const signatureImages: ImageRun[] = [];
  if (signatureBytes) {
    signatureImages.push(
      new ImageRun({
        data: signatureBytes.data,
        transformation: { width: 110, height: 60 },
        type: signatureBytes.type,
      })
    );
  }

  const signatureTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: noTableBorders,
    columnWidths: [4546, 6000],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 4546, type: WidthType.DXA },
            borders: noCellBorders,
            children: [new Paragraph({})],
          }),
          new TableCell({
            width: { size: 6000, type: WidthType.DXA },
            borders: noCellBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 10 },
                children: [
                  new TextRun({
                    text: GAS_CLEARANCE_STATIC_TEXT.fumigationCompanyId,
                    font: FONT_FAMILY,
                    size: 17,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: GAS_CLEARANCE_STATIC_TEXT.fumigationCompanyEn,
                    font: "Times New Roman",
                    italics: true,
                    size: 15,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 },
                children: signatureImages.length > 0 ? signatureImages : [new TextRun({ text: "" })],
              }),
              new Table({
                width: { size: 6000, type: WidthType.DXA },
                borders: noTableBorders,
                columnWidths: [2900, 200, 2900],
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 2900, type: WidthType.DXA },
                        borders: borderTopOnly,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 20, after: 10 },
                            children: [
                              new TextRun({
                                text: GAS_CLEARANCE_STATIC_TEXT.stampLabelId,
                                font: FONT_FAMILY,
                                size: 15,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: GAS_CLEARANCE_STATIC_TEXT.stampLabelEn,
                                font: "Times New Roman",
                                italics: true,
                                size: 14,
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 200, type: WidthType.DXA },
                        borders: noCellBorders,
                        children: [new Paragraph({})],
                      }),
                      new TableCell({
                        width: { size: 2900, type: WidthType.DXA },
                        borders: borderTopOnly,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 20, after: 10 },
                            children: [
                              new TextRun({
                                text: data.fumigatorName || "",
                                font: FONT_FAMILY,
                                bold: true,
                                size: 16,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: GAS_CLEARANCE_STATIC_TEXT.signatureLabel,
                                font: "Times New Roman",
                                italics: true,
                                size: 14,
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // 9. Footer Bar (Barantin Digital QR & Verification)
  const qrImageRuns: ImageRun[] = [];
  if (qrBytes) {
    qrImageRuns.push(
      new ImageRun({
        data: qrBytes.data,
        transformation: { width: 56, height: 56 },
        type: qrBytes.type,
      })
    );
  }

  const footerTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: footerTableBorders,
    columnWidths: [800, 9746],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 800, type: WidthType.DXA },
            borders: noCellBorders,
            children: [
              new Paragraph({
                spacing: { before: 40 },
                children: qrImageRuns.length > 0 ? qrImageRuns : [new TextRun({ text: "QR", font: FONT_FAMILY, size: 12 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 9746, type: WidthType.DXA },
            borders: noCellBorders,
            children: [
              new Paragraph({
                spacing: { before: 40, after: 20 },
                children: [
                  new TextRun({
                    text: GAS_CLEARANCE_STATIC_TEXT.barantinText,
                    font: FONT_FAMILY,
                    bold: true,
                    size: 15,
                  }),
                ],
              }),
              ...(verificationLink
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `${GAS_CLEARANCE_STATIC_TEXT.barantinNote} `,
                          font: FONT_FAMILY,
                          size: 14,
                        }),
                        new TextRun({
                          text: verificationLink,
                          font: FONT_FAMILY,
                          color: PRIMARY_BLUE,
                          underline: { type: UnderlineType.SINGLE },
                          size: 14,
                        }),
                      ],
                    }),
                  ]
                : []),
            ],
          }),
        ],
      }),
    ],
  });

  return [
    ...headerElements,
    metaTable,
    ...titleParagraphs,
    ...salutationParagraphs,
    fieldsTable,
    ...declarationParagraphs,
    gasResultParagraph,
    signatureTable,
    new Paragraph({ spacing: { after: 140 }, children: [] }),
    footerTable,
  ];
}

export async function generateGasClearanceDocxBlob(
  data: GasClearanceCertificateData
): Promise<Blob> {
  const children = await createGasClearanceDocxElements(data);
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4 in dxa
              height: 16838,
            },
            margin: {
              top: 480, // ~24pt
              bottom: 440,
              left: 680, // ~34pt
              right: 680,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
