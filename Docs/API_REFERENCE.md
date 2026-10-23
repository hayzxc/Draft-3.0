# API REFERENCE — Gas Clearance Certificate Draft Generator

All routes require an authenticated session (NextAuth). No role checks beyond authentication (single user type).

## Certificates

### `GET /api/certificates`
List all saved drafts, most recently updated first.

**Response 200**
```json
[
  {
    "id": "clx...",
    "commodity": "Kayu Lapis",
    "containerNumber": "MSKU1234567",
    "certificateDate": "2026-07-28T00:00:00.000Z",
    "updatedAt": "2026-07-30T09:12:00.000Z"
  }
]
```

### `POST /api/certificates`
Create a new draft. Body validated against `certificateSchema` (see DATA_MODEL.md).

**Request body**: `CertificateInput`
**Response 201**: full `GasClearanceCertificate` record
**Response 400**: `{ "errors": ZodError.flatten() }`

### `GET /api/certificates/[id]`
Fetch one draft by id.

**Response 200**: full record
**Response 404**: `{ "error": "Not found" }`

### `PATCH /api/certificates/[id]`
Update an existing draft. Same body shape as `POST`, partial allowed.

**Response 200**: updated record

### `DELETE /api/certificates/[id]`
**Response 204**

### `GET /api/certificates/[id]/pdf`
Renders `CertificateDocument` (see ARCHITECTURE.md §5) server-side and streams the file.

**Response 200**: `application/pdf`, `Content-Disposition: attachment; filename="GC-Certificate-{id}.pdf"`

## Company Asset

### `GET /api/company-asset`
Returns the current stamp/logo URLs (single row).

**Response 200**
```json
{ "stampImageUrl": "https://...", "logoImageUrl": "https://..." }
```

### `PUT /api/company-asset`
Upserts the single `CompanyAsset` row. Used from the Settings page when the stamp/logo is (re)uploaded.

**Request body**
```json
{ "stampImageUrl": "https://...", "logoImageUrl": "https://..." }
```
**Response 200**: updated record

## Explicitly not part of this API

- No endpoint accepts or returns `registrationNumber` or `fumigant` as writable fields — both are rendered from `CERTIFICATE_CONSTANTS`, never persisted per-record.
- No `status`/issue/approve endpoints — there is no state beyond "saved draft."
- No webhook or external-system endpoints (Document Tracker, Pelindo, e-Faktur, WhatsApp) — this API is standalone.
