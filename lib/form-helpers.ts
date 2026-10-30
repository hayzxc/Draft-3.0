import React from "react";
import { typewriterAudio } from "./typewriter-sound";

/**
 * Normalizes copied/pasted text according to certificate formatting:
 * - Strips any stray pipe characters ("|") and replaces them with spaces.
 * - Single-line inputs: collapses all newlines and tabs into single spaces.
 * - Textareas:
 *   - Preserves intentional alinea baru (new paragraphs):
 *     1) Multiple newlines / empty lines between blocks (\n\s*\n)
 *     2) Distinct section headers (e.g. "NOTIFY PARTY", "NOTIFY:", "CONSIGNEE:")
 *   - Continuous wrapping: Merges address lines within the same paragraph with single spaces,
 *     producing a continuous (memanjang) layout without artificial linebreaks.
 */
export const cleanPastedText = (rawText: string, isSingleLine = false): string => {
  if (!rawText) return "";

  // Normalize Windows \r\n and old Mac \r to \n
  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  if (isSingleLine) {
    return normalized
      .replace(/\|+/g, " ")
      .replace(/[\n\t]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  // Multi-line inputs (Textarea): preserve explicit line breaks (\n) for alinea baru
  const rawLines = normalized.split("\n");
  const cleanedLines = rawLines.map((line) =>
    line
      .replace(/\|+/g, " ")
      .replace(/\t+/g, " ")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
  );

  return cleanedLines.join("\n").trim();
};

/**
 * Formats consignee text for display.
 * Strips pipes and cleans line spacing while preserving intentional newlines.
 */
export const formatConsigneeDisplay = (consigneeText: string | null | undefined): string => {
  if (!consigneeText) return "";
  let text = cleanPastedText(consigneeText, false);
  return text;
};

/**
 * Splits stored combined consignee text into separate Consignee and Notify Party values for the entry form.
 */
export const parseConsigneeAndNotifyParty = (
  rawText: string | null | undefined
): { consignee: string; notifyParty: string } => {
  if (!rawText) return { consignee: "", notifyParty: "" };

  const match = rawText.match(/\b(?:also\s+)?notify\s*party\s*:\s*/i);
  if (match && match.index !== undefined) {
    let cons = rawText.slice(0, match.index).trim();
    cons = cons.replace(/^consignee\s*:\s*/i, "").trim();
    const notif = rawText.slice(match.index + match[0].length).trim();
    return { consignee: cons, notifyParty: notif };
  }

  let cons = rawText.trim();
  cons = cons.replace(/^consignee\s*:\s*/i, "").trim();
  return { consignee: cons, notifyParty: "" };
};

/**
 * Combines separate Consignee and Notify Party values into a single string for storage and PDF rendering.
 */
export const combineConsigneeAndNotifyParty = (
  consignee: string | null | undefined,
  notifyParty: string | null | undefined
): string => {
  const cleanCons = (consignee || "").trim().replace(/^consignee\s*:\s*/i, "").trim();
  const cleanNotif = (notifyParty || "").trim().replace(/^(?:also\s+)?notify\s*party\s*:\s*/i, "").trim();

  if (!cleanCons && !cleanNotif) return "";
  if (!cleanNotif) return cleanCons;
  if (!cleanCons) return `NOTIFY PARTY : ${cleanNotif}`;
  return `${cleanCons} NOTIFY PARTY : ${cleanNotif}`;
};

/**
 * Formats multi-line text into clean continuous layout while preserving intentional
 * paragraph breaks (alinea baru created by Shift + Enter or pasted blank lines).
 * Normalizes pipes ("|"), tabs, and extra spaces within each alinea.
 */
export const cleanToContinuousText = (text: string | null | undefined): string => {
  if (!text) return "";
  return cleanPastedText(text, false);
};

/**
 * Programmatically updates an input or textarea element's value and notifies React & React Hook Form
 */
export const setElementNativeValue = (
  element: HTMLInputElement | HTMLTextAreaElement,
  nextValue: string,
  cursorPosition?: number
) => {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  if (descriptor && descriptor.set) {
    descriptor.set.call(element, nextValue);
  } else {
    element.value = nextValue;
  }

  if (typeof cursorPosition === "number") {
    try {
      element.setSelectionRange(cursorPosition, cursorPosition);
    } catch {
      // Ignore if element does not support selection range
    }
  }

  // Dispatch both input and change events for React Hook Form synchronization
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
};

/**
 * Handles Enter and Shift + Enter key presses inside form inputs:
 * - Enter or Shift + Enter in textareas: Inserts a newline ('\n') to create an alinea baru (new paragraph).
 * - Plain Enter in single-line inputs: Prevents unintended form submission.
 */
export const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
  const target = e.target as HTMLElement;

  if (e.key === "Enter") {
    // 1. Textareas: both Enter and Shift + Enter create an alinea baru (\n)
    if (target instanceof HTMLTextAreaElement) {
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        const start = target.selectionStart ?? target.value.length;
        const end = target.selectionEnd ?? target.value.length;
        const val = target.value;
        const nextValue = val.substring(0, start) + "\n" + val.substring(end);
        setElementNativeValue(target, nextValue, start + 1);
        typewriterAudio.playCarriageReturn();
        return;
      }
    }

    // 2. Single-line inputs: prevent unintended form submission
    if (
      target instanceof HTMLInputElement &&
      (target.type === "text" || !target.type || target.type === "search")
    ) {
      e.preventDefault();
      typewriterAudio.playCarriageReturn();
      return;
    }
  } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
    // Play authentic typewriter key click sound for all printable characters, Backspace, and Delete
    if (e.key.length === 1 || e.key === "Backspace" || e.key === "Delete") {
      typewriterAudio.playKeyClick();
    }
  }
};

/**
 * Handles Enter and Shift + Enter key presses for Gas Clearance forms:
 * - Enter or Shift + Enter in textareas (commodity):
 *   Replaces Enter with " | " without moving to a new line / alinea (memanjang).
 * - Plain Enter in single-line inputs: Prevents unintended form submission.
 */
export const handleGasClearanceFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
  const target = e.target as HTMLElement;

  if (e.key === "Enter") {
    // 1. Textareas (Commodity): Enter / Shift + Enter inserts " | " instead of \n
    if (target instanceof HTMLTextAreaElement) {
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        const start = target.selectionStart ?? target.value.length;
        const end = target.selectionEnd ?? target.value.length;
        const val = target.value;

        const before = val.substring(0, start);
        const after = val.substring(end);

        // Calculate clean spacing around the pipe so there are no duplicate spaces
        const needLeadingSpace = before.length > 0 && !before.endsWith(" ") && !before.endsWith("|");
        const needTrailingSpace = !after.startsWith(" ");

        const insertText = (needLeadingSpace ? " " : "") + "|" + (needTrailingSpace ? " " : "");
        const nextValue = before + insertText + after;
        const nextCursorPos = start + insertText.length;

        setElementNativeValue(target, nextValue, nextCursorPos);
        typewriterAudio.playCarriageReturn();
        return;
      }
    }

    // 2. Single-line inputs: prevent unintended form submission
    if (
      target instanceof HTMLInputElement &&
      (target.type === "text" || !target.type || target.type === "search")
    ) {
      e.preventDefault();
      typewriterAudio.playCarriageReturn();
      return;
    }
  } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
    if (e.key.length === 1 || e.key === "Backspace" || e.key === "Delete") {
      typewriterAudio.playKeyClick();
    }
  }
};

/**
 * Automatically formats pasted text:
 * - Strips all pipe symbols ("|").
 * - Merges consecutive wrapped address lines into a continuous (memanjang) flow.
 * - Preserves intentional paragraph breaks (alinea baru) from blank lines or section headers.
 */
export const handleFormPaste = (e: React.ClipboardEvent<HTMLFormElement>) => {
  const target = e.target as HTMLElement;

  if (
    (target instanceof HTMLInputElement &&
      (target.type === "text" || !target.type || target.type === "search")) ||
    target instanceof HTMLTextAreaElement
  ) {
    const rawData = e.clipboardData?.getData("text");
    if (!rawData) return;

    const isUppercase = target.classList.contains("uppercase");

    // Intercept when pasted text contains linebreaks, tabs, or pipes that need formatting,
    // OR when the target element requires uppercase transformation
    if (/[\r\n\t|]/.test(rawData) || isUppercase) {
      e.preventDefault();

      const el = target as HTMLInputElement | HTMLTextAreaElement;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const val = el.value;

      const isSingleLine = el instanceof HTMLInputElement;
      let cleaned = cleanPastedText(rawData, isSingleLine);
      if (isUppercase) {
        cleaned = cleaned.toUpperCase();
      }

      const before = val.substring(0, start);
      const after = val.substring(end);

      // Clean spacing around pasted content
      const needLeadingSpace =
        before.length > 0 &&
        !before.endsWith(" ") &&
        !before.endsWith("\n") &&
        !cleaned.startsWith(" ") &&
        !cleaned.startsWith("\n");

      const insertText = (needLeadingSpace ? " " : "") + cleaned;
      const nextValue = before + insertText + after;
      const nextCursorPos = start + insertText.length;

      setElementNativeValue(el, nextValue, nextCursorPos);
    }
  }
};

/**
 * Normalizes text for Gas Clearance:
 * - Single-line inputs: collapses all newlines and tabs into single spaces.
 * - Multi-line inputs (Textarea / commodity):
 *   Replaces all newlines (\r\n, \n) with " | ", preventing paragraph breaks (tanpa pindah alinea),
 *   while preserving pipes and normalizing spacing around them.
 */
export const cleanGasClearancePastedText = (rawText: string, isSingleLine = false): string => {
  if (!rawText) return "";

  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  if (isSingleLine) {
    return normalized
      .replace(/[\n\t]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  // Multi-line: replace newlines with " | "
  const rawLines = normalized.split("\n");
  const nonEmptyLines = rawLines
    .map((line) => line.replace(/\t+/g, " ").trim())
    .filter((line) => line.length > 0);

  const joined = nonEmptyLines.join(" | ");
  return joined
    .replace(/\s*\|(?:\s*\|)*\s*/g, " | ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};

/**
 * Formats pasted text for Gas Clearance forms:
 * - In textareas: replaces newlines with " | " without creating new alinea.
 */
export const handleGasClearanceFormPaste = (e: React.ClipboardEvent<HTMLFormElement>) => {
  const target = e.target as HTMLElement;

  if (
    (target instanceof HTMLInputElement &&
      (target.type === "text" || !target.type || target.type === "search")) ||
    target instanceof HTMLTextAreaElement
  ) {
    const rawData = e.clipboardData?.getData("text");
    if (!rawData) return;

    const isUppercase = target.classList.contains("uppercase");

    if (/[\r\n\t|]/.test(rawData) || isUppercase) {
      e.preventDefault();

      const el = target as HTMLInputElement | HTMLTextAreaElement;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const val = el.value;

      const isSingleLine = el instanceof HTMLInputElement;
      let cleaned = cleanGasClearancePastedText(rawData, isSingleLine);
      if (isUppercase) {
        cleaned = cleaned.toUpperCase();
      }

      const before = val.substring(0, start);
      const after = val.substring(end);

      const needLeadingSpace =
        before.length > 0 &&
        !before.endsWith(" ") &&
        !before.endsWith("|") &&
        !cleaned.startsWith(" ") &&
        !cleaned.startsWith("|");

      const insertText = (needLeadingSpace ? " " : "") + cleaned;
      const nextValue = before + insertText + after;
      const nextCursorPos = start + insertText.length;

      setElementNativeValue(el, nextValue, nextCursorPos);
    }
  }
};

/**
 * Clean input handler: ensures inputs with the 'uppercase' class store their values in uppercase
 * and prevents lowercase characters from desyncing with the uppercase CSS display.
 */
export const handleFormInput = (e: React.FormEvent<HTMLFormElement>) => {
  const target = e.target as HTMLElement;
  if (
    (target instanceof HTMLInputElement &&
      (target.type === "text" || !target.type || target.type === "search")) ||
    target instanceof HTMLTextAreaElement
  ) {
    if (target.classList.contains("uppercase")) {
      const el = target as HTMLInputElement | HTMLTextAreaElement;
      const upper = el.value.toUpperCase();
      if (el.value !== upper) {
        const start = el.selectionStart;
        setElementNativeValue(el, upper, start ?? undefined);
      }
    }
  }
};
