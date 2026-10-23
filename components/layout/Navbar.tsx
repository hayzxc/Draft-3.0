"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PlusCircle,
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
  FileCheck2,
  Layers,
  Settings as SettingsIcon,
} from "lucide-react";

export const Navbar = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newDropdownOpen, setNewDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNewDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/certificates" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm ring-1 ring-slate-800 dark:bg-slate-800 dark:ring-slate-700 transition-transform group-hover:scale-[1.02]">
              <ShieldCheck className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                PRANA ARGENTUM
              </span>
              <span className="block text-[11px] font-semibold tracking-wide text-sky-600 dark:text-sky-400">
                Fumigation Certificate Generator
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex md:items-center md:gap-1">
            <Link
              href="/certificates"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === "/certificates"
                  ? "bg-slate-100 text-slate-900 font-semibold dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
              }`}
            >
              All Drafts
            </Link>

            {/* New Certificate Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setNewDropdownOpen(!newDropdownOpen)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  newDropdownOpen
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
                }`}
              >
                <PlusCircle className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span>New Certificate</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${newDropdownOpen ? "rotate-180" : "opacity-60"}`} />
              </button>

              {newDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-80 rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-dropdown dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setNewDropdownOpen(false)}
                >
                  <Link
                    href="/certificates/new"
                    className="flex items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80 group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900 mt-0.5">
                      <FileCheck2 className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors block">
                        Gas Clearance Certificate
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                        A4 Bilingual Indonesian/English (Barantin Format)
                      </span>
                    </div>
                  </Link>
                  <Link
                    href="/treatment/new"
                    className="flex items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80 group mt-1"
                  >
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900 mt-0.5">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block">
                        Treatment Certificate (AFAS)
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                        A4 Methyl Bromide AFAS Treatment Certificate
                      </span>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/settings"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === "/settings"
                  ? "bg-slate-100 text-slate-900 font-semibold dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
              }`}
            >
              Settings
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/certificates/new"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Create Draft</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-900">
          <nav className="flex flex-col gap-2">
            <Link
              href="/certificates"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              All Drafts
            </Link>
            <Link
              href="/certificates/new"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>+ New Gas Clearance Certificate</span>
            </Link>
            <Link
              href="/treatment/new"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
            >
              <Layers className="h-4 w-4" />
              <span>+ New Treatment Certificate (AFAS)</span>
            </Link>
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <SettingsIcon className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
