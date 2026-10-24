import React from "react";
import { GasClearanceEditor } from "@/components/certificate/GasClearanceEditor";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewGasClearancePage() {
  let companyAsset = null;
  try {
    companyAsset = await prisma.companyAsset.findFirst();
  } catch (err) {
    console.warn("Failed to fetch companyAsset in /certificates/new, using default letterhead:", err);
  }

  return (
    <div className="mx-auto max-w-[1760px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Sertifikat Bebas Gas (Gas Clearance Certificate)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Form pembuatan sertifikat bebas gas bilingual (Indonesia / English) resmi sesuai format Barantin
          </p>
        </div>
      </div>
      <GasClearanceEditor
        initialData={{
          serialNo: "",
          certificateNumber: "",
          registrationNumber: "ID0018MB",
          certificateDate: undefined as any,
          commodity: "",
          containerNumber: "",
          carrierVessel: "",
          fumigationArea: "",
          fumigant: "Methyl Bromide (CH3Br)",
          commencingAt: undefined as any,
          completedAt: undefined as any,
          gasLevelPpm: null,
          gasLevelReading: "",
          fumigatorName: "",
          fumigatorSignatureUrl: null,
          stampImageUrl: null,
          logoImageUrl: companyAsset?.logoImageUrl || "/images/letterhead.jpg",
          verificationUrl: "",
        }}
      />
    </div>
  );
}
