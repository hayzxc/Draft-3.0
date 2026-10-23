import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { baseCertificateSchema } from "@/lib/certificate-schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/certificates/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const certificate = await prisma.gasClearanceCertificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    return NextResponse.json(certificate);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch certificate" }, { status: 500 });
  }
}

// PATCH /api/certificates/[id]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validatedData = baseCertificateSchema.partial().parse(body);

    const updated = await (prisma.gasClearanceCertificate as any).update({
      where: { id },
      data: validatedData as any,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ errors: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to update certificate" }, { status: 500 });
  }
}

// DELETE /api/certificates/[id]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.gasClearanceCertificate.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete certificate" }, { status: 500 });
  }
}
