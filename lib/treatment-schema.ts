import { z } from "zod";

const optionalDate = z.preprocess((val) => {
  if (!val || val === "" || val === null || val === undefined) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const d = new Date(val as any);
  return isNaN(d.getTime()) ? null : d;
}, z.date().nullable().optional());

export const baseTreatmentCertificateSchema = z.object({
  serialNo: z.string().optional().nullable(),
  dateIssued: optionalDate,
  certificateNumber: z.string().optional().nullable(),
  consignmentLinkPpk: z.string().optional().nullable(),
  consignmentLinkDo: z.string().optional().nullable(),
  consignmentLinkBl: z.string().optional().nullable(),
  containers: z.string().optional().nullable(),
  consignee: z.string().optional().nullable(),
  notifyParty: z.string().optional().nullable(),
  sealNumbers: z.string().optional().nullable(),
  carrierVessel: z.string().optional().nullable(),
  clientNameAddress: z.string().optional().nullable(),
  commodityDescription: z.string().optional().nullable(),
  originCountry: z.string().optional().nullable(),
  destinationCountry: z.string().optional().nullable(),
  portOfLoading: z.string().optional().nullable(),
  portOfUnloading: z.string().optional().nullable(),
  targetOfFumigation: z.string().optional().nullable(),
  enclosureType: z.string().optional().nullable(),
  prescribedDoseRate: z.string().optional().nullable(),
  prescribedExposurePeriod: z.string().optional().nullable(),
  prescribedTemperature: z.string().optional().nullable(),
  appliedDose: z.string().optional().nullable(),
  appliedExposurePeriod: z.string().optional().nullable(),
  appliedTemperature: z.string().optional().nullable(),
  placeOfFumigation: z.string().optional().nullable(),
  commencingAt: optionalDate,
  completedAt: optionalDate,
  finalTlvReading: z.string().optional().nullable(),
  fumigatorName: z.string().optional().nullable(),
  fumigatorAccreditationNumber: z.string().optional().nullable(),
  fumigatorSignatureUrl: z.string().optional().nullable(),
  additionalDeclarations: z.string().optional().nullable(),
  verificationUrl: z.string().optional().nullable(),
  qrCodeDataUrl: z.string().optional().nullable(),
  includeGasClearance: z.boolean().default(true).optional(),
  gcCertificateNumber: z.string().optional().nullable(),
  gcRegistrationNumber: z.string().default("ID0018MB").optional().nullable(),
  gcGasLevelReading: z.string().optional().nullable(),
  gcFumigant: z.string().default("Methyl Bromide (CH3Br)").optional().nullable(),
  gcSerialNo: z.string().optional().nullable(),
});

export const treatmentCertificateSchema = baseTreatmentCertificateSchema.refine(
  (d) => {
    if (!d.commencingAt || !d.completedAt) return true;
    return d.completedAt >= d.commencingAt;
  },
  {
    message: "Completed time must be after commencing time",
    path: ["completedAt"],
  }
);

export type TreatmentCertificateInput = z.infer<typeof treatmentCertificateSchema>;
