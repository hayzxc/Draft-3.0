import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { baseTreatmentCertificateSchema } from "@/lib/treatment-schema";
import { generateQrDataUrl } from "@/lib/qr";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/treatment-certificates/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const certificate = await prisma.treatmentCertificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Treatment certificate not found" }, { status: 404 });
    }

    return NextResponse.json(certificate);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch treatment certificate" }, { status: 500 });
  }
}

// PATCH /api/treatment-certificates/[id]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validatedData = baseTreatmentCertificateSchema.partial().parse(body);

    let qrCodeDataUrl = validatedData.qrCodeDataUrl;
    if (validatedData.verificationUrl && !qrCodeDataUrl) {
      qrCodeDataUrl = await generateQrDataUrl(validatedData.verificationUrl);
    }

    const updated = await (prisma.treatmentCertificate as any).update({
      where: { id },
      data: {
        ...(validatedData as any),
        ...(qrCodeDataUrl && { qrCodeDataUrl }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ errors: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to update treatment certificate" }, { status: 500 });
  }
}

// DELETE /api/treatment-certificates/[id]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.treatmentCertificate.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete treatment certificate" }, { status: 500 });
  }
}
