# DATA MODEL — Gas Clearance Certificate Draft Generator

## 1. Field Inventory (source: `Template_GC.docx`)

| # | Field (ID) | Field (EN) | Form field? | Type | Validation |
|---|---|---|---|---|---|
| 1 | Nomor Registrasi | Registration Number | No — fixed constant | string | n/a, `"ID0018MB"` |
| 2 | Tanggal | Date | Yes | date | required, `dd/mm/yyyy` |
| 3 | Nama komoditas/media pembawa | Commodity/article | Yes | string | required, 1–200 chars |
| 4 | Nomor peti kemas | Container number | Yes | string | required, 1–20 chars |
| 5 | Alat angkut | Carrier/vessel | Yes | string | required, 1–200 chars |
| 6 | Area/Lokasi fumigasi | Area/Location of Fumigation | Yes | string | required, 1–200 chars |
| 7 | Fumigan yang digunakan | Fumigant | No — fixed constant | string | n/a, `"Methyl Bromide"` |
| 8 | Waktu dimulainya fumigasi | Commencing at | Yes | datetime | required, `dd/mm/yyyy HH:MM`, must be ≤ completedAt |
| 9 | Waktu selesainya fumigasi | Completed at | Yes | datetime | required, `dd/mm/yyyy HH:MM`, must be ≥ commencingAt |
| 10 | Konsentrasi gas setelah penganginan | Gas levels after fumigation | Yes | number (ppm) | required, ≥ 0 |
| 11 | Cap Perusahaan Fumigasi | Stamp of company | No — company-level asset, uploaded once via Settings | image URL | set once, reused everywhere |
| 12 | (signature block) | Signature and name of fumigator | Yes | string + optional image | name required, image optional |

### Static content (not fields, render as fixed text)
- Section heading: "Kepada pihak-pihak yang berkepentingan" / *To whom it may concern*
- Intro line: "Saya sebagai penanggungjawab fumigasi di bawah ini:" / *I, being the person-in-charge of the fumigation of the following:*
- Declaration paragraph 1 (gas-free statement)
- Declaration paragraph 2 (examined-after-checking statement)
- Footer label: "Pelaksana Fumigasi," / *Fumigation company*

These live as string constants in `lib/certificate-static-text.ts`, not in the database, and are not user-editable.

## 2. Zod Schema

```ts
// lib/certificate-schema.ts
import { z } from "zod";

export const certificateSchema = z.object({
  certificateDate: z.coerce.date(),
  commodity: z.string().min(1).max(200),
  containerNumber: z.string().min(1).max(20),
  carrierVessel: z.string().min(1).max(200),
  fumigationArea: z.string().min(1).max(200),
  commencingAt: z.coerce.date(),
  completedAt: z.coerce.date(),
  gasLevelPpm: z.coerce.number().min(0),
  fumigatorName: z.string().min(1).max(200),
  fumigatorSignatureUrl: z.string().url().optional(),
}).refine(d => d.completedAt >= d.commencingAt, {
  message: "Completed time must be after commencing time",
  path: ["completedAt"],
});

export type CertificateInput = z.infer<typeof certificateSchema>;
```
Note: `registrationNumber` and `fumigant` are intentionally absent from this schema — they are constants, never part of user input (see PRD Non-Goals, FR-2).

## 3. Prisma Schema

```prisma
// prisma/schema.prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

model GasClearanceCertificate {
  id                     String   @id @default(cuid())
  certificateDate        DateTime
  commodity              String
  containerNumber        String
  carrierVessel          String
  fumigationArea         String
  commencingAt           DateTime
  completedAt            DateTime
  gasLevelPpm            Decimal
  fumigatorName          String
  fumigatorSignatureUrl  String?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
}

// Single-row table: company stamp + logo, uploaded once, reused on every certificate
model CompanyAsset {
  id            String   @id @default(cuid())
  stampImageUrl String
  logoImageUrl  String
  updatedAt     DateTime @updatedAt
}
```

## 4. Constants

```ts
// lib/certificate-constants.ts
export const CERTIFICATE_CONSTANTS = {
  registrationNumber: "ID0018MB",
  fumigant: "Methyl Bromide",
} as const;
```
Agents must treat this file as read-only configuration, not a seed for form defaults or DB columns.
