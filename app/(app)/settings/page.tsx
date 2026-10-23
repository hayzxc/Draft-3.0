"use client";

import React, { useEffect, useState } from "react";
import { Save, CheckCircle2, AlertCircle, Building, Stamp } from "lucide-react";

export default function SettingsPage() {
  const [logoUrl, setLogoUrl] = useState("/images/letterhead.jpg");
  const [stampUrl, setStampUrl] = useState("/images/stamp.png");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/company-asset")
      .then((res) => res.json())
      .then((data) => {
        if (data.logoImageUrl) setLogoUrl(data.logoImageUrl);
        if (data.stampImageUrl) setStampUrl(data.stampImageUrl);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStampUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await fetch("/api/company-asset", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoImageUrl: logoUrl,
          stampImageUrl: stampUrl,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save company settings.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to update assets.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Company Settings & Assets
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure default company assets (Letterhead & Stamp) used across all generated certificates.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">Company settings and assets updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Official Letterhead Asset */}
        <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Official Letterhead Header (Logo)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rendered at the top of every Gas Clearance and Treatment Certificate (A4/A5).
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950">
            <span className="block text-xs font-semibold text-slate-500 mb-2">Current Header Preview:</span>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company Letterhead"
                className="max-h-24 w-full object-contain rounded-lg border border-slate-200 bg-white dark:border-slate-800"
              />
            ) : (
              <div className="flex h-20 items-center justify-center text-xs text-slate-400">
                No logo uploaded
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Upload New Letterhead Header (PNG/JPG)
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleLogoUpload}
              className="mt-1.5 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-slate-200 cursor-pointer"
            />
          </div>
        </div>

        {/* Official Stamp Asset */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Stamp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Official Company Stamp
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stamped alongside the fumigator signature in the signoff section of every certificate.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950">
            {stampUrl ? (
              <img
                src={stampUrl}
                alt="Company Stamp"
                className="h-24 w-24 object-contain rounded-full border border-slate-200 bg-white p-1 dark:border-slate-800"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center text-xs text-slate-400 border border-dashed rounded-full">
                No stamp
              </div>
            )}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Upload New Stamp Image (Transparent PNG Recommended)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleStampUpload}
                className="mt-1.5 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-slate-200 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
