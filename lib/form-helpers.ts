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

  const rawLines = normalized.split("\n");
  const paragraphs: string[] = [];
  let currentParagraphWords: string[] = [];

  const flushCurrentParagraph = () => {
    if (currentParagraphWords.length > 0) {
      paragraphs.push(currentParagraphWords.join(" "));
      currentParagraphWords = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    // Replace pipes and tabs with space within this line
    const cleanedLine = rawLine
      .replace(/\|+/g, " ")
      .replace(/\t+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    // If line is empty, it marks an explicit paragraph break (alinea baru from Shift + Enter or blank line)
    if (!cleanedLine) {
      flushCurrentParagraph();
      continue;
    }

    currentParagraphWords.push(cleanedLine);
  }

  flushCurrentParagraph();

  return paragraphs.join("\n");
};

/**
 * Formats consignee & notify party text for certificate display (PDF, HTML Preview, and DOCX):
 * - Prepends "CONSIGNEE : " if not already present.
 * - Directly continues to NOTIFY PARTY without adding a new alinea (layout memanjang).
 * - Strips any stray pipes ("|") and joins newlines before NOTIFY PARTY with a single space.
 */
export const formatConsigneeDisplay = (consigneeText: string | null | undefined): string => {
  if (!consigneeText) return "";
  let text = cleanPastedText(consigneeText, false);
  if (!text) return "";

  // Merge any newline into continuous stream with single space
  text = text.replace(/[\r\n]+/g, " ");

  // Normalize CONSIGNEE prefix
  if (/^consignee\s*:/i.test(text)) {
    text = text.replace(/^consignee\s*:\s*/i, "CONSIGNEE : ");
  } else if (!/^consignee/i.test(text)) {
    text = `CONSIGNEE : ${text}`;
  }

  // Normalize NOTIFY PARTY prefix spacing (e.g. "NOTIFY PARTY : ")
  text = text.replace(/\bnotify\s*party\s*:\s*/gi, "NOTIFY PARTY : ");

  // Collapse accidental multiple spaces
  text = text.replace(/[ \t]{2,}/g, " ").trim();

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
 * - Shift + Enter: Inserts a newline ('\n') to create an alinea baru (new paragraph).
 * - Plain Enter in single-line inputs: Prevents unintended form submission.
 * - Plain Enter in textareas: Inserts a single space to continue typing inline (layout memanjang),
 *   keeping text flow continuous without breaking into a new alinea.
 */
export const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
  const target = e.target as HTMLElement;

  if (e.key === "Enter") {
    // 1. Shift + Enter: Explicitly creates an alinea baru (new paragraph) in textareas
    if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (target instanceof HTMLTextAreaElement) {
        e.preventDefault();
        const start = target.selectionStart ?? target.value.length;
        const end = target.selectionEnd ?? target.value.length;
        const val = target.value;
        const nextValue = val.substring(0, start) + "\n" + val.substring(end);
        setElementNativeValue(target, nextValue, start + 1);
        typewriterAudio.playCarriageReturn();
        return;
      }
      if (
        target instanceof HTMLInputElement &&
        (target.type === "text" || !target.type || target.type === "search")
      ) {
        e.preventDefault();
        return;
      }
    }

    // 2. Plain Enter (without Shift):
    if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      // In single-line inputs, prevent accidental submit
      if (
        target instanceof HTMLInputElement &&
        (target.type === "text" || !target.type || target.type === "search")
      ) {
        e.preventDefault();
        typewriterAudio.playCarriageReturn();
        return;
      }

      // In textareas, Enter inserts a space to maintain continuous (memanjang) layout
      if (target instanceof HTMLTextAreaElement) {
        e.preventDefault();
        const start = target.selectionStart ?? target.value.length;
        const end = target.selectionEnd ?? target.value.length;
        const val = target.value;
        const before = val.substring(0, start);
        const after = val.substring(end);

        const needSpace =
          before.length > 0 &&
          !before.endsWith(" ") &&
          !before.endsWith("\n") &&
          !after.startsWith(" ");
        const insertText = needSpace ? " " : "";

        if (insertText || start !== end) {
          const nextValue = before + insertText + after;
          setElementNativeValue(target, nextValue, start + insertText.length);
          typewriterAudio.playKeyClick();
        }
        return;
      }
    }
  } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
    // Play authentic typewriter key click sound for all printable characters, Backspace, and Delete
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

    // Intercept when pasted text contains linebreaks, tabs, or pipes that need formatting
    if (/[\r\n\t|]/.test(rawData)) {
      e.preventDefault();

      const el = target as HTMLInputElement | HTMLTextAreaElement;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const val = el.value;

      const isSingleLine = el instanceof HTMLInputElement;
      const cleaned = cleanPastedText(rawData, isSingleLine);

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
 * Clean input handler: lets browser input work cleanly without injecting pipe symbols.
 */
export const handleFormInput = (_e: React.FormEvent<HTMLFormElement>) => {
  // Let native input work cleanly without injecting pipes
};
