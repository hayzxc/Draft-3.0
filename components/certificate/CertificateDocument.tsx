import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer";
import { format } from "date-fns";
import { GAS_CLEARANCE_STATIC_TEXT } from "@/lib/certificate-static-text";
import {
  needsAttachment,
  getCommodityDisplay,
  getGasSummary,
  getContainerSummary,
  needsContainerAttachment,
} from "@/lib/attachment/attachment";
import { AttachmentPage } from "@/components/pdf/AttachmentPage";

const PRIMARY_BLUE = "#0047AB";

const styles = StyleSheet.create({
  page: {
    width: 595.28, // A4 width
    height: 841.89, // A4 height
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 32,
    paddingRight: 32,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#000000",
    lineHeight: 1.2,
  },
  headerImage: {
    width: "100%",
    maxHeight: 70,
    objectFit: "contain",
    marginBottom: 4,
  },
  topMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 4,
    marginBottom: 6,
  },
  metaLeft: {
    width: "55%",
  },
  metaRight: {
    width: "45%",
    alignItems: "flex-end",
    textAlign: "right",
  },
  metaText: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#000000",
    lineHeight: 1.25,
  },
  metaBold: {
    fontFamily: "Helvetica-Bold",
  },
  titleContainer: {
    textAlign: "center",
    marginTop: 6,
    marginBottom: 8,
  },
  titleId: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    textAlign: "center",
    textDecoration: "underline",
  },
  titleEn: {
    fontSize: 10,
    fontFamily: "Times-Italic",
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 2,
    color: "#222222",
  },
  salutationContainer: {
    marginBottom: 6,
  },
  salutationTextId: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#000000",
  },
  salutationTextEn: {
    fontSize: 7.5,
    fontFamily: "Times-Italic",
    color: "#444444",
    marginTop: 1,
  },
  fieldsContainer: {
    marginTop: 4,
    marginBottom: 6,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "flex-start",
  },
  fieldLabelBox: {
    width: "38%",
    paddingRight: 4,
  },
  fieldLabelId: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#000000",
  },
  fieldLabelEn: {
    fontSize: 7.5,
    fontFamily: "Times-Italic",
    color: "#444444",
    marginTop: 0.5,
  },
  fieldColon: {
    width: "3%",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  fieldValueBox: {
    width: "59%",
  },
  fieldValueBold: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    lineHeight: 1.2,
  },
  declarationsContainer: {
    marginTop: 4,
    marginBottom: 6,
  },
  declarationBlock: {
    marginBottom: 4,
  },
  declarationTextId: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#000000",
    lineHeight: 1.2,
    textAlign: "justify",
  },
  declarationTextEn: {
    fontSize: 7.5,
    fontFamily: "Times-Italic",
    color: "#444444",
    lineHeight: 1.2,
    textAlign: "justify",
    marginTop: 1,
  },
  gasLevelResultBox: {
    flexDirection: "row",
    marginTop: 6,
    marginBottom: 6,
    alignItems: "flex-start",
  },
  gasLevelResultLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  gasLevelResultLabelEn: {
    fontSize: 8.5,
    fontFamily: "Times-BoldItalic",
    color: "#000000",
  },
  gasLevelResultValue: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    marginBottom: 8,
  },
  signatureBox: {
    width: "55%",
    alignItems: "center",
    textAlign: "center",
  },
  companyHeadingId: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#000000",
  },
  companyHeadingEn: {
    fontSize: 7.5,
    fontFamily: "Times-Italic",
    color: "#444444",
    marginBottom: 2,
  },
  stampSignatureArea: {
    height: 58,
    width: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
  },
  stampImage: {
    position: "absolute",
    width: 52,
    height: 52,
    opacity: 0.85,
    left: 20,
  },
  signatureImage: {
    position: "absolute",
    maxHeight: 52,
    maxWidth: 100,
    objectFit: "contain",
  },
  signColumns: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginTop: 2,
  },
  signCol: {
    width: "48%",
    alignItems: "center",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#000000",
    paddingTop: 2,
  },
  signColTitle: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#000000",
  },
  signColTitleBold: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  signColSubtitle: {
    fontSize: 7,
    fontFamily: "Times-Italic",
    color: "#444444",
    marginTop: 1,
  },
  footerBar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 0.75,
    borderTopColor: "#999999",
    paddingTop: 4,
    marginTop: 12,
  },
  footerQr: {
    width: 48,
    height: 48,
    marginRight: 8,
    objectFit: "contain",
  },
  footerQrPlaceholder: {
    width: 48,
    height: 48,
    borderWidth: 0.5,
    borderColor: "#cccccc",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  footerContent: {
    flex: 1,
  },
  footerPrintedBy: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    marginBottom: 1,
  },
  footerNote: {
    fontSize: 6.8,
    fontFamily: "Helvetica",
    color: "#444444",
    lineHeight: 1.2,
  },
  footerLink: {
    fontSize: 6.8,
    fontFamily: "Helvetica",
    color: PRIMARY_BLUE,
    textDecoration: "underline",
  },
  pageNumberText: {
    fontSize: 6.8,
    fontFamily: "Helvetica",
    color: "#555555",
    marginTop: 2,
    textAlign: "right",
  },
});

export interface GasClearanceContainerItem {
  id?: string;
  containerNumber: string;
  sealNumber?: string;
  tlvPpm?: number | string;
}

export interface GasClearanceCertificateData {
  id?: string;
  serialNo?: string | null;
  certificateNumber?: string | null;
  registrationNumber?: string | null;
  certificateDate?: Date | string | null;
  noticeRef?: string | null;
  commodity?: string | null;
  containerNumber?: string | null;
  sealNumber?: string | null;
  carrierVessel?: string | null;
  fumigationArea?: string | null;
  fumigant?: string | null;
  commencingAt?: Date | string | null;
  completedAt?: Date | string | null;
  gasLevelPpm?: number | string | null;
  gasLevelReading?: string | null;
  hasAttachment?: boolean | null;
  containersJson?: string | null;
  containers?: GasClearanceContainerItem[];
  fumigatorName?: string | null;
  fumigatorSignatureUrl?: string | null;
  stampImageUrl?: string | null;
  logoImageUrl?: string | null;
  verificationUrl?: string | null;
  qrCodeDataUrl?: string | null;
}

export const parseContainersJson = (
  containersJson?: string | null,
  fallbackContainerNumber?: string | null,
  fallbackSealNumber?: string | null,
  fallbackTlv?: number | string | null
): GasClearanceContainerItem[] => {
  if (containersJson?.trim()) {
    try {
      const parsed = JSON.parse(containersJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          id: item.id || String(idx + 1),
          containerNumber: item.containerNumber || "",
          sealNumber: item.sealNumber || "",
          tlvPpm: item.tlvPpm !== undefined && item.tlvPpm !== null ? item.tlvPpm : "0",
        }));
      }
    } catch {
      // ignore
    }
  }

  if (fallbackContainerNumber?.trim()) {
    const items = fallbackContainerNumber
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length > 1) {
      const seals = (fallbackSealNumber || "").split(/[\n,]+/).map((s) => s.trim());
      return items.map((c, i) => ({
        id: String(i + 1),
        containerNumber: c,
        sealNumber: seals[i] || fallbackSealNumber || "",
        tlvPpm: fallbackTlv !== undefined && fallbackTlv !== null ? fallbackTlv : "0",
      }));
    }
    return [
      {
        id: "1",
        containerNumber: fallbackContainerNumber.trim(),
        sealNumber: fallbackSealNumber?.trim() || "",
        tlvPpm: fallbackTlv !== undefined && fallbackTlv !== null ? fallbackTlv : "0",
      },
    ];
  }

  return [];
};

export const shouldShowGasClearanceAttachment = (data: GasClearanceCertificateData): boolean => {
  if (data.hasAttachment === true) return true;
  return needsAttachment(data.commodity);
};

export const formatPage1CommodityLines = (
  commodity: string | null | undefined,
  isAttachmentActive: boolean
): string[] => {
  if (!isAttachmentActive) return (commodity || "-").split("\n");
  return getCommodityDisplay(commodity).displayLines;
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

export const GasClearancePdfPage: React.FC<{
  data: GasClearanceCertificateData;
  isAttachmentActive?: boolean;
}> = ({ data, isAttachmentActive: isAttachmentActiveProp }) => {
  const logoUrl = data.logoImageUrl || "/images/letterhead.jpg";
  const verificationLink = data.verificationUrl?.trim() || "";
  const containers = parseContainersJson(
    data.containersJson,
    data.containerNumber,
    data.sealNumber,
    data.gasLevelPpm
  );

  const isAttachmentActive =
    isAttachmentActiveProp !== undefined
      ? isAttachmentActiveProp
      : shouldShowGasClearanceAttachment(data);
  const isContainerAttachmentActive = isAttachmentActive && needsContainerAttachment(containers);
  const isCommodityAttachmentActive = isAttachmentActive && needsAttachment(data.commodity);

  let gasReading =
    data.gasLevelReading?.trim() ||
    (data.gasLevelPpm !== null && data.gasLevelPpm !== undefined && data.gasLevelPpm !== ""
      ? (data.containerNumber?.trim()
          ? `${data.containerNumber.trim()}: ${data.gasLevelPpm} ppm`
          : `${data.gasLevelPpm} ppm`)
      : "");

  if (isContainerAttachmentActive) {
    const ppms = containers.map((c) => Number(c.tlvPpm ?? 0)).filter((n) => !isNaN(n));
    gasReading = getGasSummary(ppms.length > 0 ? ppms : [Number(data.gasLevelPpm) || 0]);
  }

  const containerDisplay = isContainerAttachmentActive
    ? getContainerSummary(containers.length || 1)
    : (data.containerNumber || "-");

  const page1CommodityLines = formatPage1CommodityLines(data.commodity, isCommodityAttachmentActive);

  return (
    <Page size="A4" style={styles.page}>
      {/* 1. Official Letterhead */}
      {logoUrl && <Image src={logoUrl} style={styles.headerImage} />}

        {/* 2. Top Metadata */}
        <View style={styles.topMetaRow}>
          <View style={styles.metaLeft}>
            <Text style={styles.metaText}>
              Serial No. <Text style={styles.metaBold}>{data.serialNo || "-"}</Text>
            </Text>
            {data.noticeRef?.trim() ? (
              <Text style={styles.metaText}>
                Ref. Notice / Notice Ref. :{" "}
                <Text style={styles.metaBold}>{data.noticeRef.trim()}</Text>
              </Text>
            ) : null}
            <Text style={styles.metaText}>Nomor GC / GC Number :</Text>
            <Text style={[styles.metaText, styles.metaBold]}>
              {data.certificateNumber || "-"}
            </Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaText}>
              Nomor Registrasi / Registration Number :{" "}
              <Text style={styles.metaBold}>
                {data.registrationNumber || "ID0018MB"}
              </Text>
            </Text>
            <Text style={styles.metaText}>
              Tanggal / Date (dd/mm/yyyy) :{" "}
              <Text style={styles.metaBold}>{formatDate(data.certificateDate)}</Text>
            </Text>
          </View>
        </View>

        {/* 3. Certificate Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleId}>{GAS_CLEARANCE_STATIC_TEXT.titleId}</Text>
          <Text style={styles.titleEn}>{GAS_CLEARANCE_STATIC_TEXT.titleEn}</Text>
        </View>

        {/* 4. Salutation / Opening */}
        <View style={styles.salutationContainer}>
          <Text style={styles.salutationTextId}>
            {GAS_CLEARANCE_STATIC_TEXT.headingId}
          </Text>
          <Text style={styles.salutationTextEn}>
            {GAS_CLEARANCE_STATIC_TEXT.headingEn}
          </Text>
          <View style={{ height: 3 }} />
          <Text style={styles.salutationTextId}>
            {GAS_CLEARANCE_STATIC_TEXT.introId}
          </Text>
          <Text style={styles.salutationTextEn}>
            {GAS_CLEARANCE_STATIC_TEXT.introEn}
          </Text>
        </View>

        {/* 5. Bilingual Fields */}
        <View style={styles.fieldsContainer}>
          {/* Row 1: Commodity */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldLabelBox}>
              <Text style={styles.fieldLabelId}>Nama komoditas/media pembawa</Text>
              <Text style={styles.fieldLabelEn}>Commodity/article</Text>
            </View>
            <Text style={styles.fieldColon}>:</Text>
            <View style={styles.fieldValueBox}>
              {page1CommodityLines.map((line, idx) => (
                <Text key={idx} style={styles.fieldValueBold}>
                  {line || " "}
                </Text>
              ))}
            </View>
          </View>

          {/* Row 2: Container Number */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldLabelBox}>
              <Text style={styles.fieldLabelId}>Nomor peti kemas</Text>
              <Text style={styles.fieldLabelEn}>Container number</Text>
            </View>
            <Text style={styles.fieldColon}>:</Text>
            <View style={styles.fieldValueBox}>
              <Text style={styles.fieldValueBold}>{containerDisplay}</Text>
            </View>
          </View>

          {/* Row 3: Carrier / Vessel */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldLabelBox}>
              <Text style={styles.fieldLabelId}>Alat angkut</Text>
              <Text style={styles.fieldLabelEn}>Carrier/vessel</Text>
            </View>
            <Text style={styles.fieldColon}>:</Text>
            <View style={styles.fieldValueBox}>
              <Text style={styles.fieldValueBold}>{data.carrierVessel || "-"}</Text>
            </View>
          </View>

          {/* Row 4: Fumigation Area */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldLabelBox}>
              <Text style={styles.fieldLabelId}>Area / Lokasi fumigasi</Text>
              <Text style={styles.fieldLabelEn}>Area/Location of Fumigation</Text>
            </View>
            <Text style={styles.fieldColon}>:</Text>
            <View style={styles.fieldValueBox}>
              <Text style={styles.fieldValueBold}>{data.fumigationArea || "-"}</Text>
            </View>
          </View>

          {/* Row 5: Fumigant */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldLabelBox}>
              <Text style={styles.fieldLabelId}>Fumigan yang digunakan</Text>
              <Text style={styles.fieldLabelEn}>Fumigant</Text>
            </View>
            <Text style={styles.fieldColon}>:</Text>
            <View style={styles.fieldValueBox}>
              <Text style={styles.fieldValueBold}>
                {data.fumigant || "Methyl Bromide (CH3Br)"}
              </Text>
            </View>
          </View>

          {/* Row 6: Commencing At */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldLabelBox}>
              <Text style={styles.fieldLabelId}>Waktu dimulainya fumigasi</Text>
              <Text style={styles.fieldLabelEn}>Commencing at (dd/mm/yyyy - HH:MM)</Text>
            </View>
            <Text style={styles.fieldColon}>:</Text>
            <View style={styles.fieldValueBox}>
              <Text style={styles.fieldValueBold}>
                {formatDateTime(data.commencingAt)}
              </Text>
            </View>
          </View>

          {/* Row 7: Completed At */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldLabelBox}>
              <Text style={styles.fieldLabelId}>Waktu selesainya fumigasi</Text>
              <Text style={styles.fieldLabelEn}>Completed at (dd/mm/yyyy - HH:MM)</Text>
            </View>
            <Text style={styles.fieldColon}>:</Text>
            <View style={styles.fieldValueBox}>
              <Text style={styles.fieldValueBold}>
                {formatDateTime(data.completedAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* 6. Declarations */}
        <View style={styles.declarationsContainer}>
          <View style={styles.declarationBlock}>
            <Text style={styles.declarationTextId}>
              {GAS_CLEARANCE_STATIC_TEXT.declaration1Id}
            </Text>
            <Text style={styles.declarationTextEn}>
              {GAS_CLEARANCE_STATIC_TEXT.declaration1En}
            </Text>
          </View>
          <View style={styles.declarationBlock}>
            <Text style={styles.declarationTextId}>
              {GAS_CLEARANCE_STATIC_TEXT.declaration2Id}
            </Text>
            <Text style={styles.declarationTextEn}>
              {GAS_CLEARANCE_STATIC_TEXT.declaration2En}
            </Text>
          </View>
        </View>

        {/* 7. Highlighted Gas Level Result */}
        <View style={styles.gasLevelResultBox}>
          <Text style={styles.gasLevelResultLabel}>
            {GAS_CLEARANCE_STATIC_TEXT.gasLevelLabelId} /{" "}
            <Text style={styles.gasLevelResultLabelEn}>
              {GAS_CLEARANCE_STATIC_TEXT.gasLevelLabelEn}
            </Text>{" "}
            :{" "}
          </Text>
          <Text style={styles.gasLevelResultValue}>{gasReading}</Text>
        </View>

        {/* 8. Signature & Stamp Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.companyHeadingId}>
              {GAS_CLEARANCE_STATIC_TEXT.fumigationCompanyId}
            </Text>
            <Text style={styles.companyHeadingEn}>
              {GAS_CLEARANCE_STATIC_TEXT.fumigationCompanyEn}
            </Text>

            <View style={styles.stampSignatureArea}>
              {data.fumigatorSignatureUrl && (
                <Image src={data.fumigatorSignatureUrl} style={styles.signatureImage} />
              )}
            </View>

            <View style={styles.signColumns}>
              <View style={styles.signCol}>
                <Text style={styles.signColTitle}>
                  {GAS_CLEARANCE_STATIC_TEXT.stampLabelId}
                </Text>
                <Text style={styles.signColSubtitle}>
                  {GAS_CLEARANCE_STATIC_TEXT.stampLabelEn}
                </Text>
              </View>
              <View style={styles.signCol}>
                <Text style={styles.signColTitleBold}>
                  {data.fumigatorName || ""}
                </Text>
                <Text style={styles.signColSubtitle}>
                  {GAS_CLEARANCE_STATIC_TEXT.signatureLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 9. Footer: Digital Print Notice */}
        <View style={styles.footerBar}>
          {data.qrCodeDataUrl ? (
            <Image src={data.qrCodeDataUrl} style={styles.footerQr} />
          ) : (
            <View style={styles.footerQrPlaceholder}>
              <Text style={{ fontSize: 6, color: "#888888" }}>QR Code</Text>
            </View>
          )}
          <View style={styles.footerContent}>
            <Text style={styles.footerPrintedBy}>
              {GAS_CLEARANCE_STATIC_TEXT.barantinText}
            </Text>
            {verificationLink ? (
              <Text style={styles.footerNote}>
                {GAS_CLEARANCE_STATIC_TEXT.barantinNote}{" "}
                <Link src={verificationLink} style={styles.footerLink}>
                  {verificationLink}
                </Link>
              </Text>
            ) : null}
            {isAttachmentActive ? (
              <Text style={styles.pageNumberText}>Page 1 of 2</Text>
            ) : null}
          </View>
        </View>
      </Page>
  );
};

export const GasClearanceAttachmentPdfPage: React.FC<{
  data: GasClearanceCertificateData;
}> = ({ data }) => {
  const containers = parseContainersJson(
    data.containersJson,
    data.containerNumber,
    data.sealNumber,
    data.gasLevelPpm
  );

  return (
    <AttachmentPage
      certificateNumber={data.certificateNumber}
      noticeRef={data.noticeRef}
      certificateDate={data.certificateDate}
      commodity={data.commodity}
      containers={containers}
      showContainersTable={needsContainerAttachment(containers)}
      pageNumber={2}
      totalPages={2}
    />
  );
};

export const CertificateDocument: React.FC<{ data: GasClearanceCertificateData }> = ({
  data,
}) => {
  const isAttachment = shouldShowGasClearanceAttachment(data);
  return (
    <Document title={`Gas-Clearance-${data.containerNumber || "Draft"}`}>
      <GasClearancePdfPage data={data} isAttachmentActive={isAttachment} />
      {isAttachment && <GasClearanceAttachmentPdfPage data={data} />}
    </Document>
  );
};

export default CertificateDocument;

