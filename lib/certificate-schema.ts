import { z } from "zod";

const optionalDate = z.preprocess((val) => {
  if (!val || val === "" || val === null || val === undefined) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const d = new Date(val as any);
  return isNaN(d.getTime()) ? null : d;
}, z.date().nullable().optional());

export const baseCertificateSchema = z.object({
  serialNo: z.string().max(100).optional().nullable(),
  certificateNumber: z.string().max(200).optional().nullable(),
  registrationNumber: z.string().max(100).default("ID0018MB").optional().nullable(),
  certificateDate: optionalDate,
  commodity: z.string().max(1000).optional().nullable(),
  containerNumber: z.string().max(100).optional().nullable(),
  carrierVessel: z.string().max(200).optional().nullable(),
  fumigationArea: z.string().max(300).optional().nullable(),
  fumigant: z.string().max(100).default("Methyl Bromide (CH3Br)").optional().nullable(),
  commencingAt: optionalDate,
  completedAt: optionalDate,
  gasLevelPpm: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number().min(0).optional().nullable()
  ),
  gasLevelReading: z.string().max(200).optional().nullable(),
  fumigatorName: z.string().max(200).optional().nullable(),
  fumigatorSignatureUrl: z.string().optional().nullable(),
  verificationUrl: z.string().optional().nullable(),
  qrCodeDataUrl: z.string().optional().nullable(),
});

export const certificateSchema = baseCertificateSchema.refine(
  (d) => {
    if (!d.commencingAt || !d.completedAt) return true;
    return d.completedAt >= d.commencingAt;
  },
  {
    message: "Completed time must be after commencing time",
    path: ["completedAt"],
  }
);

export type CertificateInput = z.infer<typeof certificateSchema>;
