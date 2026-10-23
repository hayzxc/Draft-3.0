"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  FileText,
  PlusCircle,
  Download,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  Layers,
} from "lucide-react";

export interface UnifiedDraftItem {
  id: string;
  type: "gas-clearance" | "treatment";
  title: string;
  identifier: string; // containerNumber or certificateNumber
  secondaryInfo: string; // carrier or consignee
  date: string | Date;
  updatedAt: string | Date;
}

interface DraftsListProps {
  gasClearanceDrafts: any[];
  treatmentDrafts: any[];
}

export const DraftsList: React.FC<DraftsListProps> = ({
  gasClearanceDrafts,
  treatmentDrafts,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "gas-clearance" | "treatment">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Map to unified shape
  const allDrafts: UnifiedDraftItem[] = [
    ...gasClearanceDrafts.map((gc) => ({
      id: gc.id,
      type: "gas-clearance" as const,
      title: gc.commodity,
      identifier: gc.containerNumber,
      secondaryInfo: gc.carrierVessel,
      date: gc.certificateDate,
      updatedAt: gc.updatedAt,
    })),
    ...treatmentDrafts.map((t) => ({
      id: t.id,
      type: "treatment" as const,
      title: t.commodityDescription || t.consignee,
      identifier: t.certificateNumber || t.containers,
      secondaryInfo: t.carrierVessel,
      date: t.dateIssued,
      updatedAt: t.updatedAt,
    })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const filteredDrafts = allDrafts.filter((draft) => {
    const matchesTab = activeTab === "all" || draft.type === activeTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      draft.title?.toLowerCase().includes(q) ||
      draft.identifier?.toLowerCase().includes(q) ||
      draft.secondaryInfo?.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const handleDelete = async (id: string, type: "gas-clearance" | "treatment") => {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    setDeletingId(id);
    try {
      const endpoint =
        type === "gas-clearance"
          ? `/api/certificates/${id}`
          : `/api/treatment-certificates/${id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to delete draft.");
      }
    } catch {
      alert("Error deleting draft.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDateStr = (d: any) => {
    if (!d) return "-";
    try {
      return format(new Date(d), "dd/MM/yyyy");
    } catch {
      return "-";
    }
  };

  const formatDateTimeStr = (d: any) => {
    if (!d) return "-";
    try {
      return format(new Date(d), "dd/MM/yyyy HH:mm");
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Certificate Drafts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage, edit, and export official print-ready PDF certificates
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/certificates/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Gas Clearance</span>
          </Link>
          <Link
            href="/treatment/new"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>New Treatment Cert (A4)</span>
          </Link>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/60 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            All ({allDrafts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gas-clearance")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "gas-clearance"
                ? "bg-white text-sky-700 shadow-sm border border-sky-200/60 dark:bg-slate-800 dark:text-sky-400 dark:border-sky-900"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            Gas Clearance ({gasClearanceDrafts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("treatment")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "treatment"
                ? "bg-white text-indigo-700 shadow-sm border border-indigo-200/60 dark:bg-slate-800 dark:text-indigo-400 dark:border-indigo-900"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            Treatment Cert ({treatmentDrafts.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search container, commodity, vessel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-900 shadow-subtle focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white transition-all"
          />
        </div>
      </div>

      {/* Table of Drafts */}
      {filteredDrafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
          <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            No drafts found
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            {searchQuery
              ? "Try adjusting your search query or tab filter."
              : "Create a new Gas Clearance or Treatment Certificate to get started."}
          </p>
          <div className="mt-5 flex gap-3">
            <Link
              href="/certificates/new"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
            >
              + New Gas Clearance
            </Link>
            <Link
              href="/treatment/new"
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-sm transition-colors cursor-pointer"
            >
              + New Treatment Cert
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200/80 dark:divide-slate-800 text-left text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Identifier</th>
                <th className="px-5 py-3.5">Commodity / Article</th>
                <th className="px-5 py-3.5">Carrier / Vessel</th>
                <th className="px-5 py-3.5">Cert Date</th>
                <th className="px-5 py-3.5">Last Updated</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredDrafts.map((draft) => {
                const isGasClearance = draft.type === "gas-clearance";
                const editUrl = isGasClearance
                  ? `/certificates/${draft.id}`
                  : `/treatment/${draft.id}`;
                const pdfUrl = isGasClearance
                  ? `/api/certificates/${draft.id}/pdf`
                  : `/api/treatment-certificates/${draft.id}/pdf`;

                return (
                  <tr
                    key={`${draft.type}-${draft.id}`}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {isGasClearance ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800">
                          Gas Clearance (A4)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
                          Treatment Cert (A4)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {draft.identifier || "-"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {draft.title || "-"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate text-xs">
                      {draft.secondaryInfo || "-"}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400 text-xs">
                      {formatDateStr(draft.date)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-400 dark:text-slate-500">
                      {formatDateTimeStr(draft.updatedAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={editUrl}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-subtle hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5 text-slate-500" />
                          <span>Edit</span>
                        </Link>
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200/80 bg-blue-50/80 px-2.5 py-1.5 text-xs font-semibold text-blue-700 shadow-subtle hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300 transition-colors cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>PDF</span>
                        </a>
                        {!isGasClearance && (
                          <a
                            href={`/api/treatment-certificates/${draft.id}/docx`}
                            download
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-subtle hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Download Treatment Certificate sebagai Word (.docx)"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>DOCX</span>
                          </a>
                        )}
                        <button
                          type="button"
                          disabled={deletingId === draft.id}
                          onClick={() => handleDelete(draft.id, draft.type)}
                          className="inline-flex items-center rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete Draft"
                          aria-label="Delete draft"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DraftsList;
