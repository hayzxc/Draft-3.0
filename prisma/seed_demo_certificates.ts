import { PrismaClient } from "@prisma/client";
import { generateQrDataUrl } from "../lib/qr";

const prisma = new PrismaClient();

async function main() {
  // Clear and re-seed treatment certificates with the exact user document
  await prisma.treatmentCertificate.deleteMany();

  const verificationUrl =
    "https://ft.karantinaindonesia.go.id/verify/certificate/01a16276-519f-73b1-ae2e-a56f39d5db9a";
  const qrCodeDataUrl = await generateQrDataUrl(verificationUrl);

  await prisma.treatmentCertificate.create({
    data: {
      serialNo: "2026000063",
      dateIssued: new Date("2026-10-22"),
      certificateNumber: "00001/ECERT/MB/JZ70SGVQ7C/ID0018MB/X/2026",
      consignmentLinkPpk: "301045S3B251982026101901929",
      consignmentLinkDo: "668235",
      consignmentLinkBl: "OOLU2340317000",
      containers: "OOLU0270430, CSNU1121060, CSNU1710250",
      consignee:
        "| CHAOHU SANFENGSENYE SUPPLY | CHAIN CO., LTD. | ROOM 205, COMPREHENSIVE | BUILDING 6, USTC STUDENT | INNOVATION & ENTERPRENEURSHIP BASE NO.8 | YAHE STREET, YAFU SUB-DISTRCT, | JUCHAO ECONOMIC & | TECHNOLOGICAL DEVELOPMENT | ZONE, CHAOHU, HEFEI,ANHUI, | CHINA. | TEL : 13427831495 | USCI CODE: 91340181MAKMTLDA3X | NOTIFY PARTY: | CHAOHU SANFENGSENYE SUPPLY | CHAIN CO., LTD. | ROOM 205, COMPREHENSIVE | BUILDING 6, USTC STUDENT | INNOVATION & ENTERPRENEURSHIP BASE NO.8 | YAHE STREET, YAFU SUB-DISTRCT, | JUCHAO ECONOMIC & | TECHNOLOGICAL DEVELOPMENT | ZONE, CHAOHU, HEFEI,ANHUI, | CHINA. | TEL : 13427831495 | USCI CODE: 91340181MAKMTLDA3X",
      sealNumbers: "OOLKTE9652, OOLKTE9650, OOLKTE9651",
      carrierVessel: "YM EFFICIENCY 208N",
      clientNameAddress: "SONIA LINTAS BENUA",
      commodityDescription:
        "3X20 | 37 PALLETS = 1,985 PCS = | 57.8406 M3 OF MERBAU E2E | (INTSIA BIJUGA)",
      originCountry: "INDONESIA",
      destinationCountry: "CHINA",
      portOfLoading: "SURABAYA, INDONESIA",
      portOfUnloading: "SHATIAN, CHINA",
      targetOfFumigation: "Commodity and Container",
      enclosureType: "Sheeted Container",
      prescribedDoseRate: "48.00 g/m³",
      prescribedExposurePeriod: "24 (hours)",
      prescribedTemperature: "21 °C",
      appliedDose: "48.00 g/m³",
      appliedExposurePeriod: "24 (hours)",
      appliedTemperature: "23 °C",
      placeOfFumigation:
        "PT Patriot Sakti Indonesia | Jl. Raya Kalianak No. 59 A Surabaya",
      commencingAt: new Date("2026-10-20T10:46:00Z"),
      completedAt: new Date("2026-10-21T13:00:00Z"),
      finalTlvReading: "ALL CONTAINERS < 5 PPM",
      fumigatorName: "RONI FIRMANSYAH RAMADHAN",
      fumigatorAccreditationNumber: "-",
      additionalDeclarations:
        "The Fumigation Certificate Is Only Valid For 21 Days From The Date Of Treatment Prior To Export.",
      verificationUrl,
      qrCodeDataUrl,
    },
  });

  console.log("Seeded exact Treatment Certificate from picture");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
