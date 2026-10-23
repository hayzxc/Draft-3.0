import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/company-asset
export async function GET() {
  try {
    let asset = await prisma.companyAsset.findFirst();
    if (!asset) {
      asset = await prisma.companyAsset.create({
        data: {
          stampImageUrl: "/images/stamp.png",
          logoImageUrl: "/images/letterhead.jpg",
        },
      });
    }
    return NextResponse.json(asset);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch company assets" }, { status: 500 });
  }
}

// PUT /api/company-asset
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { stampImageUrl, logoImageUrl } = body;

    const existing = await prisma.companyAsset.findFirst();
    let updated;
    if (existing) {
      updated = await prisma.companyAsset.update({
        where: { id: existing.id },
        data: {
          ...(stampImageUrl !== undefined && { stampImageUrl }),
          ...(logoImageUrl !== undefined && { logoImageUrl }),
        },
      });
    } else {
      updated = await prisma.companyAsset.create({
        data: {
          stampImageUrl: stampImageUrl || "/images/stamp.png",
          logoImageUrl: logoImageUrl || "/images/letterhead.jpg",
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update company assets" }, { status: 500 });
  }
}
