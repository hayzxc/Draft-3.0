"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, differenceInMinutes } from "date-fns";
import {
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  QrCode,
  Upload,
  Clock,
  Trash2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { certificateSchema, CertificateInput } from "@/lib/certificate-schema";
import { handleFormKeyDown, handleFormPaste, handleFormInput } from "@/lib/form-helpers";
import { GasClearanceCertificateData } from "./CertificateDocument";
import { generateQrDataUrl } from "@/lib/qr";
import { FumigationFacilitySelect } from "@/components/treatment/FumigationFacilitySelect";

interface CertificateFormProps {
  initialData?: GasClearanceCertificateData;
  isEditing?: boolean;
  onDataChange: (data: GasClearanceCertificateData) => void;
  onActiveFieldChange?: (field: string | null) => void;
}

const CertificateFormComponent: React.FC<CertificateFormProps> = ({
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

  const defaultValues: Partial<CertificateInput> = {
    serialNo: initialData?.serialNo ?? "",
    certificateNumber: initialData?.certificateNumber ?? "",
    registrationNumber: initialData?.registrationNumber ?? "ID0018MB",
    certificateDate: initialData?.certificateDate
      ? new Date(initialData.certificateDate)
      : (undefined as any),
    commodity: initialData?.commodity ?? "",
    containerNumber: initialData?.containerNumber ?? "",
    carrierVessel: initialData?.carrierVessel ?? "",
    fumigationArea: initialData?.fumigationArea ?? "",
    fumigant: initialData?.fumigant ?? "Methyl Bromide (CH3Br)",
    commencingAt: initialData?.commencingAt
      ? new Date(initialData.commencingAt)
      : (undefined as any),
    completedAt: initialData?.completedAt
      ? new Date(initialData.completedAt)
      : (undefined as any),
    gasLevelPpm:
      initialData?.gasLevelPpm !== undefined && initialData?.gasLevelPpm !== null
        ? Number(initialData.gasLevelPpm)
        : (undefined as any),
    gasLevelReading: initialData?.gasLevelReading ?? "",
    fumigatorName: initialData?.fumigatorName ?? "",
    fumigatorSignatureUrl: initialData?.fumigatorSignatureUrl ?? "",
    verificationUrl: initialData?.verificationUrl ?? "",
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CertificateInput>({
    resolver: zodResolver(certificateSchema),
    defaultValues: defaultValues as any,
  });

  const currentVerificationUrl = watch("verificationUrl");
  const watchedCommencingAt = watch("commencingAt");
  const watchedCompletedAt = watch("completedAt");
  const watchedSignatureUrl = watch("fumigatorSignatureUrl");
  const watchedFumigationArea = watch("fumigationArea") || "";

  const qrCodeDataUrlRef = useRef<string>(qrCodeDataUrl);
  qrCodeDataUrlRef.current = qrCodeDataUrl;

  // Keep QR code updated when verificationUrl changes
  useEffect(() => {
    if (currentVerificationUrl?.trim()) {
      generateQrDataUrl(currentVerificationUrl.trim()).then((qr) => {
        setQrCodeDataUrl(qr);
      });
    } else {
      setQrCodeDataUrl("");
    }
  }, [currentVerificationUrl]);

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
  }, [handleSubmit]);

  // Watch fields to trigger live preview update
  useEffect(() => {
    const subscription = watch((value) => {
      onDataChange({
        id: initialData?.id,
        serialNo: value.serialNo || "",
        certificateNumber: value.certificateNumber || "",
        registrationNumber: value.registrationNumber || "ID0018MB",
        certificateDate: value.certificateDate ? new Date(value.certificateDate) : (undefined as any),
        commodity: value.commodity || "",
        containerNumber: value.containerNumber || "",
        carrierVessel: value.carrierVessel || "",
        fumigationArea: value.fumigationArea || "",
        fumigant: value.fumigant || "Methyl Bromide (CH3Br)",
        commencingAt: value.commencingAt ? new Date(value.commencingAt) : (undefined as any),
        completedAt: value.completedAt ? new Date(value.completedAt) : (undefined as any),
        gasLevelPpm:
          value.gasLevelPpm !== undefined && value.gasLevelPpm !== null && (value.gasLevelPpm as any) !== ""
            ? Number(value.gasLevelPpm)
            : null,
        gasLevelReading: value.gasLevelReading || "",
        fumigatorName: value.fumigatorName || "",
        fumigatorSignatureUrl: value.fumigatorSignatureUrl || null,
        stampImageUrl: null,
        logoImageUrl: initialData?.logoImageUrl,
        verificationUrl: value.verificationUrl || "",
        qrCodeDataUrl: qrCodeDataUrlRef.current,
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

  const handleRemoveSignature = () => {
    setValue("fumigatorSignatureUrl", null, { shouldValidate: true });
  };

  // Calculate duration between commencing and completed
  const calculateDuration = () => {
    if (!watchedCommencingAt || !watchedCompletedAt) return null;
    try {
      const start = new Date(watchedCommencingAt);
      const end = new Date(watchedCompletedAt);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return null;
      const totalMinutes = differenceInMinutes(end, start);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours} Jam ${minutes > 0 ? `${minutes} Menit` : ""}`;
    } catch {
      return null;
    }
  };

  const durationStr = calculateDuration();

  const onSubmit = async (data: CertificateInput) => {
    setIsSubmitting(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const url =
        isEditing && initialData?.id
          ? `/api/certificates/${initialData.id}`
          : "/api/certificates";
      const method = isEditing ? "PATCH" : "POST";

      const payload = {
        ...data,
        qrCodeDataUrl,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan draft sertifikat.");
      }

      const result = await res.json();
      setSaveSuccess(true);
      if (!isEditing && result.id) {
        router.push(`/certificates/${result.id}`);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat menyimpan draft.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toInputDate = (d: any) => {
    if (!d) return "";
    try {
      const date = new Date(d);
      return format(date, "yyyy-MM-dd");
    } catch {
      return "";
    }
  };

  const toInputDateTime = (d: any) => {
    if (!d) return "";
    try {
      const date = new Date(d);
      return format(date, "yyyy-MM-dd'T'HH:mm");
    } catch {
      return "";
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={handleFormKeyDown}
      onPaste={handleFormPaste}
      onInput={handleFormInput}
      onFocus={(e) => {
        const target = e.target as HTMLElement;
        const id = target.id || (target as HTMLInputElement).name;
        if (id) {
          onActiveFieldChange?.(id);
        }
      }}
      onBlur={() => {
        onActiveFieldChange?.(null);
      }}
      className="space-y-5"
    >
      {/* Top Header Card: Summary & Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/certificates"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Daftar Sertifikat</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all hover:shadow disabled:opacity-50 cursor-pointer active:scale-[0.98]"
              title="Simpan dokumen (Ctrl + S)"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Simpan Draft"}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-blue-700/60 rounded text-blue-100">
                Ctrl+S
              </kbd>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {saveSuccess && (
          <div className="mt-3 flex items-center gap-2.5 p-3 text-xs rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Draft Gas Clearance Certificate berhasil disimpan!</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-3 flex items-center gap-2.5 p-3 text-xs rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-sm animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
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

        {/* Row 1: 2 Equal Columns for Serial No & Registration No */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5" htmlFor="serialNo">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Serial No.
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Nomor seri fisik
              </span>
            </label>
            <input
              type="text"
              id="serialNo"
              {...register("serialNo")}
              placeholder="Contoh: 202600079"
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
            />
          </div>

          <div>
            <label className="block mb-1.5" htmlFor="registrationNumber">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Nomor Registrasi
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Registration number
              </span>
            </label>
            <input
              type="text"
              id="registrationNumber"
              {...register("registrationNumber")}
              placeholder="ID0018MB"
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
            />
          </div>
        </div>

        {/* Row 2: Nomor GC Full Width so long 41-char numbers are never cut off */}
        <div>
          <label className="block mb-1.5" htmlFor="certificateNumber">
            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Nomor GC (GC Number)
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
              Format resmi penomoran sertifikat Barantin
            </span>
          </label>
          <input
            type="text"
            id="certificateNumber"
            {...register("certificateNumber")}
            placeholder="Contoh: 00008/GC/MB/JZ70SGVQ7C/ID0018MB/X/2026"
            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-mono font-bold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
          />
        </div>

        {/* Row 3: Tanggal Sertifikat Full Width */}
        <div>
          <label className="block mb-1.5" htmlFor="certificateDate">
            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Tanggal Sertifikat (Date)
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
              Tanggal penerbitan dokumen (dd/mm/yyyy)
            </span>
          </label>
          <input
            type="date"
            id="certificateDate"
            defaultValue={toInputDate(defaultValues.certificateDate)}
            onChange={(e) => {
              setValue("certificateDate", e.target.value ? new Date(e.target.value) : (undefined as any), {
                shouldValidate: true,
              });
            }}
            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
          />
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: DETAIL KOMODITAS & PETI KEMAS
         ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
              2
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Detail Komoditas & Peti Kemas
            </span>
          </div>
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
            Enter untuk baris baru (alinea baru)
          </span>
        </div>

        <div className="space-y-4">
          {/* Commodity Textarea */}
          <div>
            <div className="mb-1.5">
              <label htmlFor="commodity" className="block">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Nama Komoditas / Media Pembawa
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                  Commodity / article
                </span>
              </label>
            </div>
            <textarea
              rows={3}
              id="commodity"
              {...register("commodity")}
              placeholder="Contoh: 1 X 20' SAID TO CONTAIN 10 PALLETS..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 p-3 text-xs uppercase leading-relaxed font-semibold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm resize-none"
            />
            {errors.commodity && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.commodity.message}</p>
            )}
          </div>

          {/* Symmetrical 2 Columns: Container & Vessel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5" htmlFor="containerNumber">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Nomor Peti Kemas
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                  Container number
                </span>
              </label>
              <input
                type="text"
                id="containerNumber"
                {...register("containerNumber")}
                placeholder="Contoh: CSNU2373750"
                className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-bold uppercase text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
              />
              {errors.containerNumber && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.containerNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-1.5" htmlFor="carrierVessel">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Alat Angkut
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                  Carrier / vessel
                </span>
              </label>
              <input
                type="text"
                id="carrierVessel"
                {...register("carrierVessel")}
                placeholder="Contoh: YM EFFICIENCY 208N"
                className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs uppercase font-semibold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
              />
              {errors.carrierVessel && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.carrierVessel.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: AREA / LOKASI & FUMIGAN
         ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
            3
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Area / Lokasi & Bahan Fumigan
          </span>
        </div>

        <div className="space-y-4">
          <FumigationFacilitySelect
            id="fumigationArea"
            label="Area / Lokasi Fumigasi"
            subLabel="Pilih fasilitas resmi atau ketik lokasi area perlakuan"
            value={watchedFumigationArea}
            onChange={(newVal) => setValue("fumigationArea", newVal, { shouldValidate: true })}
            error={errors.fumigationArea?.message}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block" htmlFor="fumigant">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Fumigan yang Digunakan
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                  Fumigant
                </span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setValue("fumigant", "Methyl Bromide (CH3Br)", { shouldValidate: true })}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                >
                  Methyl Bromide
                </button>
                <button
                  type="button"
                  onClick={() => setValue("fumigant", "Phosphine (PH3)", { shouldValidate: true })}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                >
                  Phosphine
                </button>
              </div>
            </div>
            <input
              type="text"
              id="fumigant"
              {...register("fumigant")}
              placeholder="Methyl Bromide (CH3Br)"
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: JADWAL PELAKSANAAN FUMIGASI (Symmetrical 2 Columns)
         ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
              4
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Jadwal Pelaksanaan Fumigasi
            </span>
          </div>
          {durationStr && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Clock className="h-3 w-3" />
              <span>Durasi: {durationStr}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5" htmlFor="commencingAt">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Waktu Dimulai
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Commencing at
              </span>
            </label>
            <input
              type="datetime-local"
              id="commencingAt"
              defaultValue={toInputDateTime(defaultValues.commencingAt)}
              onChange={(e) => {
                setValue("commencingAt", e.target.value ? new Date(e.target.value) : (undefined as any), {
                  shouldValidate: true,
                });
              }}
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
            />
          </div>

          <div>
            <label className="block mb-1.5" htmlFor="completedAt">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Waktu Selesai
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Completed at
              </span>
            </label>
            <input
              type="datetime-local"
              id="completedAt"
              defaultValue={toInputDateTime(defaultValues.completedAt)}
              onChange={(e) => {
                setValue("completedAt", e.target.value ? new Date(e.target.value) : (undefined as any), {
                  shouldValidate: true,
                });
              }}
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: HASIL KONSENTRASI BEBAS GAS (Clean, Elegant, Symmetrical)
         ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 shadow-sm space-y-4">
        {/* Clean Header without Wrapping */}
        <div className="flex items-center gap-2 pb-2.5 border-b border-blue-100 dark:border-blue-900/40">
          <div className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
            5
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-950 dark:text-blue-200">
            Hasil Konsentrasi Bebas Gas
          </span>
        </div>

        {/* Clean Single Field with Instant Format Buttons */}
        <div>
          <label className="block mb-1.5" htmlFor="gasLevelReading">
            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Teks Hasil Pemeriksaan (Gas levels after fumigation)
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
              Kalimat hasil bebas gas pada sertifikat (kosongkan jika belum dilakukan penganginan)
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="gasLevelReading"
              {...register("gasLevelReading")}
              placeholder="Kosong jika belum diisi (contoh: 0 ppm atau CSNU1234567: 0 ppm)"
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm"
            />
          </div>

          {/* Quick Format Options / Presets */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[10px] text-slate-500 font-medium mr-1">Opsi Format:</span>
            <button
              type="button"
              onClick={() => setValue("gasLevelReading", "", { shouldValidate: true })}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors"
            >
              ✕ Kosongkan
            </button>
            <button
              type="button"
              onClick={() => {
                const cont = getValues("containerNumber")?.trim();
                setValue("gasLevelReading", cont ? `${cont}: 0 ppm` : "0 ppm", { shouldValidate: true });
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-blue-100/80 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 hover:bg-blue-200 transition-colors"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              <span>[Nomor Kontainer]: 0 ppm</span>
            </button>
            <button
              type="button"
              onClick={() => setValue("gasLevelReading", "0 ppm", { shouldValidate: true })}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hanya 0 ppm
            </button>
            <button
              type="button"
              onClick={() => {
                const cont = getValues("containerNumber")?.trim();
                setValue("gasLevelReading", cont ? `${cont}: BEBAS GAS (0 PPM)` : "BEBAS GAS (0 PPM)", { shouldValidate: true });
              }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
            >
              Bebas Gas (0 PPM)
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 6: PENANGGUNG JAWAB (FUMIGATOR) & TANDA TANGAN (Symmetrical 2 Columns)
         ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
            6
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Penanggung Jawab (Fumigator) & Tanda Tangan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          {/* Col 1: Nama Fumigator */}
          <div>
            <label className="block mb-1.5" htmlFor="fumigatorName">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Nama Fumigator
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                Signature and name of fumigator
              </span>
            </label>
            <input
              type="text"
              id="fumigatorName"
              {...register("fumigatorName")}
              placeholder="Contoh: RONI FIRMANSYAH RAMADHAN"
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-bold uppercase text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
            />
            {errors.fumigatorName && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.fumigatorName.message}</p>
            )}
          </div>

          {/* Col 2: Upload Tanda Tangan */}
          <div>
            <label className="block mb-1.5">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Tanda Tangan Digital
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
                PNG Transparan untuk stempel
              </span>
            </label>
            <div className="h-10 flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors shadow-sm shrink-0">
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                <span>{watchedSignatureUrl ? "Ganti File" : "Upload File"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
              </label>

              {watchedSignatureUrl && (
                <div className="flex items-center gap-2 h-10 px-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 flex-1 min-w-0">
                  <img
                    src={watchedSignatureUrl}
                    alt="Signature Thumbnail"
                    className="h-7 max-w-[60px] object-contain shrink-0"
                  />
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                    Dimuat
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveSignature}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors ml-auto"
                    title="Hapus tanda tangan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 7: VERIFIKASI DIGITAL BARANTIN & QR CODE
         ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
            7
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Link Verifikasi Barantin & QR Code
          </span>
        </div>

        <div>
          <label className="block mb-1.5" htmlFor="verificationUrl">
            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Tautan Verifikasi Resmi (FUMI TRUST by BARANTIN)
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
              QR code sertifikat otomatis dibuat dari tautan ini
            </span>
          </label>
          <input
            type="text"
            id="verificationUrl"
            {...register("verificationUrl")}
            placeholder="Kosongkan jika masih draft (opsional)"
            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 px-3 text-xs font-mono text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm"
          />
        </div>
      </div>

      {/* Bottom Prominent Save Button */}
      <div className="pt-2 flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tekan <kbd className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">Ctrl + S</kbd> kapan saja untuk menyimpan draft.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 cursor-pointer active:scale-[0.98]"
        >
          <Save className="h-4 w-4" />
          <span>{isSubmitting ? "Menyimpan Draft..." : isEditing ? "Simpan Perubahan" : "Simpan Draft Gas Clearance"}</span>
        </button>
      </div>
    </form>
  );
};

export const CertificateForm = React.memo(CertificateFormComponent);
export default CertificateForm;
