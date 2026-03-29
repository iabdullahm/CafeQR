// @ts-nocheck
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const payload = {
      name: "Test Cafe",
      slug: "test-cafe",
      email: "test@test.com",
      city: "Dubai",
      status: "active"
    };
    
    await prisma.cafe.create({
      data: {
        cafeCode: `CAF-${Date.now()}`,
        ...payload,
        joinedAt: new Date()
      }
    });
    console.log("Success");
  } catch(e) {
    console.log("Prisma Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
