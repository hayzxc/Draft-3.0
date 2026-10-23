import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GasClearanceEditor } from "@/components/certificate/GasClearanceEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditGasClearancePage({ params }: PageProps) {
  const { id } = await params;
  const certificate = await prisma.gasClearanceCertificate.findUnique({
    where: { id },
  });

  if (!certificate) {
    notFound();
  }

  let companyAsset = null;
  try {
    companyAsset = await prisma.companyAsset.findFirst();
  } catch (err) {
    console.warn("Failed to fetch companyAsset in /certificates/[id]:", err);
  }

  return (
    <div className="mx-auto max-w-[1760px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800">
              Editing Draft • ID0018MB
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {certificate.containerNumber || "Draft"}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Edit Gas Clearance Certificate
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Container: <span className="font-semibold text-slate-700 dark:text-slate-300">{certificate.containerNumber}</span> • Commodity: {certificate.commodity}
          </p>
        </div>
      </div>
      <GasClearanceEditor
        isEditing
        initialData={{
          id: certificate.id,
          serialNo: (certificate as any).serialNo || "",
          certificateNumber: (certificate as any).certificateNumber || "",
          registrationNumber: (certificate as any).registrationNumber || "ID0018MB",
          certificateDate: certificate.certificateDate,
          commodity: certificate.commodity,
          containerNumber: certificate.containerNumber,
          carrierVessel: certificate.carrierVessel,
          fumigationArea: certificate.fumigationArea,
          fumigant: (certificate as any).fumigant || "Methyl Bromide (CH3Br)",
          commencingAt: certificate.commencingAt,
          completedAt: certificate.completedAt,
          gasLevelPpm: Number(certificate.gasLevelPpm),
          gasLevelReading: (certificate as any).gasLevelReading || "",
          fumigatorName: certificate.fumigatorName,
          fumigatorSignatureUrl: certificate.fumigatorSignatureUrl,
          stampImageUrl: null,
          logoImageUrl: companyAsset?.logoImageUrl || "/images/letterhead.jpg",
          verificationUrl: (certificate as any).verificationUrl || "",
          qrCodeDataUrl: (certificate as any).qrCodeDataUrl || "",
        }}
      />
    </div>
  );
}
