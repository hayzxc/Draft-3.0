# ARCHITECTURE — Gas Clearance Certificate Draft Generator

## 1. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15, App Router | TypeScript strict mode throughout |
| Form state | React Hook Form + Zod | one shared Zod schema drives both client validation and server-side parsing |
| Styling | Tailwind CSS | design tokens for the exact template fonts/spacing (see `lib/certificate-tokens.ts`) |
| Preview + PDF | `@react-pdf/renderer` | one component tree renders both the on-screen preview (via `PDFViewer`) and the downloadable file (via `pdf()` / `PDFDownloadLink`) — this guarantees FR-5 (preview = export) by construction, not by keeping two implementations in sync |
| Database | PostgreSQL + Prisma | standalone DB, not shared with any other project |
| File storage | UploadThing | company stamp (uploaded once) + optional fumigator signature image per draft |
| Auth | NextAuth (Credentials provider, email/password) | single user type, no role system |
| Deployment | Vercel | |

## 2. Why `@react-pdf/renderer` over Puppeteer/print-CSS

react-pdf gives explicit control over absolute positions in points/mm, which is what's needed to match a fixed A5 Word layout exactly, and it renders identically for on-screen preview and the exported file — no separate HTML print stylesheet to keep in sync. If pixel-matching react-pdf's primitives proves difficult for a specific element (e.g. the logo placement), fall back to Puppeteer + print CSS for that one component, but default to react-pdf.

## 3. Module Structure

```
/app
  /(auth)/login/page.tsx
  /(app)/certificates/page.tsx           # drafts list (FR-7)
  /(app)/certificates/new/page.tsx       # new certificate form
  /(app)/certificates/[id]/page.tsx      # edit existing draft
  /(app)/settings/page.tsx               # company stamp + logo upload (FR-3)
  /api/certificates/route.ts             # GET (list), POST (create)
  /api/certificates/[id]/route.ts        # GET, PATCH, DELETE
  /api/certificates/[id]/pdf/route.ts    # GET -> streams PDF
  /api/company-asset/route.ts            # GET, PUT (stamp/logo)
/components
  /certificate
    CertificateForm.tsx                  # RHF + Zod form, all FR-1/6 fields
    CertificateDocument.tsx              # react-pdf <Document> — THE single source of layout
    BilingualField.tsx                   # reusable ID/EN label pair primitive
  /drafts
    DraftsList.tsx
/lib
  certificate-schema.ts                  # Zod schema, shared client/server
  certificate-constants.ts               # registrationNumber, fumigant (FR-2)
  certificate-tokens.ts                  # fonts, spacing, page dimensions extracted from Template_GC.docx
  prisma.ts
/prisma
  schema.prisma
```

## 4. Layout Tokens (extracted from `Template_GC.docx`)

```ts
// lib/certificate-tokens.ts
export const PAGE = {
  width: "148mm",   // A5
  height: "210mm",
  marginTop: "0.26in",
  marginBottom: "0.67in",
  marginLeft: "0.20in",
  marginRight: "0.20in",
};

export const FONTS = {
  body: "Arial",
  bodyAlt: "Arial MT",
  labelSerif: "Times New Roman", // used for a subset of labels in the source doc
};

export const IMAGE_SIZES = {
  logo: { width: "5.28in", height: "0.77in" },
  stamp: { width: "0.75in", height: "0.75in" },
};
```
`CertificateDocument.tsx` must import from this file rather than hard-coding any dimension — this is the single place layout constants live, so a future template correction only requires editing one file.

## 5. Data Flow

1. `CertificateForm` (client) validates with `certificateSchema` on change.
2. On submit → `POST /api/certificates` (or `PATCH` for edits) → server re-validates with the same schema → Prisma write.
3. `CertificateDocument` receives the same validated data shape as props, whether rendering the live `<PDFViewer>` preview or the `/pdf` export route — no data transformation between the two.
4. `/api/certificates/[id]/pdf` renders `CertificateDocument` server-side with `@react-pdf/renderer`'s `renderToStream` and returns `application/pdf`.

## 6. Auth

NextAuth Credentials provider, single `User` table (email + hashed password). No roles, no permission checks beyond "is logged in" — matches PRD Section 6 (single user type, no differentiation).

## 7. Explicit Boundaries for Implementing Agents

Do not introduce:
- A `status` field or draft/issued state machine (see PRD Non-Goals).
- Any outbound integration (webhook, external API call, message queue) to another system.
- A fumigant or registration-number form field, dropdown, or DB column — these are constants only (`lib/certificate-constants.ts`).
- Multi-tenancy or role-based access control.

If a task description elsewhere seems to imply one of these, stop and ask rather than building it — it's outside this app's confirmed scope.
