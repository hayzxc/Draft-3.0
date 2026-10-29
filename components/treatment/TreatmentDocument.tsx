import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { format } from "date-fns";
import { CERTIFICATE_CONSTANTS } from "@/lib/certificate-constants";
import { cleanPastedText, formatConsigneeDisplay, parseConsigneeAndNotifyParty } from "@/lib/form-helpers";
import { GasClearancePdfPage } from "@/components/certificate/CertificateDocument";
import { mapTreatmentToGasClearanceData } from "@/lib/treatment-bundle-helpers";

const PRIMARY_BLUE = "#0850A2";

const styles = StyleSheet.create({
  page: {
    width: "210mm",
    height: "297mm",
    paddingTop: 24,
    paddingBottom: 22,
    paddingLeft: 34,
    paddingRight: 34,
    fontFamily: "Helvetica",
    fontSize: 7,
    color: "#000000",
    lineHeight: 1.2,
  },
  topSerialRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 3,
  },
  topSerialText: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: "#000000",
  },
  topSerialBold: {
    fontFamily: "Helvetica-Bold",
  },
  mainTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_BLUE,
    textAlign: "left",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_BLUE,
    marginTop: 4,
    marginBottom: 2,
  },
  table: {
    width: "100%",
    borderWidth: 0.75,
    borderColor: "#000000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.75,
    borderBottomColor: "#000000",
    minHeight: 12,
  },
  tableRowLast: {
    flexDirection: "row",
    minHeight: 12,
  },
  cell: {
    padding: 3,
    borderRightWidth: 0.75,
    borderRightColor: "#000000",
    justifyContent: "flex-start",
  },
  cellLast: {
    padding: 3,
    justifyContent: "flex-start",
  },
  headerCellDark: {
    backgroundColor: "#000000",
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    padding: 3,
    textAlign: "left",
  },
  textRegular: {
    fontSize: 6.8,
    fontFamily: "Helvetica",
    color: "#000000",
    lineHeight: 1.25,
  },
  textBold: {
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    lineHeight: 1.25,
  },
  declarationContainer: {
    marginTop: 4,
    marginBottom: 3,
  },
  declarationLine: {
    fontSize: 6.8,
    fontFamily: "Helvetica",
    color: "#000000",
    lineHeight: 1.25,
  },
  signatureTable: {
    width: "100%",
    borderWidth: 0.75,
    borderColor: "#000000",
    flexDirection: "row",
  },
  sigLeftBlock: {
    width: "75%",
    borderRightWidth: 0.75,
    borderRightColor: "#000000",
  },
  sigRightBlock: {
    width: "25%",
  },
  sigSubRowTop: {
    height: 60,
    flexDirection: "row",
    borderBottomWidth: 0.75,
    borderBottomColor: "#000000",
  },
  sigSubRowMiddle: {
    height: 15,
    flexDirection: "row",
    borderBottomWidth: 0.75,
    borderBottomColor: "#000000",
  },
  sigSubRowBottom: {
    height: 15,
    flexDirection: "row",
  },
  sigSubColLabel: {
    width: "26.67%",
    borderRightWidth: 0.75,
    borderRightColor: "#000000",
    justifyContent: "center",
    padding: 3,
  },
  sigSubColValue: {
    width: "73.33%",
    justifyContent: "center",
    padding: 3,
  },
  signatureImage: {
    maxHeight: 50,
    maxWidth: 140,
    objectFit: "contain",
  },
  qrBox: {
    height: 60,
    borderBottomWidth: 0.75,
    borderBottomColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
  },
  qrImage: {
    width: 52,
    height: 52,
    objectFit: "contain",
  },
  dateBox: {
    height: 30,
    justifyContent: "center",
    padding: 3,
  },
  additionalDeclSection: {
    marginTop: 4,
  },
  additionalDeclText: {
    fontSize: 7,
    fontFamily: "Helvetica",
    color: "#000000",
    lineHeight: 1.2,
  },
  footerSection: {
    marginTop: 5,
    borderTopWidth: 0.75,
    borderTopColor: "#000000",
    paddingTop: 3,
  },
  footerText: {
    fontSize: 6.2,
    fontFamily: "Helvetica",
    color: "#000000",
    lineHeight: 1.25,
  },
  footerLink: {
    fontSize: 6.2,
    fontFamily: "Helvetica",
    color: PRIMARY_BLUE,
    textDecoration: "underline",
    marginTop: 1,
  },
});

export interface TreatmentCertificateData {
  id?: string;
  serialNo?: string | null;
  dateIssued?: Date | string | null;
  certificateNumber?: string | null;
  consignmentLinkPpk?: string | null;
  consignmentLinkDo?: string | null;
  consignmentLinkBl?: string | null;
  consignmentLinkOther?: string | null;
  containers?: string | null;
  consignee?: string | null;
  notifyParty?: string | null;
  sealNumbers?: string | null;
  carrierVessel?: string | null;
  clientNameAddress?: string | null;
  commodityDescription?: string | null;
  originCountry?: string | null;
  destinationCountry?: string | null;
  portOfLoading?: string | null;
  portOfUnloading?: string | null;
  targetOfFumigation?: string | null;
  enclosureType?: string | null;
  prescribedDoseRate?: string | null;
  prescribedExposurePeriod?: string | null;
  prescribedTemperature?: string | null;
  appliedDose?: string | null;
  appliedExposurePeriod?: string | null;
  appliedTemperature?: string | null;
  placeOfFumigation?: string | null;
  commencingAt?: Date | string | null;
  completedAt?: Date | string | null;
  finalTlvReading?: string | null;
  fumigatorName?: string | null;
  fumigatorAccreditationNumber?: string | null;
  fumigatorSignatureUrl?: string | null;
  additionalDeclarations?: string | null;
  verificationUrl?: string | null;
  qrCodeDataUrl?: string | null;
  stampImageUrl?: string | null;
  logoImageUrl?: string | null;
  includeGasClearance?: boolean | null;
  gcCertificateNumber?: string | null;
  gcRegistrationNumber?: string | null;
  gcGasLevelReading?: string | null;
  gcFumigant?: string | null;
  gcSerialNo?: string | null;
}

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

const wrapLongWords = (text: string | null | undefined, maxWordLen = 25): string => {
  if (!text) return "";
  return String(text)
    .split("\n")
    .map((line) =>
      line
        .split(" ")
        .map((word) => {
          if (word.length <= maxWordLen) return word;
          let res = "";
          for (let i = 0; i < word.length; i += maxWordLen) {
            res += (i > 0 ? "\u200B" : "") + word.slice(i, i + maxWordLen);
          }
          return res;
        })
        .join(" ")
    )
    .join("\n");
};

const formatContinuousDisplay = (text: string | null | undefined): string => {
  if (!text) return "";
  return cleanPastedText(text, false);
};

const renderMultiLineText = (text: string | null | undefined, maxWordLen = 25) => {
  const cleaned = formatContinuousDisplay(text);
  if (!cleaned) return <Text style={styles.textBold}>-</Text>;
  const lines = cleaned.split("\n");
  return lines.map((line, idx) => (
    <Text key={idx} style={styles.textBold}>
      {wrapLongWords(line, maxWordLen) || " "}
    </Text>
  ));
};

export const TreatmentDocument: React.FC<{ data: TreatmentCertificateData }> = ({
  data,
}) => {
  const verificationLink = data.verificationUrl?.trim() || "";
  const parsedConsignee = parseConsigneeAndNotifyParty(data.consignee);
  const displayConsignee =
    data.notifyParty !== undefined && data.notifyParty !== null
      ? data.consignee
      : parsedConsignee.consignee;
  const displayNotifyParty =
    data.notifyParty !== undefined && data.notifyParty !== null
      ? data.notifyParty
      : parsedConsignee.notifyParty;

  return (
    <Document title={`Treatment-Cert-${data.certificateNumber || "Draft"}`}>
      <Page size="A4" style={styles.page}>
        {/* Top line: Serial No and Date issued */}
        <View style={styles.topSerialRow}>
          <Text style={styles.topSerialText}>
            Serial No. <Text style={styles.topSerialBold}>{data.serialNo || "-"}</Text> | Date issued (dd/mm/yyyy):{" "}
            <Text style={styles.topSerialBold}>{formatDate(data.dateIssued)}</Text>
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.mainTitle}>TREATMENT CERTIFICATE - Methyl Bromide Fumigation</Text>

        {/* Table 1: Certificate number & Treatment provider ID number */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: "50%", backgroundColor: "#000000" }]}>
              <Text style={styles.headerCellDark}>Certificate number</Text>
            </View>
            <View style={[styles.cellLast, { width: "50%", backgroundColor: "#000000" }]}>
              <Text style={styles.headerCellDark}>Treatment provider ID number</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={[styles.cell, { width: "50%", padding: 3 }]}>
              <Text style={styles.textBold}>{wrapLongWords(data.certificateNumber || "-", 25)}</Text>
            </View>
            <View style={[styles.cellLast, { width: "50%", padding: 3 }]}>
              <Text style={styles.textBold}>{CERTIFICATE_CONSTANTS.registrationNumber}</Text>
            </View>
          </View>
        </View>

        {/* Section 1: Consignment details */}
        <Text style={styles.sectionTitle}>Consignment details</Text>
        <View style={styles.table}>
          {/* Row 1: Consignment link */}
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: "31%" }]}>
              <Text style={styles.textRegular}>Consignment link (container numbers if applicable)</Text>
            </View>
            <View style={[styles.cellLast, { width: "69%", padding: 3 }]}>
              {data.consignmentLinkPpk?.trim() ? (
                <Text style={styles.textRegular}>
                  No. PTK Karantina (PPK) : <Text style={styles.textBold}>{wrapLongWords(data.consignmentLinkPpk, 25)}</Text>
                </Text>
              ) : null}
              <Text style={styles.textRegular}>
                No. DO : <Text style={styles.textBold}>{wrapLongWords(data.consignmentLinkDo || "-", 25)}</Text>
              </Text>
              {data.consignmentLinkBl?.trim() ? (
                <Text style={styles.textRegular}>
                  No. BL (Bill of Lading) : <Text style={styles.textBold}>{wrapLongWords(data.consignmentLinkBl, 25)}</Text>
                </Text>
              ) : null}
              <Text style={styles.textRegular}>
                Containers : <Text style={styles.textBold}>{wrapLongWords(data.containers || "-", 25)}</Text>
              </Text>
              {data.consignmentLinkOther?.trim() ? (
                <Text style={styles.textBold}>
                  {wrapLongWords(data.consignmentLinkOther, 25)}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Row 2: Seal and Carrier */}
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: "31%" }]}>
              <Text style={styles.textRegular}>Seal numbers(s) and Carrier/vessel (if applicable)</Text>
            </View>
            <View style={[styles.cellLast, { width: "69%", padding: 3 }]}>
              <Text style={styles.textRegular}>
                Seal numbers : <Text style={styles.textBold}>{wrapLongWords(data.sealNumbers || "-", 25)}</Text>
              </Text>
              <Text style={styles.textRegular}>
                Carrier/vessel : <Text style={styles.textBold}>{wrapLongWords(data.carrierVessel || "-", 25)}</Text>
              </Text>
            </View>
          </View>

          {/* Row 3: Client name and address */}
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: "31%" }]}>
              <Text style={styles.textRegular}>Client name and address</Text>
            </View>
            <View style={[styles.cellLast, { width: "69%" }]}>
              {renderMultiLineText(data.clientNameAddress)}
            </View>
          </View>

          {/* Row 4: Consignee */}
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: "31%" }]}>
              <Text style={styles.textRegular}>Consignee</Text>
            </View>
            <View style={[styles.cellLast, { width: "69%" }]}>
              {renderMultiLineText(displayConsignee)}
            </View>
          </View>

          {/* Row 5: Notify party */}
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: "31%" }]}>
              <Text style={styles.textRegular}>Notify party</Text>
            </View>
            <View style={[styles.cellLast, { width: "69%" }]}>
              {renderMultiLineText(displayNotifyParty)}
            </View>
          </View>

          {/* Row 6: Commodity description and quantity */}
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: "31%" }]}>
              <Text style={styles.textRegular}>Commodity description and quantity</Text>
            </View>
            <View style={[styles.cellLast, { width: "69%" }]}>
              {renderMultiLineText(data.commodityDescription)}
            </View>
          </View>

          {/* Row 5: 4 columns for Origin/Destination and Loading/Unloading */}
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: "31%" }]}>
              <Text style={styles.textRegular}>Commodity country of origin</Text>
              <Text style={styles.textRegular}>Destination country</Text>
            </View>
            <View style={[styles.cell, { width: "24%" }]}>
              <Text style={styles.textBold}>{data.originCountry || "-"}</Text>
              <Text style={styles.textBold}>{data.destinationCountry || "-"}</Text>
            </View>
            <View style={[styles.cell, { width: "21%" }]}>
              <Text style={styles.textRegular}>Port of loading</Text>
              <Text style={styles.textRegular}>Port of unloading</Text>
            </View>
            <View style={[styles.cellLast, { width: "24%" }]}>
              <Text style={styles.textBold}>{data.portOfLoading || "-"}</Text>
              <Text style={styles.textBold}>{data.portOfUnloading || "-"}</Text>
            </View>
          </View>

          {/* Row 6: Target and Enclosure */}
          <View style={styles.tableRowLast}>
            <View style={[styles.cell, { width: "31%" }]}>
              <Text style={styles.textRegular}>Target of fumigation</Text>
            </View>
            <View style={[styles.cell, { width: "24%" }]}>
              <Text style={styles.textBold}>{data.targetOfFumigation || "-"}</Text>
            </View>
            <View style={[styles.cell, { width: "21%" }]}>
              <Text style={styles.textRegular}>Enclosure type</Text>
            </View>
            <View style={[styles.cellLast, { width: "24%" }]}>
              <Text style={styles.textBold}>{data.enclosureType || "-"}</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Treatment schedule */}
        <Text style={styles.sectionTitle}>Treatment schedule (prescribed/specified treatment schedule)</Text>
        <View style={styles.table}>
          <View style={styles.tableRowLast}>
            <View style={[styles.cell, { width: "14%" }]}>
              <Text style={styles.textRegular}>Dose rate</Text>
            </View>
            <View style={[styles.cell, { width: "19%" }]}>
              <Text style={styles.textBold}>{data.prescribedDoseRate || "-"}</Text>
            </View>
            <View style={[styles.cell, { width: "17%" }]}>
              <Text style={styles.textRegular}>Exposure period</Text>
            </View>
            <View style={[styles.cell, { width: "17%" }]}>
              <Text style={styles.textBold}>{data.prescribedExposurePeriod || "-"}</Text>
            </View>
            <View style={[styles.cell, { width: "16%" }]}>
              <Text style={styles.textRegular}>Temperature</Text>
            </View>
            <View style={[styles.cellLast, { width: "17%" }]}>
              <Text style={styles.textBold}>{data.prescribedTemperature || "-"}</Text>
            </View>
          </View>
        </View>

        {/* Section 3: Fumigation details */}
        <Text style={styles.sectionTitle}>Fumigation details (treatment applied)</Text>
        <View style={styles.table}>
          {/* Row 1: Applied values */}
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: "14%" }]}>
              <Text style={styles.textRegular}>Applied dose</Text>
            </View>
            <View style={[styles.cell, { width: "19%" }]}>
              <Text style={styles.textBold}>{data.appliedDose || "-"}</Text>
            </View>
            <View style={[styles.cell, { width: "17%" }]}>
              <Text style={styles.textRegular}>Exposure period</Text>
            </View>
            <View style={[styles.cell, { width: "17%" }]}>
              <Text style={styles.textBold}>{data.appliedExposurePeriod || "-"}</Text>
            </View>
            <View style={[styles.cell, { width: "16%" }]}>
              <Text style={styles.textRegular}>Temperature</Text>
            </View>
            <View style={[styles.cellLast, { width: "17%" }]}>
              <Text style={styles.textBold}>{data.appliedTemperature || "-"}</Text>
            </View>
          </View>

          {/* Row 2: Place of fumigation */}
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: "31%" }]}>
              <Text style={styles.textRegular}>Place of fumigation (Full address)</Text>
            </View>
            <View style={[styles.cellLast, { width: "69%" }]}>
              <Text style={styles.textBold}>{wrapLongWords(formatContinuousDisplay(data.placeOfFumigation) || "-", 25)}</Text>
            </View>
          </View>

          {/* Row 3: Commenced & Completed */}
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: "31%", padding: 3 }]}>
              <View style={{ marginBottom: 2 }}>
                <Text style={styles.textRegular}>Date and time fumigation commenced</Text>
                <Text style={styles.textRegular}>(dd/mm/yyyy - HH:MM)</Text>
              </View>
              <View>
                <Text style={styles.textRegular}>Date and time fumigation completed</Text>
                <Text style={styles.textRegular}>(dd/mm/yyyy - HH:MM)</Text>
              </View>
            </View>
            <View style={[styles.cellLast, { width: "69%", padding: 3 }]}>
              <View style={{ marginBottom: 2, height: 16, justifyContent: "center" }}>
                <Text style={styles.textBold}>{formatDateTime(data.commencingAt)}</Text>
              </View>
              <View style={{ height: 16, justifyContent: "center" }}>
                <Text style={styles.textBold}>{formatDateTime(data.completedAt)}</Text>
              </View>
            </View>
          </View>

          {/* Row 4: Final TLV */}
          <View style={styles.tableRowLast}>
            <View style={[styles.cell, { width: "31%" }]}>
              <Text style={styles.textRegular}>Final TLV reading (ppm)</Text>
            </View>
            <View style={[styles.cellLast, { width: "69%" }]}>
              <Text style={styles.textBold}>{wrapLongWords(data.finalTlvReading || "-", 25)}</Text>
            </View>
          </View>
        </View>

        {/* Section 4: Declaration */}
        <View style={styles.declarationContainer}>
          <Text style={styles.sectionTitle}>Declaration</Text>
          <Text style={styles.declarationLine}>I, the fumigator-in-charge declare:</Text>
          <Text style={styles.declarationLine}>
            1. The fumigation certified was conducted in accordance with the treatment schedule, import conditions, and all the requirements in the Methyl
          </Text>
          <Text style={styles.declarationLine}>
            Bromide Fumigation Methodology, and
          </Text>
          <Text style={styles.declarationLine}>2. The information I have provided is true and correct.</Text>
        </View>

        {/* Table 5: Signature & QR Code Box */}
        <View style={styles.signatureTable}>
          {/* Left Block (75%) */}
          <View style={styles.sigLeftBlock}>
            {/* Signature Area */}
            <View style={styles.sigSubRowTop}>
              <View style={styles.sigSubColLabel}>
                <Text style={[styles.textBold, { textAlign: "center" }]}>Signature</Text>
              </View>
              <View style={styles.sigSubColValue}>
                {data.fumigatorSignatureUrl && (
                  <Image src={data.fumigatorSignatureUrl} style={styles.signatureImage} />
                )}
              </View>
            </View>

            {/* Full Name */}
            <View style={styles.sigSubRowMiddle}>
              <View style={styles.sigSubColLabel}>
                <Text style={[styles.textBold, { textAlign: "right" }]}>Full name</Text>
              </View>
              <View style={styles.sigSubColValue}>
                <Text style={styles.textBold}>{wrapLongWords(data.fumigatorName || "-", 25)}</Text>
              </View>
            </View>

            {/* Accreditation Number */}
            <View style={styles.sigSubRowBottom}>
              <View style={styles.sigSubColLabel}>
                <Text style={[styles.textBold, { textAlign: "right" }]}>Accreditation number</Text>
              </View>
              <View style={styles.sigSubColValue}>
                <Text style={styles.textBold}>{wrapLongWords(data.fumigatorAccreditationNumber || "-", 25)}</Text>
              </View>
            </View>
          </View>

          {/* Right Block (25%): QR Code & Date */}
          <View style={styles.sigRightBlock}>
            <View style={styles.qrBox}>
              {data.qrCodeDataUrl ? (
                <Image src={data.qrCodeDataUrl} style={styles.qrImage} />
              ) : null}
            </View>
            <View style={styles.dateBox}>
              <Text style={styles.textRegular}>Date (dd/mm/yyyy):</Text>
              <Text style={styles.textBold}>{formatDate(data.dateIssued)}</Text>
            </View>
          </View>
        </View>

        {/* Section 5: Additional Declarations */}
        <View style={styles.additionalDeclSection}>
          <Text style={styles.sectionTitle}>Additional Declarations</Text>
          <Text style={styles.additionalDeclText}>
            {wrapLongWords(
              data.additionalDeclarations || "-",
              35
            )}
          </Text>
        </View>

        {/* Footer: Barantin / Fumi Trust */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>
            Printed digitally through: <Text style={styles.textBold}>FUMI TRUST by BARANTIN</Text>.
          </Text>
          {verificationLink ? (
            <Text style={styles.footerLink}>{wrapLongWords(verificationLink, 40)}</Text>
          ) : null}
        </View>
      </Page>
      {data.includeGasClearance !== false && (
        <GasClearancePdfPage data={mapTreatmentToGasClearanceData(data)} />
      )}
    </Document>
  );
};

export default TreatmentDocument;
