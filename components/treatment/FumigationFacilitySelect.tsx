"use client";

import React, { useMemo } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { FUMIGATION_FACILITIES } from "@/lib/certificate-constants";
import { typewriterAudio } from "@/lib/typewriter-sound";

interface FumigationFacilitySelectProps {
  id?: string;
  label?: string;
  subLabel?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export const FumigationFacilitySelect: React.FC<FumigationFacilitySelectProps> = ({
  id = "placeOfFumigation",
  label = "Place of Fumigation (Full Address)",
  subLabel = "Pilih lokasi fasilitas perlakuan resmi atau input manual",
  value = "",
  onChange,
  error,
  className = "",
}) => {
  // Determine if current value matches one of the predefined facilities
  const selectedFacilityId = useMemo(() => {
    if (!value) return "";
    const trimmed = value.trim().toLowerCase();
    for (const fac of FUMIGATION_FACILITIES) {
      if (
        fac.fullAddress.toLowerCase() === trimmed ||
        trimmed.includes(fac.name.toLowerCase()) ||
        trimmed.includes(fac.id.toLowerCase())
      ) {
        return fac.id;
      }
    }
    return "custom";
  }, [value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    typewriterAudio.playKeyClick();

    if (!selectedId) {
      onChange("");
      return;
    }

    if (selectedId === "custom") {
      return;
    }

    const matched = FUMIGATION_FACILITIES.find((f) => f.id === selectedId);
    if (matched) {
      onChange(matched.fullAddress);
    }
  };

  const currentMatchedFacility = FUMIGATION_FACILITIES.find((f) => f.id === selectedFacilityId);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Quick Facility Status */}
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block">
          <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            {label}
          </span>
          <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">
            {subLabel}
          </span>
        </label>
        {currentMatchedFacility && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
            <Building2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span>Fasilitas Resmi</span>
          </span>
        )}
      </div>

      {/* Facility Dropdown Selector */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <select
          id={`${id}-select`}
          value={selectedFacilityId}
          onChange={handleSelectChange}
          className="w-full h-10 pl-9 pr-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white hover:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-sm cursor-pointer appearance-none"
        >
          <option value="">-- Pilih Tempat / Fasilitas Fumigasi --</option>
          {FUMIGATION_FACILITIES.map((facility, index) => (
            <option key={facility.id} value={facility.id}>
              {index + 1}. {facility.name} ({facility.address.split(",")[0]})
            </option>
          ))}
          <option value="custom">-- Tempat Lainnya / Input Manual (Kustom) --</option>
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {/* Full Address Input / Textarea */}
      <div>
        <textarea
          id={id}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Pilih dari dropdown di atas atau ketik alamat lengkap fasilitas perlakuan..."
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/90 p-3 text-xs text-slate-900 dark:text-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition-all shadow-inner-sm leading-relaxed"
        />
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      </div>
    </div>
  );
};

export default FumigationFacilitySelect;
