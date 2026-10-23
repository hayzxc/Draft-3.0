import { TreatmentCertificateData } from "@/components/treatment/TreatmentDocument";
import { GasClearanceCertificateData } from "@/components/certificate/CertificateDocument";

/**
 * Maps Treatment Certificate data into Gas Clearance Certificate format.
 * In export fumigation (AFAS Barantin), ~90% of data is identical across both documents.
 */
export function mapTreatmentToGasClearanceData(
  tc: TreatmentCertificateData
): GasClearanceCertificateData {
  const containersClean = (tc.containers || "")
    .split(/[\r\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");

  const autoGcNumber =
    tc.gcCertificateNumber?.trim() ||
    (tc.certificateNumber
      ? tc.certificateNumber.replace(/TC/i, "GC")
      : "");

  const autoReading = tc.gcGasLevelReading?.trim() || "";

  return {
    id: tc.id,
    serialNo: tc.gcSerialNo?.trim() || tc.serialNo || "",
    certificateNumber: autoGcNumber,
    registrationNumber: tc.gcRegistrationNumber?.trim() || "ID0018MB",
    certificateDate: tc.dateIssued,
    commodity: tc.commodityDescription || "",
    containerNumber: containersClean,
    carrierVessel: tc.carrierVessel || "",
    fumigationArea: tc.placeOfFumigation || "",
    fumigant: tc.gcFumigant?.trim() || "Methyl Bromide (CH3Br)",
    commencingAt: tc.commencingAt,
    completedAt: tc.completedAt,
    gasLevelPpm: null,
    gasLevelReading: autoReading,
    fumigatorName: tc.fumigatorName?.trim() || "",
    fumigatorSignatureUrl: tc.fumigatorSignatureUrl || null,
    stampImageUrl: null,
    logoImageUrl: tc.logoImageUrl || "/images/letterhead.jpg",
    verificationUrl: tc.verificationUrl || "",
    qrCodeDataUrl: tc.qrCodeDataUrl || "",
  };
}
