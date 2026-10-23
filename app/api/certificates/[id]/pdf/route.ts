import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { prisma } from "@/lib/prisma";
import { CertificateDocument } from "@/components/certificate/CertificateDocument";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const certificate = await prisma.gasClearanceCertificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const companyAsset = await prisma.companyAsset.findFirst();

    const certAny = certificate as any;
    const verificationUrl = certAny.verificationUrl?.trim() || "";

    let qrCodeDataUrl = certAny.qrCodeDataUrl;
    if (!qrCodeDataUrl && verificationUrl) {
      try {
        const { generateQrDataUrl } = await import("@/lib/qr");
        qrCodeDataUrl = await generateQrDataUrl(verificationUrl);
      } catch (err) {
        console.error("Error generating QR:", err);
      }
    }

    const element = React.createElement(CertificateDocument, {
      data: {
        id: certificate.id,
        serialNo: certAny.serialNo,
        certificateNumber: certAny.certificateNumber,
        registrationNumber: certAny.registrationNumber || "ID0018MB",
        certificateDate: certificate.certificateDate,
        commodity: certificate.commodity,
        containerNumber: certificate.containerNumber,
        carrierVessel: certificate.carrierVessel,
        fumigationArea: certificate.fumigationArea,
        fumigant: certAny.fumigant || "Methyl Bromide (CH3Br)",
        commencingAt: certificate.commencingAt,
        completedAt: certificate.completedAt,
        gasLevelPpm: Number(certificate.gasLevelPpm),
        gasLevelReading: certAny.gasLevelReading,
        fumigatorName: certificate.fumigatorName,
        fumigatorSignatureUrl: certificate.fumigatorSignatureUrl,
        stampImageUrl: null,
        logoImageUrl: companyAsset?.logoImageUrl || "/images/letterhead.jpg",
        verificationUrl,
        qrCodeDataUrl,
      },
    }) as any;

    const pdfBuffer = await renderToBuffer(element);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="GC-Certificate-${certificate.containerNumber || id}.pdf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to render PDF" }, { status: 500 });
  }
}
