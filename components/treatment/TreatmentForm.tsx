"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Save,
  Download,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Ship,
  UserCheck,
  Calendar,
  Lock,
  MapPin,
  Clock,
  Gauge,
  QrCode,
  Layers,
  Box,
  Hash,
  Award,
  UploadCloud,
  X,
  Keyboard,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { treatmentCertificateSchema, TreatmentCertificateInput } from "@/lib/treatment-schema";
import { CERTIFICATE_CONSTANTS } from "@/lib/certificate-constants";
import { generateQrDataUrl } from "@/lib/qr";
import {
  handleFormKeyDown,
  handleFormPaste,
  handleFormInput,
  parseConsigneeAndNotifyParty,
  combineConsigneeAndNotifyParty,
} from "@/lib/form-helpers";
import { typewriterAudio } from "@/lib/typewriter-sound";
import { TreatmentCertificateData } from "./TreatmentDocument";
import { CountryCombobox } from "./CountryCombobox";
import { FumigationFacilitySelect } from "./FumigationFacilitySelect";

interface TreatmentFormProps {
  initialData?: TreatmentCertificateData;
  isEditing?: boolean;
  onDataChange: (data: TreatmentCertificateData) => void;
  onActiveFieldChange?: (field: string | null) => void;
}

const TreatmentFormComponent: React.FC<TreatmentFormProps> = ({
  initialData,
  isEditing = false,
  onDataChange,
  onActiveFieldChange,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>(initialData?.qrCodeDataUrl || "");

  // Parse consignee & notify party if already formatted together
  const parsedConsignee = parseConsigneeAndNotifyParty(initialData?.consignee);

  const defaultValues: Partial<TreatmentCertificateInput> = {
    serialNo: initialData?.serialNo ?? "",
    dateIssued: initialData?.dateIssued ? new Date(initialData.dateIssued) : (undefined as any),
    certificateNumber: initialData?.certificateNumber ?? "",
    consignmentLinkPpk: initialData?.consignmentLinkPpk ?? "",
    consignmentLinkDo: initialData?.consignmentLinkDo ?? "",
    consignmentLinkBl: initialData?.consignmentLinkBl ?? "",
    containers: initialData?.containers ?? "",
    consignee: parsedConsignee.consignee,
    notifyParty: (initialData as any)?.notifyParty ?? parsedConsignee.notifyParty,
    sealNumbers: initialData?.sealNumbers ?? "",
    carrierVessel: initialData?.carrierVessel ?? "",
    clientNameAddress: initialData?.clientNameAddress ?? "",
    commodityDescription: initialData?.commodityDescription ?? "",
    originCountry: initialData?.originCountry !== undefined && initialData?.originCountry !== null && initialData?.originCountry !== "" ? initialData.originCountry : (isEditing ? "" : "INDONESIA"),
    destinationCountry: initialData?.destinationCountry ?? "",
    portOfLoading: initialData?.portOfLoading ?? "",
    portOfUnloading: initialData?.portOfUnloading ?? "",
    targetOfFumigation: initialData?.targetOfFumigation ?? "",
    enclosureType: initialData?.enclosureType ?? "",
    prescribedDoseRate: initialData?.prescribedDoseRate ?? "",
    prescribedExposurePeriod: initialData?.prescribedExposurePeriod ?? "",
    prescribedTemperature: initialData?.prescribedTemperature ?? "",
    appliedDose: initialData?.appliedDose ?? "",
    appliedExposurePeriod: initialData?.appliedExposurePeriod ?? "",
    appliedTemperature: initialData?.appliedTemperature ?? "",
    placeOfFumigation: initialData?.placeOfFumigation ?? "",
    commencingAt: initialData?.commencingAt
      ? new Date(initialData.commencingAt)
      : (undefined as any),
    completedAt: initialData?.completedAt
      ? new Date(initialData.completedAt)
      : (undefined as any),
    finalTlvReading: initialData?.finalTlvReading ?? "",
    fumigatorName: initialData?.fumigatorName ?? "",
    fumigatorAccreditationNumber: initialData?.fumigatorAccreditationNumber ?? "",
    fumigatorSignatureUrl: initialData?.fumigatorSignatureUrl ?? "",
    additionalDeclarations: initialData?.additionalDeclarations ?? "",
    verificationUrl: initialData?.verificationUrl ?? "",
    includeGasClearance: initialData?.includeGasClearance ?? true,
    gcCertificateNumber: initialData?.gcCertificateNumber ?? "",
    gcRegistrationNumber: initialData?.gcRegistrationNumber ?? "ID0018MB",
    gcGasLevelReading: initialData?.gcGasLevelReading ?? "",
    gcFumigant: initialData?.gcFumigant ?? "Methyl Bromide (CH3Br)",
    gcSerialNo: initialData?.gcSerialNo ?? "",
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TreatmentCertificateInput>({
    resolver: zodResolver(treatmentCertificateSchema),
    defaultValues: defaultValues as any,
  });

  const currentVerificationUrl = watch("verificationUrl");
  const watchedContainers = watch("containers");
  const watchedCommencingAt = watch("commencingAt");
  const watchedCompletedAt = watch("completedAt");
  const watchIncludeGc = watch("includeGasClearance") ?? true;
  const watchedPlaceOfFumigation = watch("placeOfFumigation") || "";

  const qrCodeDataUrlRef = useRef<string>(qrCodeDataUrl);
  qrCodeDataUrlRef.current = qrCodeDataUrl;

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Generate QR Code data url when verification url changes
  useEffect(() => {
    if (currentVerificationUrl) {
      generateQrDataUrl(currentVerificationUrl).then((dataUrl) => {
        setQrCodeDataUrl(dataUrl);
      });
    } else {
      setQrCodeDataUrl("");
    }
  }, [currentVerificationUrl]);

  // Update live preview
  useEffect(() => {
    const subscription = watch((value) => {
      onDataChange({
        id: initialData?.id,
        serialNo: value.serialNo || "",
        dateIssued: value.dateIssued ? new Date(value.dateIssued) : (undefined as any),
        certificateNumber: value.certificateNumber || "",
        consignmentLinkPpk: value.consignmentLinkPpk || "",
        consignmentLinkDo: value.consignmentLinkDo || "",
        consignmentLinkBl: value.consignmentLinkBl || "",
        containers: value.containers || "",
        consignee: combineConsigneeAndNotifyParty(value.consignee, (value as any).notifyParty),
        notifyParty: (value as any).notifyParty || "",
        sealNumbers: value.sealNumbers || "",
        carrierVessel: value.carrierVessel || "",
        clientNameAddress: value.clientNameAddress || "",
        commodityDescription: value.commodityDescription || "",
        originCountry: value.originCountry || "",
        destinationCountry: value.destinationCountry || "",
        portOfLoading: value.portOfLoading || "",
        portOfUnloading: value.portOfUnloading || "",
        targetOfFumigation: value.targetOfFumigation || "",
        enclosureType: value.enclosureType || "",
        prescribedDoseRate: value.prescribedDoseRate || "",
        prescribedExposurePeriod: value.prescribedExposurePeriod || "",
        prescribedTemperature: value.prescribedTemperature || "",
        appliedDose: value.appliedDose || "",
        appliedExposurePeriod: value.appliedExposurePeriod || "",
        appliedTemperature: value.appliedTemperature || "",
        placeOfFumigation: value.placeOfFumigation || "",
        commencingAt: value.commencingAt ? new Date(value.commencingAt) : (undefined as any),
        completedAt: value.completedAt ? new Date(value.completedAt) : (undefined as any),
        finalTlvReading: value.finalTlvReading || "",
        fumigatorName: value.fumigatorName || "",
        fumigatorAccreditationNumber: value.fumigatorAccreditationNumber || "",
        fumigatorSignatureUrl: value.fumigatorSignatureUrl || null,
        additionalDeclarations: value.additionalDeclarations || "",
        verificationUrl: value.verificationUrl || "",
        qrCodeDataUrl: qrCodeDataUrlRef.current,
        includeGasClearance: value.includeGasClearance,
        gcCertificateNumber: value.gcCertificateNumber || "",
        gcRegistrationNumber: value.gcRegistrationNumber || "ID0018MB",
        gcGasLevelReading: value.gcGasLevelReading || "",
        gcFumigant: value.gcFumigant || "Methyl Bromide (CH3Br)",
        gcSerialNo: value.gcSerialNo || "",
      });
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange, initialData]);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setValue("fumigatorSignatureUrl", base64, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: TreatmentCertificateInput) => {
    setIsSubmitting(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const url =
        isEditing && initialData?.id
          ? `/api/treatment-certificates/${initialData.id}`
          : "/api/treatment-certificates";
      const method = isEditing ? "PATCH" : "POST";

      const combinedConsignee = combineConsigneeAndNotifyParty(
        data.consignee,
        (data as any).notifyParty
      );
      const payload: any = {
        ...data,
        consignee: combinedConsignee || null,
        qrCodeDataUrl,
      };
      delete payload.notifyParty;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save treatment certificate");
      }

      const result = await res.json();
      setSaveSuccess(true);
      if (!isEditing) {
        router.push(`/treatment/${result.id}`);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toInputDate = (d: any) => {
    if (!d) return "";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return "";
      return format(date, "yyyy-MM-dd");
    } catch {
      return "";
    }
  };

  const toInputDateTime = (d: any) => {
    if (!d) return "";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return "";
      return format(date, "yyyy-MM-dd'T'HH:mm");
    } catch {
      return "";
    }
  };

  // Count containers detected
  const containerCount = watchedContainers
    ? watchedContainers
        .split(/[,|\n]+/)
        .map((s) => s.trim())
        .filter(Boolean).length
    : 0;

  // Calculate duration between commence and complete
  let durationHoursText = "";
  if (watchedCommencingAt && watchedCompletedAt) {
    try {
      const start = new Date(watchedCommencingAt).getTime();
      const end = new Date(watchedCompletedAt).getTime();
      if (!isNaN(start) && !isNaN(end) && end > start) {
        const diffHrs = Math.round((end - start) / (1000 * 3600));
        durationHoursText = `${diffHrs} hours exposure`;
      }
    } catch {}
  }

  // Smoothly types preset strings into inputs character-by-character
  const applyPresetWithTypewriter = (
    field: keyof TreatmentCertificateInput,
    fullText: string
  ) => {
    onActiveFieldChange?.(field as string);
    let idx = 0;
    const intervalMs = Math.max(10, Math.min(20, Math.floor(300 / Math.max(1, fullText.length))));
    const timer = setInterval(() => {
      idx++;
      if (idx <= fullText.length) {
        setValue(field, fullText.slice(0, idx) as any, { shouldValidate: true });
        typewriterAudio.playKeyClick();
      } else {
        clearInterval(timer);
      }
    }, intervalMs);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={handleFormKeyDown}
      onPaste={handleFormPaste}
      onFocus={(e) => {
        const target = e.target as HTMLElement;
        const id = target.id || (target as HTMLInputElement).name;
        if (id) {
          onActiveFieldChange?.(id);
        }
      }}
      onBlur={() => {
        setTimeout(() => {
          if (
            !document.activeElement ||
            !(
              document.activeElement instanceof HTMLInputElement ||
              document.activeElement instanceof HTMLTextAreaElement
            )
          ) {
            onActiveFieldChange?.(null);
          }
        }, 120);
      }}
      onInput={(e) => {
        handleFormInput(e);
        typewriterAudio.playKeyClick();
        const target = e.target as HTMLElement;
        const id = target.id || (target as HTMLInputElement).name;
        if (id) {
          onActiveFieldChange?.(id);
        }
      }}
      className="space-y-6"
    >
      {/* Top Header Card: Summary & Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/certificates"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" /> All Certificates
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            {initialData?.id && (
              <a
                href={`/api/treatment-certificates/${initialData.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Download className="h-3.5 w-3.5" /> PDF
              </a>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              title="Save Certificate (Ctrl + S)"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Save Draft"}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-blue-700/60 rounded text-blue-100">
                Ctrl+S
              </kbd>
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {saveSuccess && (
          <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Certificate draft successfully saved to database!</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 1: INFORMASI SERTIFIKAT & REGISTRASI
         ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
            1
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Informasi Sertifikat & Registrasi
          </span>
        </div>

        {/* Row 1: Serial No & Date Issued */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5" htmlFor="serialNo">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Serial No.
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Nomor seri fisik sertifikat
              </span>
            </label>
            <input
              id="serialNo"
              type="text"
              placeholder="e.g. 2026000063"
              {...register("serialNo")}
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="dateIssued" className="block">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Date Issued
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                  Tanggal penerbitan dokumen
                </span>
              </label>
              <button
                type="button"
                onClick={() => {
                  onActiveFieldChange?.("dateIssued");
                  setValue("dateIssued", new Date(), { shouldValidate: true });
                  typewriterAudio.playKeyClick();
                }}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Set Today
              </button>
            </div>
            <input
              id="dateIssued"
              type="date"
              defaultValue={toInputDate(watch("dateIssued"))}
              onChange={(e) =>
                setValue("dateIssued", e.target.value ? new Date(e.target.value) : (undefined as any), {
                  shouldValidate: true,
                })
              }
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
            />
            {errors.dateIssued && (
              <p className="mt-1 text-xs text-rose-500">{errors.dateIssued.message}</p>
            )}
          </div>
        </div>

        {/* Row 2: Certificate Number & Provider ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5" htmlFor="certificateNumber">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Certificate Number
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Nomor sertifikat treatment AFAS
              </span>
            </label>
            <input
              id="certificateNumber"
              type="text"
              placeholder="e.g. 00001/ECERT/MB/JZ70SGVQ7C/ID0018MB/X/2026"
              {...register("certificateNumber")}
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-mono font-bold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
            />
            {errors.certificateNumber && (
              <p className="mt-1 text-xs text-rose-500">{errors.certificateNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-1.5">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Treatment Provider ID
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Company Constant (ID Barantin)
              </span>
            </label>
            <div className="flex items-center gap-2 h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800 px-3 text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="font-mono text-blue-700 dark:text-blue-400">{CERTIFICATE_CONSTANTS.registrationNumber}</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                (PT Prana Argentum)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: DOKUMEN KARANTINA & PENGIRIMAN
         ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
              2
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Dokumen Karantina & Pengiriman
            </span>
          </div>
        </div>

        {/* Quarantine Reference Sub-Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
          <div>
            <label htmlFor="consignmentLinkPpk" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              No. PTK Karantina (PPK)
            </label>
            <input
              id="consignmentLinkPpk"
              type="text"
              placeholder="e.g. 301045S3B251982026101901929"
              {...register("consignmentLinkPpk")}
              className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-mono font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <p className="mt-1 text-[10px] text-slate-500">Official Barantin PPK Quarantine reference code</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="consignmentLinkDo" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. DO (Delivery Order)
              </label>
              <input
                id="consignmentLinkDo"
                type="text"
                placeholder="e.g. 668235"
                {...register("consignmentLinkDo")}
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="consignmentLinkBl" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. BL (Bill of Lading)
              </label>
              <input
                id="consignmentLinkBl"
                type="text"
                placeholder="e.g. OOLU2340317000"
                {...register("consignmentLinkBl")}
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Containers Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="containers" className="block">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Containers (Container Numbers)
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Nomor peti kemas (pisahkan dengan koma atau baris baru)
              </span>
            </label>
            {containerCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {containerCount} Container{containerCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <input
            id="containers"
            type="text"
            placeholder="e.g. OOLU0270430, CSNU1121060, CSNU1710250"
            {...register("containers")}
            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
          />
          {errors.containers && (
            <p className="mt-1 text-xs text-rose-500">{errors.containers.message}</p>
          )}
        </div>

        {/* Consignee */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="consignee" className="block">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Consignee
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Penerima barang (nama perusahaan &amp; rincian alamat)
              </span>
            </label>
            <span className="text-[10px] text-slate-400">Shift + Enter untuk alinea baru</span>
          </div>
          <textarea
            id="consignee"
            rows={3}
            placeholder="Type or paste consignee details (e.g. BUNNINGS GROUP LIMITED BOTANICCA 3 - LEVEL 2 EAST TOWER 570 SWAN STREET, BURNLEY VIC 3121 AUSTRALIA)"
            {...register("consignee")}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 p-3 text-xs text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm leading-relaxed"
          />
          {errors.consignee && (
            <p className="mt-1 text-xs text-rose-500">{errors.consignee.message}</p>
          )}
        </div>

        {/* Notify Party (Separated for Ease of Entry) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="notifyParty" className="block">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Notify Party
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Pihak yang diberitahu (opsional, jika ada)
              </span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setValue("notifyParty" as any, "SAME AS CONSIGNEE", { shouldValidate: true })}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 transition-colors cursor-pointer"
                title="Isi otomatis dengan SAME AS CONSIGNEE"
              >
                + Same as Consignee
              </button>
              <span className="text-[10px] text-slate-400">Shift + Enter untuk alinea baru</span>
            </div>
          </div>
          <textarea
            id="notifyParty"
            rows={2}
            placeholder="e.g. SAME AS CONSIGNEE atau nama pihak ketiga & rincian alamat..."
            {...register("notifyParty" as any)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 p-3 text-xs text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm leading-relaxed"
          />
        </div>

        {/* Carrier Vessel & Seal Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="carrierVessel" className="block mb-1.5">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Carrier / Vessel
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Nama kapal pengangkut
              </span>
            </label>
            <input
              id="carrierVessel"
              type="text"
              placeholder="e.g. YM EFFICIENCY 208N"
              {...register("carrierVessel")}
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
            />
            {errors.carrierVessel && (
              <p className="mt-1 text-xs text-rose-500">{errors.carrierVessel.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="sealNumbers" className="block mb-1.5">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Seal Number(s)
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Nomor segel peti kemas
              </span>
            </label>
            <input
              id="sealNumbers"
              type="text"
              placeholder="e.g. OOLKTE9652, OOLKTE9650, OOLKTE9651"
              {...register("sealNumbers")}
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
            />
          </div>
        </div>

        {/* Client Name and Address */}
        <div>
          <label htmlFor="clientNameAddress" className="block mb-1.5">
            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Client Name and Address
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
              Nama dan alamat klien pemesan fumigasi
            </span>
          </label>
          <textarea
            id="clientNameAddress"
            rows={2}
            placeholder="e.g. SONIA LINTAS BENUA, SURABAYA"
            {...register("clientNameAddress")}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 p-3 text-xs text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
          />
          {errors.clientNameAddress && (
            <p className="mt-1 text-xs text-rose-500">{errors.clientNameAddress.message}</p>
          )}
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: KOMODITAS & PERJALANAN KAPAL
         ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
              3
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Komoditas & Rute Pengiriman
            </span>
          </div>
        </div>

        {/* Commodity Description */}
        <div>
          <label htmlFor="commodityDescription" className="block mb-1.5">
            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Commodity Description and Quantity
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
              Deskripsi lengkap komoditas, jumlah pallet/karton, dan volume (m³)
            </span>
          </label>
          <textarea
            id="commodityDescription"
            rows={3}
            placeholder="e.g. 3X20' 37 PALLETS = 1,985 PCS = 57.8406 M3 OF MERBAU E2E (INTSIA BIJUGA)"
            {...register("commodityDescription")}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 p-3 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm uppercase leading-relaxed"
          />
          {errors.commodityDescription && (
            <p className="mt-1 text-xs text-rose-500">{errors.commodityDescription.message}</p>
          )}
        </div>

        {/* Shipping Route Sub-Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Shipping Route (Origin & Destination)
          </h4>

          {/* Countries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CountryCombobox
              id="originCountry"
              label="Origin Country"
              value={watch("originCountry") || ""}
              isOrigin={true}
              onChange={(val) => {
                setValue("originCountry", val, { shouldValidate: true, shouldDirty: true });
              }}
              onFocus={() => onActiveFieldChange?.("originCountry")}
              onBlur={() => onActiveFieldChange?.(null)}
              placeholder="e.g. INDONESIA"
              error={errors.originCountry?.message}
            />

            <CountryCombobox
              id="destinationCountry"
              label="Destination Country"
              value={watch("destinationCountry") || ""}
              isOrigin={false}
              onChange={(val) => {
                setValue("destinationCountry", val, { shouldValidate: true, shouldDirty: true });
              }}
              onFocus={() => onActiveFieldChange?.("destinationCountry")}
              onBlur={() => onActiveFieldChange?.(null)}
              placeholder="e.g. CHINA"
              error={errors.destinationCountry?.message}
            />
          </div>

          {/* Ports */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label htmlFor="portOfLoading" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Port of Loading
              </label>
              <input
                id="portOfLoading"
                type="text"
                placeholder="e.g. SURABAYA, INDONESIA"
                {...register("portOfLoading")}
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              {errors.portOfLoading && (
                <p className="mt-1 text-xs text-rose-500">{errors.portOfLoading.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="portOfUnloading" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Port of Unloading
              </label>
              <input
                id="portOfUnloading"
                type="text"
                placeholder="e.g. SHATIAN, CHINA"
                {...register("portOfUnloading")}
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              {errors.portOfUnloading && (
                <p className="mt-1 text-xs text-rose-500">{errors.portOfUnloading.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Target & Enclosure */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="targetOfFumigation" className="block">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Target of Fumigation
                </span>
              </label>
              <button
                type="button"
                onClick={() => applyPresetWithTypewriter("targetOfFumigation", "Commodity and Container")}
                className="text-[10px] text-blue-600 hover:underline cursor-pointer"
              >
                Preset
              </button>
            </div>
            <input
              id="targetOfFumigation"
              type="text"
              placeholder="e.g. Commodity and Container"
              {...register("targetOfFumigation")}
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-medium text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
            />
            {errors.targetOfFumigation && (
              <p className="mt-1 text-xs text-rose-500">{errors.targetOfFumigation.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="enclosureType" className="block">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Enclosure Type
                </span>
              </label>
              <button
                type="button"
                onClick={() => applyPresetWithTypewriter("enclosureType", "Sheeted Container")}
                className="text-[10px] text-blue-600 hover:underline cursor-pointer"
              >
                Preset
              </button>
            </div>
            <input
              id="enclosureType"
              type="text"
              placeholder="e.g. Sheeted Container"
              {...register("enclosureType")}
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-medium text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
            />
            {errors.enclosureType && (
              <p className="mt-1 text-xs text-rose-500">{errors.enclosureType.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: DOSIS & JADWAL FUMIGASI
         ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
              4
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Dosis & Jadwal Perlakuan Fumigasi
            </span>
          </div>
        </div>

        {/* Dosage Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Prescribed Schedule Card */}
          <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 dark:border-sky-900/60 dark:bg-sky-950/20 space-y-3">
            <div className="flex items-center justify-between border-b border-sky-200/60 dark:border-sky-900/40 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-900 dark:text-sky-300">
                Prescribed Schedule (Target)
              </span>
              <span className="text-[10px] text-sky-700 bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded font-semibold">
                Target Standar
              </span>
            </div>

            <div>
              <label htmlFor="prescribedDoseRate" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dose Rate
              </label>
              <div className="relative">
                <input
                  id="prescribedDoseRate"
                  type="text"
                  placeholder="48.00"
                  {...register("prescribedDoseRate")}
                  className="w-full h-10 rounded-xl border border-slate-300 bg-white pr-14 pl-3 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-semibold text-slate-400">
                  g/m³
                </span>
              </div>
              {errors.prescribedDoseRate && (
                <p className="mt-1 text-xs text-rose-500">{errors.prescribedDoseRate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="prescribedExposurePeriod" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Exposure Period
              </label>
              <div className="relative">
                <input
                  id="prescribedExposurePeriod"
                  type="text"
                  placeholder="24"
                  {...register("prescribedExposurePeriod")}
                  className="w-full h-10 rounded-xl border border-slate-300 bg-white pr-16 pl-3 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-semibold text-slate-400">
                  (hours)
                </span>
              </div>
              {errors.prescribedExposurePeriod && (
                <p className="mt-1 text-xs text-rose-500">{errors.prescribedExposurePeriod.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="prescribedTemperature" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Temperature
              </label>
              <div className="relative">
                <input
                  id="prescribedTemperature"
                  type="text"
                  placeholder="21"
                  {...register("prescribedTemperature")}
                  className="w-full h-10 rounded-xl border border-slate-300 bg-white pr-12 pl-3 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-semibold text-slate-400">
                  °C
                </span>
              </div>
              {errors.prescribedTemperature && (
                <p className="mt-1 text-xs text-rose-500">{errors.prescribedTemperature.message}</p>
              )}
            </div>
          </div>

          {/* Treatment Applied Card */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-900/40 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                Treatment Applied (Actual)
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-semibold">
                Aktual Lapangan
              </span>
            </div>

            <div>
              <label htmlFor="appliedDose" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Applied Dose
              </label>
              <div className="relative">
                <input
                  id="appliedDose"
                  type="text"
                  placeholder="48.00"
                  {...register("appliedDose")}
                  className="w-full h-10 rounded-xl border border-slate-300 bg-white pr-14 pl-3 text-xs font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-semibold text-slate-400">
                  g/m³
                </span>
              </div>
              {errors.appliedDose && (
                <p className="mt-1 text-xs text-rose-500">{errors.appliedDose.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="appliedExposurePeriod" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Exposure Period
              </label>
              <div className="relative">
                <input
                  id="appliedExposurePeriod"
                  type="text"
                  placeholder="24"
                  {...register("appliedExposurePeriod")}
                  className="w-full h-10 rounded-xl border border-slate-300 bg-white pr-16 pl-3 text-xs font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-semibold text-slate-400">
                  (hours)
                </span>
              </div>
              {errors.appliedExposurePeriod && (
                <p className="mt-1 text-xs text-rose-500">{errors.appliedExposurePeriod.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="appliedTemperature" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Temperature
              </label>
              <div className="relative">
                <input
                  id="appliedTemperature"
                  type="text"
                  placeholder="23"
                  {...register("appliedTemperature")}
                  className="w-full h-10 rounded-xl border border-slate-300 bg-white pr-12 pl-3 text-xs font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-semibold text-slate-400">
                  °C
                </span>
              </div>
              {errors.appliedTemperature && (
                <p className="mt-1 text-xs text-rose-500">{errors.appliedTemperature.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Place of Fumigation (Dropdown & Full Address) */}
        <FumigationFacilitySelect
          id="placeOfFumigation"
          label="Place of Fumigation (Full Address)"
          subLabel="Pilih fasilitas resmi atau ketik alamat fasilitas perlakuan"
          value={watchedPlaceOfFumigation}
          onChange={(newVal) => setValue("placeOfFumigation", newVal, { shouldValidate: true })}
          error={errors.placeOfFumigation?.message}
        />

        {/* Timeline */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Waktu Pelaksanaan (Timeline)
            </h4>
            {durationHoursText && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Clock className="h-3 w-3" /> {durationHoursText}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="commencingAt" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Commenced (dd/mm/yyyy - HH:MM)
              </label>
              <input
                id="commencingAt"
                type="datetime-local"
                defaultValue={toInputDateTime(watch("commencingAt"))}
                onChange={(e) =>
                  setValue("commencingAt", e.target.value ? new Date(e.target.value) : (undefined as any), {
                    shouldValidate: true,
                  })
                }
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              {errors.commencingAt && (
                <p className="mt-1 text-xs text-rose-500">{errors.commencingAt.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="completedAt" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Completed (dd/mm/yyyy - HH:MM)
              </label>
              <input
                id="completedAt"
                type="datetime-local"
                defaultValue={toInputDateTime(watch("completedAt"))}
                onChange={(e) =>
                  setValue("completedAt", e.target.value ? new Date(e.target.value) : (undefined as any), {
                    shouldValidate: true,
                  })
                }
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              {errors.completedAt && (
                <p className="mt-1 text-xs text-rose-500">{errors.completedAt.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: PENGESAHAN & GAS CLEARANCE GABUNGAN
         ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
              5
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Pengesahan & Gas Clearance Gabungan
            </span>
          </div>
        </div>

        {/* Final TLV Reading */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="finalTlvReading" className="block">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Final TLV Reading (ppm)
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Hasil pembacaan ambang batas akhir
              </span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyPresetWithTypewriter("finalTlvReading", "ALL CONTAINERS < 5 PPM")}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                &lt; 5 PPM
              </button>
              <button
                type="button"
                onClick={() => applyPresetWithTypewriter("finalTlvReading", "ALL CONTAINERS < 2 PPM")}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                &lt; 2 PPM
              </button>
            </div>
          </div>
          <input
            id="finalTlvReading"
            type="text"
            placeholder="e.g. ALL CONTAINERS < 5 PPM"
            {...register("finalTlvReading")}
            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
          />
          {errors.finalTlvReading && (
            <p className="mt-1 text-xs text-rose-500">{errors.finalTlvReading.message}</p>
          )}
        </div>

        {/* Fumigator Name & Accreditation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fumigatorName" className="block mb-1.5">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Fumigator Full Name
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Nama lengkap petugas penanggung jawab
              </span>
            </label>
            <input
              id="fumigatorName"
              type="text"
              placeholder="e.g. RONI FIRMANSYAH RAMADHAN"
              {...register("fumigatorName")}
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
            />
            {errors.fumigatorName && (
              <p className="mt-1 text-xs text-rose-500">{errors.fumigatorName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="fumigatorAccreditationNumber" className="block mb-1.5">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Accreditation Number
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Nomor akreditasi AFAS fumigator
              </span>
            </label>
            <input
              id="fumigatorAccreditationNumber"
              type="text"
              placeholder="e.g. - or AFAS-ID-0018-01"
              {...register("fumigatorAccreditationNumber")}
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
            />
          </div>
        </div>

        {/* Verification URL */}
        <div>
          <label htmlFor="verificationUrl" className="block mb-1.5">
            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Fumi Trust Verification URL (Optional / Draft)
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
              Biarkan kosong untuk draft • QR code dibuat otomatis jika diisi
            </span>
          </label>
          <input
            id="verificationUrl"
            type="url"
            placeholder="Kosongkan jika masih draft (opsional)"
            {...register("verificationUrl")}
            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-mono text-blue-600 dark:text-blue-400 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
          />
        </div>

        {/* Signature Upload Zone */}
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Fumigator Signature (Optional Image)
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 shadow-sm text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 transition-colors">
              <UploadCloud className="h-4 w-4 text-blue-600" />
              <span>Upload Signature PNG/JPG</span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleSignatureUpload}
                className="hidden"
              />
            </label>

            {watch("fumigatorSignatureUrl") && (
              <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <img
                  src={watch("fumigatorSignatureUrl") || ""}
                  alt="Signature Preview"
                  className="h-10 object-contain rounded"
                />
                <button
                  type="button"
                  onClick={() => setValue("fumigatorSignatureUrl", "", { shouldValidate: true })}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline px-2 py-1 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Declarations */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="additionalDeclarations" className="block">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Additional Declarations
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Pernyataan tambahan perlakuan
              </span>
            </label>
            <button
              type="button"
              onClick={() =>
                applyPresetWithTypewriter(
                  "additionalDeclarations",
                  "The Fumigation Certificate Is Only Valid For 21 Days From The Date Of Treatment Prior To Export."
                )
              }
              className="text-[11px] text-blue-600 hover:underline cursor-pointer"
            >
              Insert Standard 21-Day Validity Notice
            </button>
          </div>
          <textarea
            id="additionalDeclarations"
            rows={2}
            placeholder="e.g. The Fumigation Certificate Is Only Valid For 21 Days From The Date Of Treatment Prior To Export."
            {...register("additionalDeclarations")}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 p-3 text-xs text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
          />
        </div>

        {/* Gas Clearance Certificate (Halaman 2) Bundling Card */}
        <div
          className={`rounded-2xl border transition-all duration-200 p-5 ${
            watchIncludeGc
              ? "bg-gradient-to-br from-sky-50/80 via-blue-50/40 to-white border-blue-200 dark:from-sky-950/40 dark:via-blue-950/20 dark:to-slate-900 dark:border-blue-800 shadow-sm"
              : "bg-slate-50/70 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800"
          }`}
        >
          {/* Header with Toggle Switch */}
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                  watchIncludeGc
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                <FileCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="includeGasClearance"
                    className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer select-none"
                  >
                    Sertakan Gas Clearance Certificate (Halaman 2)
                  </label>
                  {watchIncludeGc ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      2 Halaman (FC + GC)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      Hanya FC (1 Halaman)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {watchIncludeGc
                    ? "Data kontainer, komoditas, kapal, tempat, dan fumigator disinkronkan otomatis dari FC ke Sertifikat Bebas Gas."
                    : "Gas Clearance dinonaktifkan. Dokumen cetak PDF dan DOCX hanya berisi 1 halaman (Treatment Certificate saja)."}
                </p>
              </div>
            </div>

            {/* Modern Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
              <input
                id="includeGasClearance"
                type="checkbox"
                {...register("includeGasClearance")}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
            </label>
          </div>

          {/* Expandable GC Config Options when Included */}
          {watchIncludeGc && (
            <div className="mt-5 pt-4 border-t border-blue-100 dark:border-blue-900/60 space-y-4 animate-in fade-in-50 duration-200">
              {/* 2-Column Symmetrical Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-end justify-between gap-2 min-h-[38px] mb-1.5">
                    <label
                      htmlFor="gcCertificateNumber"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug pb-0.5"
                    >
                      Nomor GC / GC Number
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const tcNum = watch("certificateNumber");
                        if (tcNum) {
                          const gcAuto = tcNum.replace(/TC/i, "GC");
                          setValue("gcCertificateNumber", gcAuto, { shouldValidate: true });
                          onActiveFieldChange?.("gcCertificateNumber");
                          typewriterAudio.playKeyClick();
                        }
                      }}
                      className="text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer shrink-0 pb-0.5 leading-snug"
                      title="Salin dari Certificate Number (ubah TC -> GC)"
                    >
                      Salin dari FC (TC→GC)
                    </button>
                  </div>
                  <input
                    id="gcCertificateNumber"
                    type="text"
                    placeholder={
                      watch("certificateNumber")
                        ? (watch("certificateNumber") as string).replace(/TC/i, "GC")
                        : "e.g. 00001/ECERT/MB/JZ70SGVQ7C/ID0018MB/X/2026"
                    }
                    {...register("gcCertificateNumber")}
                    className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-mono font-bold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Jika dikosongkan, otomatis menggunakan Nomor FC dengan kode GC.
                  </p>
                </div>

                <div>
                  <div className="flex items-end min-h-[38px] mb-1.5">
                    <label
                      htmlFor="gcRegistrationNumber"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug pb-0.5"
                    >
                      Nomor Registrasi / Registration Number
                    </label>
                  </div>
                  <input
                    id="gcRegistrationNumber"
                    type="text"
                    defaultValue="ID0018MB"
                    {...register("gcRegistrationNumber")}
                    className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-mono font-bold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Nomor registrasi AFAS Barantin (default ID0018MB).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="gcSerialNo"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Serial No GC (Opsional)
                  </label>
                  <input
                    id="gcSerialNo"
                    type="text"
                    placeholder={watch("serialNo") || "e.g. 0000000"}
                    {...register("gcSerialNo")}
                    className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Dikosongkan akan mengikuti Serial No Halaman 1.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="gcFumigant"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Fumigan yang Digunakan
                  </label>
                  <input
                    id="gcFumigant"
                    type="text"
                    defaultValue="Methyl Bromide (CH3Br)"
                    {...register("gcFumigant")}
                    className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Gas Level Reading */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="gcGasLevelReading"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Hasil Pengukuran Bebas Gas (Gas Level Reading)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">Preset:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const ct =
                          watch("containers")?.replace(/\r?\n/g, ", ").trim() ||
                          "Semua Kontainer";
                        setValue("gcGasLevelReading", `${ct}: 0 ppm`, {
                          shouldValidate: true,
                        });
                        onActiveFieldChange?.("gcGasLevelReading");
                        typewriterAudio.playKeyClick();
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold dark:bg-blue-900/60 dark:text-blue-300 cursor-pointer"
                    >
                      0 ppm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const ct =
                          watch("containers")?.replace(/\r?\n/g, ", ").trim() ||
                          "Semua Kontainer";
                        setValue("gcGasLevelReading", `${ct}: < 5 ppm`, {
                          shouldValidate: true,
                        });
                        onActiveFieldChange?.("gcGasLevelReading");
                        typewriterAudio.playKeyClick();
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold dark:bg-blue-900/60 dark:text-blue-300 cursor-pointer"
                    >
                      &lt; 5 ppm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValue("gcGasLevelReading", "0 ppm", {
                          shouldValidate: true,
                        });
                        onActiveFieldChange?.("gcGasLevelReading");
                        typewriterAudio.playKeyClick();
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold dark:bg-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Hanya &quot;0 ppm&quot;
                    </button>
                  </div>
                </div>
                <input
                  id="gcGasLevelReading"
                  type="text"
                  placeholder={
                    watch("containers")
                      ? `${(watch("containers") as string).replace(/\r?\n/g, ", ").trim()}: 0 ppm`
                      : "e.g. TLLU4186411: 0 ppm"
                  }
                  {...register("gcGasLevelReading")}
                  className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-blue-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Teks ini akan dicetak tebal warna biru di lembar Sertifikat Bebas Gas (Halaman 2).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Prominent Save Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Press <kbd className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">Ctrl + S</kbd> anytime to save.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 cursor-pointer active:scale-[0.98]"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? "Saving Draft..." : isEditing ? "Save Certificate Changes" : "Save Treatment Certificate Draft"}</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export const TreatmentForm = React.memo(TreatmentFormComponent);
export default TreatmentForm;
