import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TreatmentEditor } from "@/components/treatment/TreatmentEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditTreatmentPage({ params }: PageProps) {
  const { id } = await params;
  const certificate = await prisma.treatmentCertificate.findUnique({
    where: { id },
  });

  if (!certificate) {
    notFound();
  }

  let companyAsset = null;
  try {
    companyAsset = await prisma.companyAsset.findFirst();
  } catch (err) {
    console.warn("Failed to fetch companyAsset in /treatment/[id]:", err);
  }

  return (
    <div className="mx-auto max-w-[1760px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
              Editing Draft • ID0018MB
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {certificate.certificateNumber || "Draft"}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Edit Treatment Certificate
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Containers: <span className="font-medium text-slate-700 dark:text-slate-300">{certificate.containers || "None specified"}</span>
          </p>
        </div>
      </div>
      <TreatmentEditor
        isEditing
        initialData={{
          id: certificate.id,
          serialNo: certificate.serialNo,
          dateIssued: certificate.dateIssued,
          certificateNumber: certificate.certificateNumber,
          consignmentLinkPpk: certificate.consignmentLinkPpk,
          consignmentLinkDo: certificate.consignmentLinkDo,
          consignmentLinkBl: certificate.consignmentLinkBl,
          containers: certificate.containers,
          consignee: certificate.consignee,
          sealNumbers: certificate.sealNumbers,
          carrierVessel: certificate.carrierVessel,
          clientNameAddress: certificate.clientNameAddress,
          commodityDescription: certificate.commodityDescription,
          originCountry: certificate.originCountry,
          destinationCountry: certificate.destinationCountry,
          portOfLoading: certificate.portOfLoading,
          portOfUnloading: certificate.portOfUnloading,
          targetOfFumigation: certificate.targetOfFumigation,
          enclosureType: certificate.enclosureType,
          prescribedDoseRate: certificate.prescribedDoseRate,
          prescribedExposurePeriod: certificate.prescribedExposurePeriod,
          prescribedTemperature: certificate.prescribedTemperature,
          appliedDose: certificate.appliedDose,
          appliedExposurePeriod: certificate.appliedExposurePeriod,
          appliedTemperature: certificate.appliedTemperature,
          placeOfFumigation: certificate.placeOfFumigation,
          commencingAt: certificate.commencingAt,
          completedAt: certificate.completedAt,
          finalTlvReading: certificate.finalTlvReading,
          fumigatorName: certificate.fumigatorName,
          fumigatorAccreditationNumber: certificate.fumigatorAccreditationNumber,
          fumigatorSignatureUrl: certificate.fumigatorSignatureUrl,
          additionalDeclarations: certificate.additionalDeclarations,
          stampImageUrl: null,
          logoImageUrl: companyAsset?.logoImageUrl || "/images/letterhead.jpg",
        }}
      />
    </div>
  );
}
