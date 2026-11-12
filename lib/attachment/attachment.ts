import { ATTACHMENT_CONFIG } from "./config";

/**
 * Wraps a line of text based on word boundaries up to maxChars per line.
 * If an individual word exceeds maxChars, it is split across chunks.
 */
export function wrapTextToLines(
  text: string,
  maxChars: number = ATTACHMENT_CONFIG.CHARS_PER_LINE
): string[] {
  if (!text) return [];
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!word) {
      if (currentLine) currentLine += " ";
      continue;
    }

    if (!currentLine) {
      if (word.length <= maxChars) {
        currentLine = word;
      } else {
        let remaining = word;
        while (remaining.length > maxChars) {
          lines.push(remaining.slice(0, maxChars));
          remaining = remaining.slice(maxChars);
        }
        currentLine = remaining;
      }
    } else if (currentLine.length + 1 + word.length <= maxChars) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      if (word.length <= maxChars) {
        currentLine = word;
      } else {
        let remaining = word;
        while (remaining.length > maxChars) {
          lines.push(remaining.slice(0, maxChars));
          remaining = remaining.slice(maxChars);
        }
        currentLine = remaining;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [""];
}

/**
 * Counts visual lines rendered for a commodity text block,
 * taking into account newlines and dynamic word wrapping based on CHARS_PER_LINE.
 */
export function countCommodityLines(
  text: string | null | undefined,
  charsPerLine: number = ATTACHMENT_CONFIG.CHARS_PER_LINE
): number {
  if (!text || !text.trim()) return 0;
  const rawLines = text.split(/\r?\n/);
  let totalLines = 0;
  for (const line of rawLines) {
    const wrapped = wrapTextToLines(line, charsPerLine);
    totalLines += Math.max(1, wrapped.length);
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
  maxLines: number = ATTACHMENT_CONFIG.MAX_COMMODITY_LINES,
  charsPerLine: number = ATTACHMENT_CONFIG.CHARS_PER_LINE
): {
  isTruncated: boolean;
  displayLines: string[];
} {
  if (!text) {
    return { isTruncated: false, displayLines: ["-"] };
  }

  const lines = text.split(/\r?\n/);
  const totalLines = countCommodityLines(text, charsPerLine);
  if (totalLines <= maxLines) {
    return { isTruncated: false, displayLines: lines };
  }

  const result: string[] = [];
  let visualCount = 0;
  for (const line of lines) {
    const wrapped = wrapTextToLines(line, charsPerLine);
    const lineVisual = Math.max(1, wrapped.length);
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
 * Counts detected containers from an array of items, or a comma/newline separated string.
 */
export function getContainerCount(
  containers: any[] | string | null | undefined
): number {
  if (!containers) return 0;
  if (Array.isArray(containers)) return containers.length;
  if (typeof containers === "string") {
    return containers
      .split(/[\r\n,;|]+/)
      .map((s) => s.trim())
      .filter(Boolean).length;
  }
  return 0;
}

/**
 * Returns true if the number of containers meets or exceeds the attachment threshold (>= 4).
 * If 1 container (or <= 3), returns false (appears directly on main page without going to attachment).
 */
export function needsContainerAttachment(
  containers: any[] | string | null | undefined
): boolean {
  return getContainerCount(containers) >= ATTACHMENT_CONFIG.CONTAINER_ATTACHMENT_THRESHOLD;
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

