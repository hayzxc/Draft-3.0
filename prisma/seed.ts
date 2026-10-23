import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed default admin user
  const email = "admin@fumigation.com";
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (!existingUser) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });
    console.log("Seeded default user: admin@fumigation.com / admin123");
  }

  // Seed default company asset (stamp & logo)
  const existingAsset = await prisma.companyAsset.findFirst();
  if (!existingAsset) {
    await prisma.companyAsset.create({
      data: {
        stampImageUrl: "/images/stamp.png",
        logoImageUrl: "/images/letterhead.jpg",
      },
    });
    console.log("Seeded default company asset");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
