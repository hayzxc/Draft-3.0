import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { treatmentCertificateSchema } from "@/lib/treatment-schema";
import { generateQrDataUrl } from "@/lib/qr";

// GET /api/treatment-certificates
export async function GET() {
  try {
    const certificates = await prisma.treatmentCertificate.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        certificateNumber: true,
        serialNo: true,
        dateIssued: true,
        containers: true,
        consignee: true,
        commodityDescription: true,
        carrierVessel: true,
        destinationCountry: true,
        fumigatorName: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(certificates);
  } catch (error: any) {
    console.error("GET /api/treatment-certificates error:", error);
    return NextResponse.json({ error: "Failed to fetch treatment certificates" }, { status: 500 });
  }
}

// POST /api/treatment-certificates
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = treatmentCertificateSchema.parse(body);

    const verificationUrl = validatedData.verificationUrl?.trim() || null;

    let qrCodeDataUrl = validatedData.qrCodeDataUrl || null;
    if (!qrCodeDataUrl && verificationUrl) {
      qrCodeDataUrl = await generateQrDataUrl(verificationUrl);
    }

    const certificate = await prisma.treatmentCertificate.create({
      data: {
        serialNo: validatedData.serialNo || null,
        dateIssued: validatedData.dateIssued || null,
        certificateNumber: validatedData.certificateNumber || null,
        consignmentLinkPpk: validatedData.consignmentLinkPpk || null,
        consignmentLinkDo: validatedData.consignmentLinkDo || null,
        consignmentLinkBl: validatedData.consignmentLinkBl || null,
        containers: validatedData.containers || null,
        consignee: validatedData.consignee || null,
        sealNumbers: validatedData.sealNumbers || null,
        carrierVessel: validatedData.carrierVessel || null,
        clientNameAddress: validatedData.clientNameAddress || null,
        commodityDescription: validatedData.commodityDescription || null,
        originCountry: validatedData.originCountry || null,
        destinationCountry: validatedData.destinationCountry || null,
        portOfLoading: validatedData.portOfLoading || null,
        portOfUnloading: validatedData.portOfUnloading || null,
        targetOfFumigation: validatedData.targetOfFumigation || null,
        enclosureType: validatedData.enclosureType || null,
        prescribedDoseRate: validatedData.prescribedDoseRate || null,
        prescribedExposurePeriod: validatedData.prescribedExposurePeriod || null,
        prescribedTemperature: validatedData.prescribedTemperature || null,
        appliedDose: validatedData.appliedDose || null,
        appliedExposurePeriod: validatedData.appliedExposurePeriod || null,
        appliedTemperature: validatedData.appliedTemperature || null,
        placeOfFumigation: validatedData.placeOfFumigation || null,
        commencingAt: validatedData.commencingAt || null,
        completedAt: validatedData.completedAt || null,
        finalTlvReading: validatedData.finalTlvReading || null,
        fumigatorName: validatedData.fumigatorName || null,
        fumigatorAccreditationNumber: validatedData.fumigatorAccreditationNumber || "-",
        fumigatorSignatureUrl: validatedData.fumigatorSignatureUrl || null,
        additionalDeclarations: validatedData.additionalDeclarations || null,
        verificationUrl,
        qrCodeDataUrl,
        includeGasClearance: validatedData.includeGasClearance ?? true,
        gcCertificateNumber: validatedData.gcCertificateNumber || null,
        gcRegistrationNumber: validatedData.gcRegistrationNumber || "ID0018MB",
        gcGasLevelReading: validatedData.gcGasLevelReading || null,
        gcFumigant: validatedData.gcFumigant || "Methyl Bromide (CH3Br)",
        gcSerialNo: validatedData.gcSerialNo || null,
      } as any,
    });

    return NextResponse.json(certificate, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ errors: error.flatten() }, { status: 400 });
    }
    console.error("POST /api/treatment-certificates error:", error);
    return NextResponse.json({ error: error.message || "Failed to create treatment certificate" }, { status: 500 });
  }
}
