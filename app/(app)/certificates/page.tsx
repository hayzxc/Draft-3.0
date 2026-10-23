import React from "react";
import { prisma } from "@/lib/prisma";
import { DraftsList } from "@/components/drafts/DraftsList";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const [gasClearanceDrafts, treatmentDrafts] = await Promise.all([
    prisma.gasClearanceCertificate.findMany({
      orderBy: { updatedAt: "desc" },
    }),
    prisma.treatmentCertificate.findMany({
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <DraftsList
        gasClearanceDrafts={JSON.parse(JSON.stringify(gasClearanceDrafts))}
        treatmentDrafts={JSON.parse(JSON.stringify(treatmentDrafts))}
      />
    </div>
  );
}
