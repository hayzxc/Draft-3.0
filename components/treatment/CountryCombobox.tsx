"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, X, Globe, Search } from "lucide-react";
import { ALL_COUNTRIES, TOP_EXPORT_COUNTRIES } from "@/lib/countries";
import { typewriterAudio } from "@/lib/typewriter-sound";

interface CountryComboboxProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  isOrigin?: boolean;
}

export const CountryCombobox: React.FC<CountryComboboxProps> = ({
  id,
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = "Pilih atau ketik negara...",
  error,
  isOrigin = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync searchQuery with external value when dropdown opens or value changes
  useEffect(() => {
    setSearchQuery(value || "");
  }, [value]);

  // Filter countries based on searchQuery
  const filteredCountries = useMemo(() => {
    const q = (searchQuery || "").trim().toUpperCase();
    if (!q) {
      return ALL_COUNTRIES;
    }
    return ALL_COUNTRIES.filter((c) => c.includes(q));
  }, [searchQuery]);

  // Popular quick options
  const popularCountries = useMemo(() => {
    if (isOrigin) {
      return ["INDONESIA", "CHINA", "VIETNAM", "MALAYSIA", "SINGAPORE", "AUSTRALIA"];
    }
    return TOP_EXPORT_COUNTRIES.slice(0, 10);
  }, [isOrigin]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (country: string) => {
    onChange(country);
    setSearchQuery(country);
    setIsOpen(false);
    try {
      typewriterAudio?.playKeyClick();
    } catch {
      // ignore
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
    inputRef.current?.focus();
    try {
      typewriterAudio?.playKeyClick();
    } catch {
      // ignore
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setSearchQuery(val);
    onChange(val);
    if (!isOpen) setIsOpen(true);
    setHighlightedIndex(0);
    try {
      typewriterAudio?.playKeyClick();
    } catch {
      // ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => (prev + 1 < filteredCountries.length ? prev + 1 : prev));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      if (isOpen && filteredCountries[highlightedIndex]) {
        e.preventDefault();
        handleSelect(filteredCountries[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {isOrigin && (
          <button
            type="button"
            onClick={() => handleSelect("INDONESIA")}
            className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            Reset INDONESIA
          </button>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Globe className="h-4 w-4" />
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            onFocus?.();
            setIsOpen(true);
          }}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-16 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white font-semibold uppercase"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              title="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-transform duration-200"
            title="Pilih Negara"
          >
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 z-50 rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
          {/* Quick Popular Chips */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Search className="w-3 h-3" />
              {isOrigin ? "Sering Digunakan:" : "Tujuan Ekspor Utama:"}
            </div>
            <div className="flex flex-wrap gap-1">
              {popularCountries.map((c) => {
                const isSelected = value === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Countries */}
          <ul
            ref={listRef}
            className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 py-1"
          >
            {filteredCountries.length === 0 ? (
              <li className="px-3 py-3 text-xs text-center text-slate-500 dark:text-slate-400">
                Tidak ada negara yang cocok dengan &quot;{searchQuery}&quot;.
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={() => handleSelect(searchQuery)}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    Gunakan &quot;{searchQuery}&quot; sebagai teks manual
                  </button>
                </div>
              </li>
            ) : (
              filteredCountries.map((country, idx) => {
                const isSelected = value === country;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <li
                    key={country}
                    onClick={() => handleSelect(country)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-bold dark:bg-blue-900/30 dark:text-blue-300"
                        : isHighlighted
                        ? "bg-slate-100 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <span>{country}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
