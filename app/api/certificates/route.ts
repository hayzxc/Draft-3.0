import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { certificateSchema } from "@/lib/certificate-schema";

// GET /api/certificates - List all gas clearance drafts
export async function GET() {
  try {
    const certificates = await (prisma.gasClearanceCertificate as any).findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        serialNo: true,
        certificateNumber: true,
        commodity: true,
        containerNumber: true,
        certificateDate: true,
        carrierVessel: true,
        fumigationArea: true,
        fumigatorName: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(certificates);
  } catch (error: any) {
    console.error("GET /api/certificates error:", error);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}

// POST /api/certificates - Create a new draft
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = certificateSchema.parse(body);

    const certificate = await (prisma.gasClearanceCertificate as any).create({
      data: {
        serialNo: validatedData.serialNo || null,
        certificateNumber: validatedData.certificateNumber || null,
        registrationNumber: validatedData.registrationNumber || "ID0018MB",
        certificateDate: validatedData.certificateDate || null,
        commodity: validatedData.commodity || null,
        containerNumber: validatedData.containerNumber || null,
        carrierVessel: validatedData.carrierVessel || null,
        fumigationArea: validatedData.fumigationArea || null,
        fumigant: validatedData.fumigant || "Methyl Bromide (CH3Br)",
        commencingAt: validatedData.commencingAt || null,
        completedAt: validatedData.completedAt || null,
        gasLevelPpm: validatedData.gasLevelPpm ?? 0,
        gasLevelReading: validatedData.gasLevelReading || null,
        fumigatorName: validatedData.fumigatorName || null,
        fumigatorSignatureUrl: validatedData.fumigatorSignatureUrl || null,
        verificationUrl: validatedData.verificationUrl || null,
        qrCodeDataUrl: validatedData.qrCodeDataUrl || null,
      },
    });

    return NextResponse.json(certificate, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ errors: error.flatten() }, { status: 400 });
    }
    console.error("POST /api/certificates error:", error);
    return NextResponse.json({ error: error.message || "Failed to create certificate" }, { status: 500 });
  }
}
