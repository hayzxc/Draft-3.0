# PRD — Gas Clearance Certificate Draft Generator

## 1. Problem

Fumigation officers currently fill in `Template_GC.docx` by hand in Word for every fumigation job. This is slow, error-prone (fields get skipped/mistyped), and the layout can drift between copies. This app replaces that manual process with a web form that produces a **draft PDF** matching the original template's layout exactly.

## 2. Goal

A single-page web app: fill a form → see a live preview that matches the original Word template → export a print-ready A5 PDF. Records are saved so past drafts can be revisited, edited, and re-exported.

## 3. Non-Goals (explicit out-of-scope)

- No e-signature or legal certificate issuance workflow — every output is a **draft only**.
- No multi-template support — this app renders exactly one certificate type (Gas Clearance Certificate).
- No integration with any other system (Document Tracker, mobile fumigation app, Pelindo API, e-Faktur, WhatsApp). This is fully standalone: own database, own auth, own deployment.
- No per-certificate registration number generation — the registration number is a fixed, hard-coded company value (`ID0018MB`) and must never be editable through the UI or auto-incremented.
- No fumigant selection — fumigant is fixed to "Methyl Bromide," never a form field.
- No multi-user roles/permissions design beyond a single authenticated user type (see Section 6).

Agents implementing this spec must not add features from this list even if they seem like natural extensions. If a task seems to require one of these, stop and flag it instead of building it.

## 4. Users

Single user type: the fumigation officer/operator who fills in and exports certificates. No admin/reviewer/approver role.

## 5. Core User Flow

1. User opens the app, sees a list of previously saved certificate drafts.
2. User clicks "New Certificate" → form opens with the two fixed fields (registration number, fumigant) pre-filled and **read-only**.
3. User fills in: date, commodity/article, container number, carrier/vessel, fumigation area, commencing/completed datetimes, gas level (ppm), fumigator name, fumigator signature (optional image upload).
4. A live preview panel renders the certificate in the exact layout of `Template_GC.docx` (A5, same fonts/spacing/bilingual labels).
5. User saves the draft (persists to DB) at any point.
6. User exports to PDF — output matches the preview 1:1.
7. User can reopen, edit, and re-export any saved draft from the list.

## 6. Functional Requirements

| ID | Requirement |
|---|---|
| FR-1 | Form must include every field listed in the Field Inventory (see DATA_MODEL.md), each with the same Indonesian/English bilingual label pairing as the source template. |
| FR-2 | Registration number and fumigant render as fixed, non-editable text — sourced from a single constants file, never from user input or DB per-record storage. |
| FR-3 | Company stamp image is uploaded once via a settings/config area and reused on every certificate; it is not a per-certificate upload field. |
| FR-4 | Live preview must visually match `Template_GC.docx` — same page size (A5, 148×210mm), margins, font (Arial/Arial MT body, Times New Roman where the source uses it), and field order. |
| FR-5 | PDF export must be pixel-equivalent to the live preview (same renderer output, not a second implementation). |
| FR-6 | All datetime fields validate as `dd/mm/yyyy` (date) or `dd/mm/yyyy HH:MM` (datetime); gas level validates as a non-negative number. |
| FR-7 | Drafts list shows all saved certificates with commodity, container number, and certificate date as the summary columns, sorted by most recently updated. |
| FR-8 | Simple email/password auth gates the app (single user type — no roles to differentiate). |

## 7. Success Criteria

- A generated PDF, printed at A5, is visually indistinguishable from a manually filled `Template_GC.docx` when placed side by side.
- A user can go from "New Certificate" to a saved, exported PDF in under 2 minutes.
