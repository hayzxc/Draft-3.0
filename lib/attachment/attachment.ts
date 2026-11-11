import { ATTACHMENT_CONFIG } from "./config";

/**
 * Counts visual lines rendered for a commodity text block,
 * taking into account newlines and wrapping based on CHARS_PER_LINE.
 */
export function countCommodityLines(text: string | null | undefined): number {
  if (!text || !text.trim()) return 0;
  const rawLines = text.split("\n");
  let totalLines = 0;
  for (const line of rawLines) {
    totalLines += Math.max(1, Math.ceil(line.length / ATTACHMENT_CONFIG.CHARS_PER_LINE));
  }
  return totalLines;
}

/**
 * Returns true if the commodity text exceeds the line budget of page 1.
 */
export function needsAttachment(text: string | null | undefined): boolean {
  return countCommodityLines(text) > ATTACHMENT_CONFIG.MAX_COMMODITY_LINES;
}

/**
 * Returns true if the commodity text exceeds the FC page 1 line budget.
 */
export function needsFcAttachment(text: string | null | undefined): boolean {
  return countCommodityLines(text) > ATTACHMENT_CONFIG.MAX_FC_COMMODITY_LINES;
}

/**
 * Prepares the commodity text for Page 1 display.
 * If truncated, displays up to (maxLines - 1) visual lines,
 * followed by a truncated last line + "... (see Attachment)".
 */
export function getCommodityDisplay(
  text: string | null | undefined,
  maxLines: number = ATTACHMENT_CONFIG.MAX_COMMODITY_LINES
): {
  isTruncated: boolean;
  displayLines: string[];
} {
  if (!text) {
    return { isTruncated: false, displayLines: ["-"] };
  }

  const lines = text.split("\n");
  const totalLines = countCommodityLines(text);
  if (totalLines <= maxLines) {
    return { isTruncated: false, displayLines: lines };
  }

  const result: string[] = [];
  let visualCount = 0;
  for (const line of lines) {
    const lineVisual = Math.max(1, Math.ceil(line.length / ATTACHMENT_CONFIG.CHARS_PER_LINE));
    if (visualCount + lineVisual <= maxLines - 1) {
      result.push(line);
      visualCount += lineVisual;
    } else {
      const prefix =
        line.length > ATTACHMENT_CONFIG.TRUNCATE_PREVIEW_CHARS
          ? line.slice(0, ATTACHMENT_CONFIG.TRUNCATE_PREVIEW_CHARS)
          : line;
      result.push(`${prefix.trimEnd()}... ${ATTACHMENT_CONFIG.ATTACHMENT_MARKER}`);
      break;
    }
  }

  return { isTruncated: true, displayLines: result };
}

/**
 * Prepares the commodity text for Treatment Certificate (FC) Page 1 display.
 */
export function getFcCommodityDisplay(text: string | null | undefined): {
  isTruncated: boolean;
  displayLines: string[];
} {
  return getCommodityDisplay(text, ATTACHMENT_CONFIG.MAX_FC_COMMODITY_LINES);
}

/**
 * Splits container items into two column groups (left: 1..ceil(n/2), right: remainder).
 */
export function splitContainerColumns<T>(items: T[] | null | undefined): { left: T[]; right: T[] } {
  if (!items || items.length === 0) {
    return { left: [], right: [] };
  }
  const leftCount = Math.ceil(items.length / 2);
  return {
    left: items.slice(0, leftCount),
    right: items.slice(leftCount),
  };
}

/**
 * Formats gas concentration summary for Page 1 when attachment is active.
 * E.g.: "1 containers — 0–0 ppm (see Attachment)"
 */
export function getGasSummary(tlvs: number[]): string {
  const count = tlvs.length || 1;
  const valid = (tlvs || []).filter((n) => typeof n === "number" && !isNaN(n));
  const min = valid.length > 0 ? Math.min(...valid) : 0;
  const max = valid.length > 0 ? Math.max(...valid) : 0;
  return `${count} containers \u2014 ${min}\u2013${max} ppm ${ATTACHMENT_CONFIG.ATTACHMENT_MARKER}`;
}

/**
 * Formats container number summary for Page 1 when attachment is active.
 * E.g.: "1 containers (see Attachment)"
 */
export function getContainerSummary(count: number): string {
  const c = Math.max(1, count || 1);
  return `${c} containers ${ATTACHMENT_CONFIG.ATTACHMENT_MARKER}`;
}

