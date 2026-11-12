/**
 * Unit tests for Attachment utilities (Spec §8.1 & §10)
 * Run: npx tsx lib/attachment/attachment.test.ts
 */

import {
  countCommodityLines,
  wrapTextToLines,
  needsAttachment,
  needsFcAttachment,
  getCommodityDisplay,
  getFcCommodityDisplay,
  splitContainerColumns,
  getGasSummary,
  getContainerSummary,
  getContainerCount,
  needsContainerAttachment,
} from "./attachment";
import { ATTACHMENT_CONFIG } from "./config";

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`FAIL: ${msg}`);
  console.log(`  ✓ ${msg}`);
}

// --- 0. wrapTextToLines (Dynamic Word Wrapping) ---
console.log("\n--- wrapTextToLines (Dynamic Word Wrapping) ---");
const shortWrapped = wrapTextToLines("HELLO WORLD", 56);
assert(shortWrapped.length === 1 && shortWrapped[0] === "HELLO WORLD", "short text wraps to 1 line");

const longText = "QUANTITY, UNIT PRICE, TOTAL PRICE AND ALL OTHER DETAILS ARE AS PER PROFORMA";
const longWrapped = wrapTextToLines(longText, 56);
assert(longWrapped.length === 2, `75-char line wraps to 2 lines at 56 chars (got ${longWrapped.length})`);
assert(longWrapped[0] === "QUANTITY, UNIT PRICE, TOTAL PRICE AND ALL OTHER DETAILS", "first wrapped line");
assert(longWrapped[1] === "ARE AS PER PROFORMA", "second wrapped line");

// --- 1. countCommodityLines ---
console.log("\n--- countCommodityLines ---");
assert(countCommodityLines("") === 0, "empty string → 0");
assert(countCommodityLines(null) === 0, "null → 0");
assert(countCommodityLines(undefined) === 0, "undefined → 0");
assert(countCommodityLines("   \n  ") === 0, "whitespace only → 0");
assert(countCommodityLines("short") === 1, "short single line → 1");
assert(countCommodityLines("A ".repeat(28)) === 1, "56 chars word text → 1 line");
assert(countCommodityLines(longText) === 2, "75-char sentence → 2 lines visual");
assert(countCommodityLines("Line 1\nLine 2\nLine 3") === 3, "3 newline-separated lines → 3");

// Malapoga 12-line test from user's image (all lines <= 54 chars)
const malapogaCommodity = `1X20' S.T.C.:
5 PALLETS = 1,967 PCS =
16.6733 M3 OF
MALAPOGA FINGER JOINT LAMINATING BOARD WHITE PRIMED
MALAPOGA SOLID LAMINATING BOARD WHITE PRIMED
MALAPOGA SOLID LAMINATING BOARD
MALAPOGA DECORATIVE PROFILE
MALAPOGA S4S
MALAPOGA MOULDING PROFILE
MALAPOGA MOULDING PROFILE WHITE PRIMED
NETT WEIGHT : 5,674.00 KGS MEASUREMENT : 16.6733 CBM
GROSS WEIGHT : 5750.000KGS`;

const malapogaLineCount = countCommodityLines(malapogaCommodity);
assert(malapogaLineCount === 12, `Malapoga has exactly 12 visual lines (got ${malapogaLineCount})`);
assert(!needsFcAttachment(malapogaCommodity), "Malapoga (12 lines) does NOT trigger FC attachment (limit 12)");

const malapogaDisplay = getFcCommodityDisplay(malapogaCommodity);
assert(!malapogaDisplay.isTruncated, "Malapoga is not truncated on page 1");
assert(malapogaDisplay.displayLines.length === 12, "Malapoga displays all 12 lines intact on page 1");

// --- 2. needsAttachment ---
console.log("\n--- needsAttachment ---");
assert(!needsAttachment("SHORT TEXT"), "short text → false");
assert(!needsAttachment(Array.from({ length: 9 }, (_, i) => `Line ${i + 1}`).join("\n")), "exactly 9 lines → false");
assert(!needsAttachment(Array.from({ length: 10 }, (_, i) => `Line ${i + 1}`).join("\n")), "10 lines → false (threshold is >= 11)");
assert(needsAttachment(Array.from({ length: 11 }, (_, i) => `Line ${i + 1}`).join("\n")), "11 lines → true (triggers attachment)");

// Test with reference PDF commodity (11 lines)
const referenceCommodity = `1 X 40 CONTAINER STC:
25MT (500 PP BAGS) OF INDONESIA ORIGIN CLOVES
(PACKED IN 50 KG PP BAGS)
TOTAL NET WEIGHT: 25,000.00 KGS
TOTAL GROSS WEIGHT: 25,500.00 KGS
TOTAL PACKAGES: 500 BAGS
LC NO : 161826020316 DATE: 2026 Oct 14
IRC NO : 260381120000319 H.S. CODE : 0907.10.90
APPLICANT TIN NO. : 260381120000319
APPLICANT BIN/VAT REGISTRATION NO : 002-2608-0000-2609
GW / NW / MEAS : 25,500.00 KGS / 25,000.00 KGS / 66.00 CBM`;

assert(needsAttachment(referenceCommodity), "reference PDF commodity (11 lines) → true");

// Test with exact 11 lines from user screenshot (Gum Copal, has long lines wrapping to 14 visual lines)
const userImageCommodity = `1 X 20'
600 PACKAGES X 25 KGS (15,000 KGS) GUM COPAL
QUANTITY: 15.00 MT (TOLERANCE +/- 10 PCT)
H.S. CODE NO.: 1301.90.00(BANGLADESH)/1301.90.90(INDONESIA).
DETAIL DESCRIPTION OF GOODS SPECIFICATIONS, QUALITY,
QUANTITY, UNIT PRICE, TOTAL PRICE AND ALL OTHER DETAILS ARE AS PER PROFORMA
INVOICE NO. PI/014-01/FARIHA/GUC/2026 DATED 09/09/2026
DESCRIPTION OF GOODS
PL NO. : PL/014-01-A/FARIHA/GUC/2026 DATE (P/L) : 05/10/2026
LC NUMBER : 012726010096 DATE (L/C) : 08/09/2026
H.S. CODE : 1301.90.00 (BD), 1301.90.90 (ID)`;

const gumCopalVisualLines = countCommodityLines(userImageCommodity);
assert(gumCopalVisualLines === 14, `Gum Copal visual lines = 14 due to word wrapping (got ${gumCopalVisualLines})`);
assert(needsAttachment(userImageCommodity), "user image commodity (14 visual lines) → needsAttachment is true");
assert(needsFcAttachment(userImageCommodity), "user image commodity (14 visual lines > 12) → needsFcAttachment is true");

// --- 3. getCommodityDisplay ---
console.log("\n--- getCommodityDisplay ---");
const emptyDisplay = getCommodityDisplay(null);
assert(!emptyDisplay.isTruncated && emptyDisplay.displayLines[0] === "-", "null commodity → ['-']");

const shortDisplay = getCommodityDisplay("Short Line 1\nShort Line 2");
assert(!shortDisplay.isTruncated && shortDisplay.displayLines.length === 2, "short commodity → not truncated");

const refDisplay = getCommodityDisplay(referenceCommodity);
assert(refDisplay.isTruncated, "reference commodity (11 lines) → isTruncated true");
assert(refDisplay.displayLines.length === 10, `displayLines length = 10 (got ${refDisplay.displayLines.length})`);
assert(refDisplay.displayLines[0] === "1 X 40 CONTAINER STC:", "first line intact");
assert(refDisplay.displayLines[8] === "APPLICANT TIN NO. : 260381120000319", "9th line intact");

// --- 4. splitContainerColumns ---
console.log("\n--- splitContainerColumns ---");
const fiveCols = splitContainerColumns([1, 2, 3, 4, 5]);
assert(fiveCols.left.length === 3 && fiveCols.right.length === 2, "5 items → 3 left, 2 right");
assert(fiveCols.left[0] === 1 && fiveCols.left[2] === 3, "left items are [1, 2, 3]");
assert(fiveCols.right[0] === 4 && fiveCols.right[1] === 5, "right items are [4, 5]");

const oneCol = splitContainerColumns([1]);
assert(oneCol.left.length === 1 && oneCol.right.length === 0, "1 item → 1 left, 0 right");

const zeroCol = splitContainerColumns([]);
assert(zeroCol.left.length === 0 && zeroCol.right.length === 0, "0 items → 0 left, 0 right");

// --- 5. getGasSummary & getContainerSummary ---
console.log("\n--- getGasSummary & getContainerSummary ---");
assert(getGasSummary([0]) === "1 containers \u2014 0\u20130 ppm (see Attachment)", "single 0 TLV");
assert(getGasSummary([5, 10, 3]) === "3 containers \u2014 3\u201310 ppm (see Attachment)", "min 3, max 10");
assert(getContainerSummary(1) === "1 containers (see Attachment)", "1 container summary");
assert(getContainerSummary(4) === "4 containers (see Attachment)", "4 container summary");

// --- 6. Treatment Certificate (FC) Attachment Tests ---
console.log("\n--- FC Attachment Tests ---");
const userShortCommodity = `3X40'HC SAID TO CONTAIN :
63 PALLETS = 102000 PCS = 140.94 M3
OF MAHONI FACE VENEER
NW : 76,436.00 KGS GW : 76,639.00 KGS MEAS : 140.940 CBM`;

assert(countCommodityLines(userShortCommodity) === 4, "user short commodity → 4 lines");
assert(!needsFcAttachment(userShortCommodity), "user short commodity (4 lines) → needsFcAttachment is false");
assert(!needsFcAttachment(Array.from({ length: 12 }, (_, i) => `Line ${i + 1}`).join("\n")), "12 short lines → needsFcAttachment is false (FC max is 12)");
assert(needsFcAttachment(Array.from({ length: 13 }, (_, i) => `Line ${i + 1}`).join("\n")), "13 lines → needsFcAttachment is true");
assert(needsFcAttachment(userImageCommodity), "Gum Copal (14 visual lines) → needsFcAttachment is true");

const fcShortDisplay = getFcCommodityDisplay(userShortCommodity);
assert(!fcShortDisplay.isTruncated, "fc short commodity → not truncated");
assert(fcShortDisplay.displayLines.length === 4, "fc short commodity → 4 lines returned intact");

const fcGumCopalDisplay = getFcCommodityDisplay(userImageCommodity);
assert(fcGumCopalDisplay.isTruncated, "Gum Copal isTruncated true on FC");
assert(fcGumCopalDisplay.displayLines.length <= 12, "Gum Copal displayLines within 12 lines limit on Page 1");
assert(fcGumCopalDisplay.displayLines[fcGumCopalDisplay.displayLines.length - 1].includes("... (see Attachment)"), "last line has attachment marker");

// --- 7. Container Count & Attachment Threshold Tests ---
console.log("\n--- Container Count & Attachment Threshold Tests ---");
assert(getContainerCount(null) === 0, "null containers → 0");
assert(getContainerCount("") === 0, "empty string → 0");
assert(getContainerCount("CSNU2373750") === 1, "single container string → 1");
assert(getContainerCount(["CSNU2373750"]) === 1, "single container array → 1");
assert(getContainerCount("CSNU2373750, TEMU1234567") === 2, "2 containers comma separated → 2");
assert(getContainerCount("CSNU1\nCSNU2\nCSNU3") === 3, "3 containers newline separated → 3");
assert(getContainerCount("C1, C2, C3, C4") === 4, "4 containers → 4");
assert(getContainerCount("C1, C2, C3, C4, C5") === 5, "5 containers → 5");

// Attachment trigger based on container count (1, 2, 3: false; 4, 5+: true)
assert(!needsContainerAttachment("CSNU2373750"), "1 container → needsContainerAttachment is false (directly on page 1)");
assert(!needsContainerAttachment(["CSNU2373750"]), "1 container array → needsContainerAttachment is false");
assert(!needsContainerAttachment("CSNU1, CSNU2"), "2 containers → needsContainerAttachment is false");
assert(!needsContainerAttachment("CSNU1, CSNU2, CSNU3"), "3 containers → needsContainerAttachment is false");
assert(needsContainerAttachment("CSNU1, CSNU2, CSNU3, CSNU4"), "4 containers → needsContainerAttachment is true (goes to attachment)");
assert(needsContainerAttachment("CSNU1, CSNU2, CSNU3, CSNU4, CSNU5"), "5 containers → needsContainerAttachment is true (goes to attachment)");

console.log("\n✅ ALL ATTACHMENT UNIT TESTS PASSED SUCCESSFULLY.\n");
console.log("\n--- Container Count & Attachment Threshold Tests ---");
assert(getContainerCount(null) === 0, "null containers → 0");
assert(getContainerCount("") === 0, "empty string → 0");
assert(getContainerCount("CSNU2373750") === 1, "single container string → 1");
assert(getContainerCount(["CSNU2373750"]) === 1, "single container array → 1");
assert(getContainerCount("CSNU2373750, TEMU1234567") === 2, "2 containers comma separated → 2");
assert(getContainerCount("CSNU1\nCSNU2\nCSNU3") === 3, "3 containers newline separated → 3");
assert(getContainerCount("C1, C2, C3, C4") === 4, "4 containers → 4");
assert(getContainerCount("C1, C2, C3, C4, C5") === 5, "5 containers → 5");

// Attachment trigger based on container count (1, 2, 3: false; 4, 5+: true)
assert(!needsContainerAttachment("CSNU2373750"), "1 container → needsContainerAttachment is false (directly on page 1)");
assert(!needsContainerAttachment(["CSNU2373750"]), "1 container array → needsContainerAttachment is false");
assert(!needsContainerAttachment("CSNU1, CSNU2"), "2 containers → needsContainerAttachment is false");
assert(!needsContainerAttachment("CSNU1, CSNU2, CSNU3"), "3 containers → needsContainerAttachment is false");
assert(needsContainerAttachment("CSNU1, CSNU2, CSNU3, CSNU4"), "4 containers → needsContainerAttachment is true (goes to attachment)");
assert(needsContainerAttachment("CSNU1, CSNU2, CSNU3, CSNU4, CSNU5"), "5 containers → needsContainerAttachment is true (goes to attachment)");

console.log("\n✅ ALL ATTACHMENT UNIT TESTS PASSED SUCCESSFULLY.\n");
