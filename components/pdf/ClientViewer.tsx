"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface ClientViewerProps {
  children: React.ReactElement<any>;
  className?: string;
  showToolbar?: boolean;
}

/**
 * FlickerFree ClientViewer with Dual-Buffer cross-fading.
 * Prevents screen flashing/blinking when typing in the certificate form.
 */
export default function ClientViewer({
  children,
  className = "w-full h-full",
  showToolbar = true,
}: ClientViewerProps) {
  // Two buffer slots: A and B
  const [urlA, setUrlA] = useState<string | null>(null);
  const [urlB, setUrlB] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<"A" | "B">("A");
  const [isInitialReady, setIsInitialReady] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);

  // Keep track of active and previous URLs to revoke them safely without leaking memory
  const urlARef = useRef<string | null>(null);
  const urlBRef = useRef<string | null>(null);
  const activeSlotRef = useRef<"A" | "B">("A");
  const prevDocDataRef = useRef<any>(null);
  const compilationSeqRef = useRef<number>(0);

  urlARef.current = urlA;
  urlBRef.current = urlB;
  activeSlotRef.current = activeSlot;

  // Cleanup all blob URLs on unmount
  useEffect(() => {
    return () => {
      if (urlARef.current) URL.revokeObjectURL(urlARef.current);
      if (urlBRef.current) URL.revokeObjectURL(urlBRef.current);
    };
  }, []);

  // Compile PDF document when children prop (or its data) changes
  useEffect(() => {
    // Check if data actually changed
    const currentData = children?.props?.data;
    if (prevDocDataRef.current && currentData && prevDocDataRef.current === currentData) {
      return;
    }
    prevDocDataRef.current = currentData;

    let isCancelled = false;
    const seq = ++compilationSeqRef.current;
    setIsCompiling(true);

    const generatePdfBlob = async () => {
      try {
        const { pdf } = await import("@react-pdf/renderer");
        const blob = await pdf(children).toBlob();

        if (isCancelled || seq !== compilationSeqRef.current) {
          return;
        }

        const newUrl = URL.createObjectURL(blob);
        const currentActive = activeSlotRef.current;

        if (!urlARef.current && !urlBRef.current) {
          // Very first render: populate Slot A directly
          setUrlA(newUrl);
          setActiveSlot("A");
          setIsInitialReady(true);
          setIsCompiling(false);
          return;
        }

        // Double buffer swap:
        // If A is currently active, load into B invisibly
        if (currentActive === "A") {
          setUrlB(newUrl);
          // Wait briefly for the browser/iframe to mount the new PDF blob into Slot B
          setTimeout(() => {
            if (isCancelled || seq !== compilationSeqRef.current) {
              URL.revokeObjectURL(newUrl);
              return;
            }
            setActiveSlot("B");
            setIsCompiling(false);
            // Revoke Slot A's old URL after smooth fade completes
            setTimeout(() => {
              if (urlARef.current) {
                URL.revokeObjectURL(urlARef.current);
                setUrlA(null);
              }
            }, 500);
          }, 250);
        } else {
          // If B is currently active, load into A invisibly
          setUrlA(newUrl);
          setTimeout(() => {
            if (isCancelled || seq !== compilationSeqRef.current) {
              URL.revokeObjectURL(newUrl);
              return;
            }
            setActiveSlot("A");
            setIsCompiling(false);
            // Revoke Slot B's old URL after smooth fade completes
            setTimeout(() => {
              if (urlBRef.current) {
                URL.revokeObjectURL(urlBRef.current);
                setUrlB(null);
              }
            }, 500);
          }, 250);
        }
      } catch (err) {
        console.error("FlickerFreePDFViewer error:", err);
        setIsCompiling(false);
      }
    };

    generatePdfBlob();

    return () => {
      isCancelled = true;
    };
  }, [children]);

  const toolbarParam = showToolbar ? "1" : "0";

  return (
    <div className={`relative w-full h-full overflow-hidden bg-slate-100 dark:bg-slate-900 ${className}`}>
      {/* Subtle non-intrusive syncing indicator pill */}
      {isCompiling && isInitialReady && (
        <div className="absolute top-3 right-4 z-30 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur text-white text-[11px] font-medium shadow-md transition-opacity duration-200 pointer-events-none">
          <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
          <span>Menyinkronkan dokumen...</span>
        </div>
      )}

      {/* Buffer Slot A */}
      {urlA && (
        <iframe
          src={`${urlA}#toolbar=${toolbarParam}&navpanes=0&scrollbar=1&view=FitH`}
          title="Pratinjau Dokumen Resmi PDF"
          className={`absolute inset-0 w-full h-full border-0 transition-opacity duration-300 ease-in-out ${
            activeSlot === "A" && isInitialReady
              ? "opacity-100 z-10 pointer-events-auto"
              : "opacity-0 z-0 pointer-events-none"
          }`}
        />
      )}

      {/* Buffer Slot B */}
      {urlB && (
        <iframe
          src={`${urlB}#toolbar=${toolbarParam}&navpanes=0&scrollbar=1&view=FitH`}
          title="Pratinjau Dokumen Resmi PDF (Buffer)"
          className={`absolute inset-0 w-full h-full border-0 transition-opacity duration-300 ease-in-out ${
            activeSlot === "B" && isInitialReady
              ? "opacity-100 z-10 pointer-events-auto"
              : "opacity-0 z-0 pointer-events-none"
          }`}
        />
      )}

      {/* Initial Mount Loader */}
      {!isInitialReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500 z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tracking-wide">
              Menyiapkan Pratinjau PDF Engine Resmi...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
