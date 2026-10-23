# AGENTS.md — Gas Clearance Certificate Draft Generator

Read `PRD.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, and `API_REFERENCE.md` in this directory before writing any code. Those four files are the binding contract for this project. This file adds execution rules on top of them.

## Ground Rules

1. **This is a standalone app.** Do not add any client, SDK, or config that talks to Document Tracker, the fumigation mobile app, Pelindo API, DJP e-Faktur, or WhatsApp — even if those look like natural next steps. If a task seems to require one, stop and flag it instead of implementing it.
2. **`registrationNumber` ("ID0018MB") and `fumigant` ("Methyl Bromide") are constants, not data.** They must never appear as: a form field, a Zod schema field, a Prisma column, or a request/response body key. They are imported from `lib/certificate-constants.ts` wherever the certificate is rendered.
3. **No status/workflow state.** Every record is a draft by definition. Do not add `status`, `isIssued`, `approvedAt`, or similar fields.
4. **No auth roles.** One `User` model, no `role` column, no permission middleware beyond "is authenticated."
5. **Layout constants live in one place**: `lib/certificate-tokens.ts`. Any component rendering the certificate imports dimensions/fonts from there — never hard-code a page size, margin, or font name inline in a component.
6. **Preview and export must share one component.** `CertificateDocument.tsx` is the single source of layout, used by both the on-screen `<PDFViewer>` and the `/api/certificates/[id]/pdf` export route. Do not build a second HTML-based preview that could drift from the PDF output.

## Build Order

Follow this order; each step should be independently testable before moving to the next.

1. Scaffold Next.js + TypeScript strict + Tailwind + Prisma. Wire up `DATABASE_URL`.
2. Implement `prisma/schema.prisma` from `DATA_MODEL.md` §3, run initial migration.
3. Implement `lib/certificate-schema.ts`, `lib/certificate-constants.ts`, `lib/certificate-static-text.ts`, `lib/certificate-tokens.ts`.
4. Implement `components/certificate/BilingualField.tsx` and `CertificateDocument.tsx` (react-pdf) using the tokens/constants above. Render it standalone with mock data and visually diff against the original template screenshot before continuing.
5. Implement `CertificateForm.tsx` (React Hook Form + the shared Zod schema).
6. Implement API routes per `API_REFERENCE.md`, in this order: `POST /api/certificates`, `GET /api/certificates`, `GET/PATCH/DELETE /api/certificates/[id]`, `GET /api/certificates/[id]/pdf`, `GET/PUT /api/company-asset`.
7. Wire pages: drafts list, new/edit certificate, settings (stamp/logo upload).
8. Add NextAuth Credentials auth, gate all `(app)` routes.
9. End-to-end pass: create a certificate, export PDF, compare against `Template_GC.docx` printed at A5.

## Definition of Done

- [ ] Every field in DATA_MODEL.md §1 marked "Form field? Yes" is present in `CertificateForm` with correct validation.
- [ ] `registrationNumber` and `fumigant` never appear as editable UI, in the Zod schema, or in the Prisma schema.
- [ ] Exported PDF matches `Template_GC.docx` layout when printed/viewed at A5 (same page size, margins, field order, bilingual label pairing).
- [ ] No code references any external system name (Document Tracker, Pelindo, e-Faktur, WhatsApp, PhytoTrack, Prana).
- [ ] `npx tsc --noEmit` and `npx prisma validate` both pass clean.

## When Something Is Ambiguous

Stop and ask rather than guessing, specifically for:
- Any change to the two fixed constants.
- Any new field not in DATA_MODEL.md §1.
- Any integration point not listed in API_REFERENCE.md.

For everything else covered by the four spec documents, proceed without asking.
