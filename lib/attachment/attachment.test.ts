/**
 * Unit tests for Attachment utilities (Spec §8.1 & §10)
 * Run: npx tsx lib/attachment/attachment.test.ts
 */

import {
  countCommodityLines,
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

// --- 1. countCommodityLines ---
console.log("\n--- countCommodityLines ---");
assert(countCommodityLines("") === 0, "empty string → 0");
assert(countCommodityLines(null) === 0, "null → 0");
assert(countCommodityLines(undefined) === 0, "undefined → 0");
assert(countCommodityLines("   \n  ") === 0, "whitespace only → 0");
assert(countCommodityLines("short") === 1, "short single line → 1");
assert(countCommodityLines("A".repeat(ATTACHMENT_CONFIG.CHARS_PER_LINE)) === 1, "exactly CHARS_PER_LINE → 1");
assert(countCommodityLines("A".repeat(ATTACHMENT_CONFIG.CHARS_PER_LINE + 1)) === 2, "CHARS_PER_LINE + 1 → 2");
assert(countCommodityLines("A".repeat(ATTACHMENT_CONFIG.CHARS_PER_LINE * 2)) === 2, "2 * CHARS_PER_LINE → 2");
assert(countCommodityLines("A".repeat(ATTACHMENT_CONFIG.CHARS_PER_LINE * 2 + 1)) === 3, "2 * CHARS_PER_LINE + 1 → 3");
assert(countCommodityLines("Line 1\nLine 2\nLine 3") === 3, "3 newline-separated lines → 3");

// --- 2. needsAttachment ---
console.log("\n--- needsAttachment ---");
assert(!needsAttachment("SHORT TEXT"), "short text → false");
assert(!needsAttachment(Array.from({ length: 9 }, (_, i) => `Line ${i + 1}`).join("\n")), "exactly 9 lines → false");
assert(needsAttachment(Array.from({ length: 10 }, (_, i) => `Line ${i + 1}`).join("\n")), "10 lines → true");
assert(!needsAttachment("A".repeat(ATTACHMENT_CONFIG.CHARS_PER_LINE * 9)), "540 chars (9 visual) → false");
assert(needsAttachment("A".repeat(ATTACHMENT_CONFIG.CHARS_PER_LINE * 9 + 1)), "541 chars (10 visual) → true");

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

// --- 3. getCommodityDisplay ---
console.log("\n--- getCommodityDisplay ---");
const emptyDisplay = getCommodityDisplay(null);
assert(!emptyDisplay.isTruncated && emptyDisplay.displayLines[0] === "-", "null commodity → ['-']");

const shortDisplay = getCommodityDisplay("Short Line 1\nShort Line 2");
assert(!shortDisplay.isTruncated && shortDisplay.displayLines.length === 2, "short commodity → not truncated");

const refDisplay = getCommodityDisplay(referenceCommodity);
assert(refDisplay.isTruncated, "reference commodity → isTruncated true");
assert(refDisplay.displayLines.length === 9, `displayLines length = 9 (got ${refDisplay.displayLines.length})`);
assert(refDisplay.displayLines[0] === "1 X 40 CONTAINER STC:", "first line intact");
assert(refDisplay.displayLines[7] === "IRC NO : 260381120000319 H.S. CODE : 0907.10.90", "8th line intact");

const ninthLine = refDisplay.displayLines[8];
assert(ninthLine.startsWith("APPLICAN"), `9th line starts with APPLICAN (got: "${ninthLine}")`);
assert(ninthLine.includes("... (see Attachment)"), `9th line includes marker (got: "${ninthLine}")`);
assert(ninthLine === "APPLICAN... (see Attachment)", `9th line exactly "APPLICAN... (see Attachment)"`);

// Edge case: line 9 with < 8 chars
const short9thLineCommodity = Array.from({ length: 8 }, (_, i) => `Line ${i + 1}`).join("\n") + "\nABC\nLine 10";
const short9thDisplay = getCommodityDisplay(short9thLineCommodity);
assert(short9thDisplay.displayLines[8] === "ABC... (see Attachment)", `short line 9 preserved ("ABC... (see Attachment)")`);

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
assert(!needsFcAttachment("Line 1\nLine 2\nLine 3\nLine 4\nLine 5"), "5 lines → needsFcAttachment is false");
assert(needsFcAttachment("Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6"), "6 lines → needsFcAttachment is true");
assert(needsFcAttachment(referenceCommodity), "reference commodity (11 lines) → needsFcAttachment is true");

const fcShortDisplay = getFcCommodityDisplay(userShortCommodity);
assert(!fcShortDisplay.isTruncated, "fc short commodity → not truncated");
assert(fcShortDisplay.displayLines.length === 4, "fc short commodity → 4 lines returned intact");

const fcRefDisplay = getFcCommodityDisplay(referenceCommodity);
assert(fcRefDisplay.isTruncated, "fc reference commodity → isTruncated true");
assert(fcRefDisplay.displayLines.length === 5, `fc displayLines length = 5 (got ${fcRefDisplay.displayLines.length})`);
assert(fcRefDisplay.displayLines[0] === "1 X 40 CONTAINER STC:", "fc first line intact");
assert(fcRefDisplay.displayLines[3] === "TOTAL NET WEIGHT: 25,000.00 KGS", "fc 4th line intact");
assert(fcRefDisplay.displayLines[4].startsWith("TOTAL GR"), "fc 5th line truncated with prefix");
assert(fcRefDisplay.displayLines[4] === "TOTAL GR... (see Attachment)", `fc 5th line exactly "TOTAL GR... (see Attachment)"`);

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
