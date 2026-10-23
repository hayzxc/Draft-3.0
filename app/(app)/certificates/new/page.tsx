import React from "react";
import { GasClearanceEditor } from "@/components/certificate/GasClearanceEditor";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewGasClearancePage() {
  const companyAsset = await prisma.companyAsset.findFirst();

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
          serialNo: "202600079",
          certificateNumber: "00008/GC/MB/JZ70SGVQ7C/ID0018MB/X/2026",
          registrationNumber: "ID0018MB",
          certificateDate: new Date(),
          commodity:
            "1 X 20' SAID TO CONTAIN 10 PALLETS = 11,800 PCS = 21.8540 M3 OF MERBAU REEDED DECKING (INTSIA BIJUGA) GW : 18,026.00 KGS NW : 17,484.00 KGS MEAS : 21.8540 M3",
          containerNumber: "CSNU2373750",
          carrierVessel: "YM EFFICIENCY 208N",
          fumigationArea:
            "PT Patriot Sakti Indonesia | Jl. Raya Kalianak No. 59 A Surabaya",
          fumigant: "Methyl Bromide (CH3Br)",
          commencingAt: new Date("2026-10-20T17:46:00"),
          completedAt: new Date("2026-10-21T20:00:00"),
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
