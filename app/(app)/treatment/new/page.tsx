import React from "react";
import { TreatmentEditor } from "@/components/treatment/TreatmentEditor";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewTreatmentPage() {
  const companyAsset = await prisma.companyAsset.findFirst();

  return (
    <div className="mx-auto max-w-[1760px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Draft E-SERTIF DAN GAS CLEARANCE
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Website untuk buat draft sertifikat
          </p>
        </div>
      </div>
      <TreatmentEditor
        initialData={{
          serialNo: "",
          dateIssued: undefined as any,
          certificateNumber: "",
          consignmentLinkPpk: "",
          consignmentLinkDo: "",
          consignmentLinkBl: "",
          containers: "",
          consignee: "",
          sealNumbers: "",
          carrierVessel: "",
          clientNameAddress: "",
          commodityDescription: "",
          originCountry: "INDONESIA",
          destinationCountry: "",
          portOfLoading: "",
          portOfUnloading: "",
          targetOfFumigation: "",
          enclosureType: "",
          prescribedDoseRate: "",
          prescribedExposurePeriod: "",
          prescribedTemperature: "",
          appliedDose: "",
          appliedExposurePeriod: "",
          appliedTemperature: "",
          placeOfFumigation: "",
          commencingAt: undefined as any,
          completedAt: undefined as any,
          finalTlvReading: "",
          fumigatorName: "",
          fumigatorAccreditationNumber: "",
          fumigatorSignatureUrl: null,
          additionalDeclarations: "",
          stampImageUrl: null,
          logoImageUrl: companyAsset?.logoImageUrl || "/images/letterhead.jpg",
        }}
      />
    </div>
  );
}
