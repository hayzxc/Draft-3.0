"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  X,
  FileText,
  FileDown,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

export interface DownloadFilenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFilename: string;
  fileExtension: "pdf" | "docx";
  documentTypeLabel?: string;
  containerNumber?: string;
  certificateNumber?: string;
  onConfirmDownload: (finalFilename: string) => Promise<void>;
}

/**
 * Sanitizes input text into a safe OS filename and ensures the correct extension.
 */
export function sanitizeFilename(
  raw: string,
  ext: "pdf" | "docx"
): { cleanBase: string; fullFilename: string } {
  let clean = (raw || "").trim();
  // Strip extension if user explicitly typed it
  const extRegex = new RegExp(`\\.${ext}$`, "i");
  clean = clean.replace(extRegex, "").trim();

  // Replace invalid OS filename characters: / \ : * ? " < > |
  clean = clean.replace(/[/\\:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();

  if (!clean) {
    clean = "Dokumen";
  }

  return {
    cleanBase: clean,
    fullFilename: `${clean}.${ext}`,
  };
}

export const DownloadFilenameDialog: React.FC<DownloadFilenameDialogProps> = ({
  isOpen,
  onClose,
  defaultFilename,
  fileExtension,
  documentTypeLabel,
  containerNumber,
  certificateNumber,
  onConfirmDownload,
}) => {
  const [filename, setFilename] = useState<string>(defaultFilename);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize and auto-select text whenever dialog opens
  useEffect(() => {
    if (isOpen) {
      setFilename(defaultFilename);
      setErrorMessage(null);
      setIsDownloading(false);

      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isOpen, defaultFilename]);

  // Handle ESC key to cancel
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDownloading) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDownloading, onClose]);

  if (!isOpen) return null;

  const { cleanBase, fullFilename } = sanitizeFilename(filename, fileExtension);
  const isPdf = fileExtension === "pdf";

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isDownloading) return;

    setIsDownloading(true);
    setErrorMessage(null);

    try {
      await onConfirmDownload(fullFilename);
      // Sukses: dialog tertutup
      onClose();
    } catch (err: any) {
      // Gagal: pesan error di dalam dialog, dialog tetap terbuka
      console.error("Gagal mengunduh file:", err);
      setErrorMessage(
        err?.message ||
          "Gagal memproses dan mengunduh file. Silakan periksa kembali dan coba lagi."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleApplyPreset = (presetName: string) => {
    setFilename(presetName);
    setErrorMessage(null);
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  };

  // Generate intelligent quick-presets based on document metadata
  const presets: { label: string; value: string }[] = [];
  const cleanContainer = (containerNumber || "").replace(/[^a-zA-Z0-9_-]/g, "_").trim();
  const cleanCert = (certificateNumber || "").replace(/[^a-zA-Z0-9_-]/g, "_").trim();

  if (cleanContainer && cleanContainer !== "Draft") {
    presets.push({
      label: `Standar: GC-${cleanContainer}`,
      value: `Gas-Clearance-${cleanContainer}`,
    });
    presets.push({
      label: `Hanya Kontainer: ${cleanContainer}`,
      value: cleanContainer,
    });
  }

  if (cleanCert && cleanCert !== "Draft") {
    presets.push({
      label: `No. Sertifikat`,
      value: `Sertifikat-${cleanCert}`,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDownloading) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden animate-modal-content">
        {/* Header Section (Monochrome Minimalist) */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs">
              {isPdf ? (
                <FileText className="h-5 w-5" />
              ) : (
                <FileDown className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2
                id="download-dialog-title"
                className="text-base font-bold text-zinc-900 dark:text-zinc-100"
              >
                Unduh Dokumen {isPdf ? "PDF" : "Word (DOCX)"}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {documentTypeLabel ? `${documentTypeLabel} • ` : ""}
                Beri nama file agar langsung siap dikirim tanpa rename manual.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDownloading}
            aria-label="Tutup dialog"
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Filename Input */}
          <div>
            <label
              htmlFor="download-filename-input"
              className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5"
            >
              Nama File
            </label>
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                id="download-filename-input"
                type="text"
                value={filename}
                onChange={(e) => {
                  setFilename(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isDownloading}
                placeholder="Ketik nama file..."
                className="w-full h-11 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3.5 pr-20 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-zinc-100/15 focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors shadow-xs"
              />
              <span className="absolute right-2.5 px-2 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-600 pointer-events-none">
                .{fileExtension}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
              Karakter khusus seperti <code className="font-mono">/ \ : * ? " &lt; &gt; |</code> otomatis disesuaikan.
            </p>
          </div>

          {/* Quick Presets (if available) */}
          {presets.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                <Sparkles className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                <span>Format Cepat:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isDownloading}
                    onClick={() => handleApplyPreset(p.value)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live "Nama Akhir" Display Card (Monochrome Minimalist) */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-850/60">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
              Nama Akhir File yang Diunduh:
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300/80 dark:border-zinc-700">
                {fileExtension}
              </span>
              <span
                title={fullFilename}
                className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate"
              >
                {fullFilename}
              </span>
            </div>
          </div>

          {/* Error Message inside Dialog */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs">
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Gagal Mengunduh Dokumen</p>
                <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons (Monochrome Minimalist) */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isDownloading || !cleanBase}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 shadow-sm transition-all hover:shadow active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sedang Mengunduh...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh {isPdf ? "PDF" : "DOCX"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DownloadFilenameDialog;
