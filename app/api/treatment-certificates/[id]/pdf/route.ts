import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { prisma } from "@/lib/prisma";
import { TreatmentDocument } from "@/components/treatment/TreatmentDocument";
import { generateQrDataUrl } from "@/lib/qr";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const certificate = await prisma.treatmentCertificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Treatment certificate not found" }, { status: 404 });
    }

    const verificationLink = certificate.verificationUrl?.trim() || "";

    const qrCodeDataUrl =
      certificate.qrCodeDataUrl || (verificationLink ? await generateQrDataUrl(verificationLink) : null);

    const element = React.createElement(TreatmentDocument, {
      data: {
        id: certificate.id,
        serialNo: certificate.serialNo,
        dateIssued: certificate.dateIssued,
        certificateNumber: certificate.certificateNumber,
        consignmentLinkPpk: certificate.consignmentLinkPpk,
        consignmentLinkDo: certificate.consignmentLinkDo,
        consignmentLinkBl: certificate.consignmentLinkBl,
        consignmentLinkOther: (certificate as any).consignmentLinkOther,
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
        verificationUrl: verificationLink,
        qrCodeDataUrl,
        includeGasClearance: (certificate as any).includeGasClearance,
        gcCertificateNumber: (certificate as any).gcCertificateNumber,
        gcRegistrationNumber: (certificate as any).gcRegistrationNumber,
        gcGasLevelReading: (certificate as any).gcGasLevelReading,
        gcFumigant: (certificate as any).gcFumigant,
        gcSerialNo: (certificate as any).gcSerialNo,
      },
    }) as any;

    const pdfBuffer = await renderToBuffer(element);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Treatment-Certificate-${certificate.certificateNumber || id}.pdf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Treatment PDF generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to render PDF" }, { status: 500 });
  }
}
