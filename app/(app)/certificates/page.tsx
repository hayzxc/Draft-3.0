import React from "react";
import { prisma } from "@/lib/prisma";
import { DraftsList } from "@/components/drafts/DraftsList";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  let gasClearanceDrafts: any[] = [];
  let treatmentDrafts: any[] = [];
  let dbError: string | null = null;

  try {
    const results = await Promise.all([
      prisma.gasClearanceCertificate.findMany({
        orderBy: { updatedAt: "desc" },
      }),
      prisma.treatmentCertificate.findMany({
        orderBy: { updatedAt: "desc" },
      }),
    ]);
    gasClearanceDrafts = results[0];
    treatmentDrafts = results[1];
  } catch (err: any) {
    console.error("Database error in CertificatesPage:", err);
    dbError = "Tidak dapat terhubung ke database server. Pastikan DATABASE_URL di Vercel sudah benar dan database cloud aktif.";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {dbError && (
        <div className="mb-6 rounded-xl border border-amber-300/80 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900/60 p-4 text-xs text-amber-900 dark:text-amber-200">
          <p className="font-bold">⚠️ Koneksi Database Belum Terhubung</p>
          <p className="mt-1">
            {dbError}
          </p>
        </div>
      )}
      <DraftsList
        gasClearanceDrafts={JSON.parse(JSON.stringify(gasClearanceDrafts))}
        treatmentDrafts={JSON.parse(JSON.stringify(treatmentDrafts))}
      />
    </div>
  );
}
