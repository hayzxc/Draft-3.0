"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TreatmentForm } from "./TreatmentForm";
import { TreatmentDocument, TreatmentCertificateData } from "./TreatmentDocument";
import { PDFViewerWrapper } from "@/components/pdf/PDFViewerWrapper";
import { DownloadFilenameDialog } from "@/components/ui/DownloadFilenameDialog";
import { generateQrDataUrl } from "@/lib/qr";
import { typewriterAudio } from "@/lib/typewriter-sound";
import { generateTreatmentDocxBlob } from "@/lib/treatment-docx";
import { useDebounce } from "@/lib/use-debounce";
import {
  Download,
  Volume2,
  VolumeX,
  FileDown,
  Loader2,
} from "lucide-react";

interface TreatmentEditorProps {
  initialData?: TreatmentCertificateData;
  isEditing?: boolean;
}

export const TreatmentEditor: React.FC<TreatmentEditorProps> = ({
  initialData,
  isEditing = false,
}) => {
  const [previewData, setPreviewData] = useState<TreatmentCertificateData>(
    initialData || {
      serialNo: "",
      dateIssued: undefined as any,
      certificateNumber: "",
      consignmentLinkPpk: "",
      consignmentLinkDo: "",
      consignmentLinkBl: "",
      containers: "",
      consignee: "",
      sealNumbers: "",
      carrierVessel: "",
      clientNameAddress: "",
      commodityDescription: "",
      originCountry: "INDONESIA",
      destinationCountry: "",
      portOfLoading: "",
      portOfUnloading: "",
      targetOfFumigation: "",
      enclosureType: "",
      prescribedDoseRate: "",
      prescribedExposurePeriod: "",
      prescribedTemperature: "",
      appliedDose: "",
      appliedExposurePeriod: "",
      appliedTemperature: "",
      placeOfFumigation: "",
      commencingAt: undefined as any,
      completedAt: undefined as any,
      finalTlvReading: "",
      fumigatorName: "",
      fumigatorAccreditationNumber: "",
      fumigatorSignatureUrl: null,
      additionalDeclarations: "",
      verificationUrl: "",
      qrCodeDataUrl: "",
      includeGasClearance: true,
      gcCertificateNumber: "",
      gcRegistrationNumber: "ID0018MB",
      gcGasLevelReading: "",
      gcFumigant: "Methyl Bromide (CH3Br)",
      gcSerialNo: "",
    }
  );

  // Debounce PDF document data to prevent CPU spikes & iframe blinking while actively typing
  const debouncedPdfData = useDebounce(previewData, 700);
  const isTyping = previewData !== debouncedPdfData;

  const [activeField, setActiveField] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  // Stable callbacks for form to avoid re-rendering form on parent state change
  const handleDataChange = useCallback((data: TreatmentCertificateData) => {
    setPreviewData(data);
  }, []);

  const handleActiveFieldChange = useCallback((field: string | null) => {
    setActiveField(field);
  }, []);

  // Initialize sound state
  useEffect(() => {
    setSoundEnabled(typewriterAudio.getEnabled());
  }, []);

  const handleToggleSound = () => {
    const nextState = typewriterAudio.toggle();
    setSoundEnabled(nextState);
  };

  // Initial QR Code generation
  useEffect(() => {
    if (previewData.verificationUrl) {
      generateQrDataUrl(previewData.verificationUrl).then((qr) => {
        setPreviewData((prev) => ({ ...prev, qrCodeDataUrl: qr }));
      });
    } else {
      setPreviewData((prev) => ({ ...prev, qrCodeDataUrl: "" }));
    }
  }, [previewData.verificationUrl]);

  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Dialog state for filename confirmation before downloading
  const [downloadDialog, setDownloadDialog] = useState<{
    isOpen: boolean;
    type: "pdf" | "docx";
    defaultFilename: string;
  }>({
    isOpen: false,
    type: "pdf",
    defaultFilename: "",
  });

  // Open dialog for DOCX download
  const handleOpenDocxDialog = () => {
    const rawCert = previewData.certificateNumber?.trim();
    const rawCont = previewData.containers?.trim()?.split(/[\r\n,]+/)[0]?.trim();
    const safePart = (rawCert || rawCont || "Draft").replace(/[^a-zA-Z0-9_-]/g, "_");
    setDownloadDialog({
      isOpen: true,
      type: "docx",
      defaultFilename: `Treatment-Certificate-${safePart}`,
    });
  };

  // Open dialog for PDF download
  const handleOpenPdfDialog = () => {
    const rawCert = previewData.certificateNumber?.trim();
    const rawCont = previewData.containers?.trim()?.split(/[\r\n,]+/)[0]?.trim();
    const safePart = (rawCert || rawCont || "Draft").replace(/[^a-zA-Z0-9_-]/g, "_");
    setDownloadDialog({
      isOpen: true,
      type: "pdf",
      defaultFilename: `Treatment-Certificate-${safePart}`,
    });
  };

  // Execute download with user's chosen filename
  const handleConfirmDownload = async (finalFilename: string) => {
    if (downloadDialog.type === "docx") {
      setIsGeneratingDocx(true);
      try {
        const blob = await generateTreatmentDocxBlob(previewData);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } finally {
        setIsGeneratingDocx(false);
      }
    } else {
      setIsGeneratingPdf(true);
      try {
        let blob: Blob;
        try {
          const { pdf } = await import("@react-pdf/renderer");
          blob = await pdf(<TreatmentDocument data={previewData} />).toBlob();
        } catch (clientErr) {
          if (initialData?.id) {
            const res = await fetch(`/api/treatment-certificates/${initialData.id}/pdf`);
            if (!res.ok) throw clientErr;
            blob = await res.blob();
          } else {
            throw clientErr;
          }
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } finally {
        setIsGeneratingPdf(false);
      }
    }
  };

  const isBundled = previewData.includeGasClearance !== false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Form Editor (Full One-Page Entry Form, 6-Column) */}
      <div className="lg:col-span-6 xl:col-span-6 space-y-6">
        <TreatmentForm
          initialData={initialData}
          isEditing={isEditing}
          onDataChange={handleDataChange}
          onActiveFieldChange={handleActiveFieldChange}
        />
      </div>

      {/* Right Column: PDF Preview & Export */}
      <div className="lg:col-span-6 xl:col-span-6 sticky top-4 space-y-3">
        {/* Action Toolbar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-card dark:bg-slate-900 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Audio Toggle & Status */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleSound}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  soundEnabled
                    ? "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700"
                }`}
                title={
                  soundEnabled
                    ? "Typewriter sound FX enabled (click to mute)"
                    : "Click to enable typewriter sound FX"
                }
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Suara Mesin Tik: ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                    <span>Suara Mesin Tik: Bisu</span>
                  </>
                )}
              </button>

              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden sm:inline-block">
                • {isBundled ? "2 Halaman Dokumen Bundling" : "1 Halaman Dokumen Resmi"}
              </span>

              {isTyping && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
                  Mengetik...
                </span>
              )}
            </div>

            {/* Export Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Download DOCX Button (Word .docx format) */}
              <button
                type="button"
                id="btn-download-docx"
                onClick={handleOpenDocxDialog}
                disabled={isGeneratingDocx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                title={
                  isBundled
                    ? "Download Dokumen Gabungan FC + GC (2 Halaman Word .docx)"
                    : "Download Fumigation Certificate (1 Halaman Word .docx)"
                }
              >
                {isGeneratingDocx ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Membuat DOCX...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                    <span>DOCX {isBundled ? "(2 Hal)" : "(1 Hal)"}</span>
                  </>
                )}
              </button>

              {/* Download PDF Button (Adobe PDF format) */}
              <button
                type="button"
                id="btn-download-pdf"
                onClick={handleOpenPdfDialog}
                disabled={isGeneratingPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                title={
                  isBundled
                    ? "Download Dokumen Gabungan FC + GC (2 Halaman PDF)"
                    : "Download Fumigation Certificate (1 Halaman PDF)"
                }
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Membuat PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF {isBundled ? "(2 Hal)" : "(1 Hal)"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Viewport Frame: PDF Compatibility Live View */}
        <div className="w-full h-[calc(100vh-170px)] min-h-[820px] rounded-2xl overflow-hidden shadow-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
          <PDFViewerWrapper className="w-full h-full min-h-[820px] border-0">
            <TreatmentDocument data={debouncedPdfData} />
          </PDFViewerWrapper>
        </div>
      </div>

      {/* Rename File Before Download Dialog */}
      <DownloadFilenameDialog
        isOpen={downloadDialog.isOpen}
        onClose={() => setDownloadDialog((prev) => ({ ...prev, isOpen: false }))}
        defaultFilename={downloadDialog.defaultFilename}
        fileExtension={downloadDialog.type}
        documentTypeLabel="Treatment Certificate"
        containerNumber={previewData.containers || ""}
        certificateNumber={previewData.certificateNumber || ""}
        onConfirmDownload={handleConfirmDownload}
      />
    </div>
  );
};

export default TreatmentEditor;
