/**
 * Minimal Prisma seed — matches the current 32-model schema.
 *
 * Creates just enough data to:
 *   • make /api/public/cafes/1 return a real cafe (instead of 404)
 *   • give the dev-seed admin a real SUPER_ADMIN row in the DB
 *   • populate the 4 subscription plans referenced by the pricing page
 *
 * Idempotent: re-runs upsert. Safe to execute multiple times.
 *
 * Run locally (Windows):
 *   npx prisma db push        # creates tables in Neon
 *   npx prisma db seed        # populates them
 *
 * Customise the admin email/password via .env:
 *   SEED_ADMIN_EMAIL=you@example.com
 *   SEED_ADMIN_PASSWORD=ChooseAStrongPassword
 */

// Prisma 6 skips its own .env autoload when a prisma.config.ts exists, and
// `npx prisma db seed` launches this file as a subprocess — so DATABASE_URL
// isn't inherited unless we load it ourselves.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function omr(n: number): Decimal {
  return new Decimal(n.toFixed(3));
}

async function main() {
  console.log("Starting seed…");

  // ----- 1. Plans -----
  const plansData = [
    {
      slug: "free",
      name: "Free",
      description: "Basic digital QR menu",
      monthlyPrice: omr(0),
      yearlyPrice: omr(0),
      currency: "OMR",
      maxBranches: 1,
      maxTables: 10,
      maxProducts: 20,
      maxStaffUsers: 1,
      trialDays: 0,
      isPopular: false,
    },
    {
      slug: "basic",
      name: "Basic",
      description: "Solid start for new cafes",
      monthlyPrice: omr(5),
      yearlyPrice: omr(48),
      currency: "OMR",
      maxBranches: 1,
      maxTables: 20,
      maxProducts: 60,
      maxStaffUsers: 3,
      trialDays: 14,
      isPopular: false,
    },
    {
      slug: "popular",
      name: "Popular",
      description: "Growing cafes — loyalty, analytics, drive-thru",
      monthlyPrice: omr(9),
      yearlyPrice: omr(86),
      currency: "OMR",
      maxBranches: 2,
      maxTables: 50,
      maxProducts: 150,
      maxStaffUsers: 8,
      trialDays: 14,
      isPopular: true,
    },
    {
      slug: "business",
      name: "Business",
      description: "Multi-branch chains, advanced analytics",
      monthlyPrice: omr(15),
      yearlyPrice: omr(144),
      currency: "OMR",
      maxBranches: 99,
      maxTables: 999,
      maxProducts: 9999,
      maxStaffUsers: 99,
      trialDays: 14,
      isPopular: false,
    },
  ];

  for (const p of plansData) {
    await prisma.plan.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }
  console.log(`Plans seeded: ${plansData.length}`);

  // ----- 2. Roles -----
  const roles = [
    { name: "SUPER_ADMIN", displayName: "Platform Administrator" },
    { name: "OWNER", displayName: "Cafe Owner" },
    { name: "MANAGER", displayName: "Cafe Manager" },
    { name: "CASHIER", displayName: "Cashier" },
    { name: "KITCHEN", displayName: "Kitchen Staff" },
  ];
  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { displayName: r.displayName },
      create: r,
    });
  }
  console.log(`Roles seeded: ${roles.length}`);

  // ----- 3. SUPER_ADMIN user -----
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@cafeqr.local").toLowerCase().trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe!2026";
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, status: "active" },
    create: {
      fullName: "Platform Administrator",
      email: adminEmail,
      passwordHash: adminHash,
      status: "active",
    },
  });

  const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: superAdminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: superAdminRole.id },
    });
  }
  console.log(`Admin: ${adminEmail} / [hash stored]`);

  // ----- 4. Sample Cafe (so /api/public/cafes/1 returns data) -----
  const cafe = await prisma.cafe.upsert({
    where: { slug: "demo-cafe" },
    update: {},
    create: {
      cafeCode: "DEMO001",
      name: "Demo Cafe",
      slug: "demo-cafe",
      logo: "https://picsum.photos/seed/logo/150/150",
      coverImage: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&fit=crop",
      description: "Sample cafe seeded by prisma/seed.ts",
      ownerUserId: adminUser.id,
      phone: "+96812345678",
      email: "owner@demo-cafe.local",
      country: "OM",
      city: "Muscat",
      timezone: "Asia/Muscat",
      currency: "OMR",
      status: "active",
      onboardingStatus: "completed",
      joinedAt: new Date(),
    },
  });
  console.log(`Cafe: id=${cafe.id} slug=${cafe.slug}`);

  // ----- 5. Cafe Branch -----
  const branch = await prisma.cafeBranch.upsert({
    where: { uuid: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      uuid: "00000000-0000-0000-0000-000000000001",
      cafeId: cafe.id,
      branchCode: "MAIN",
      name: "Main Branch",
      city: "Muscat",
      isMainBranch: true,
      status: "active",
    },
  });

  // ----- 6. Cafe Tables (4 tables) -----
  const tables = [1, 2, 3, 4];
  for (const t of tables) {
    await prisma.cafeTable.upsert({
      where: { uuid: `00000000-0000-0000-0000-00000000010${t}` },
      update: {},
      create: {
        uuid: `00000000-0000-0000-0000-00000000010${t}`,
        cafeId: cafe.id,
        branchId: branch.id,
        tableNumber: `T-${String(t).padStart(2, "0")}`,
        tableName: `Table ${t}`,
        seatsCount: 4,
        status: "available",
      },
    });
  }
  console.log(`Tables seeded: ${tables.length}`);

  // ----- 7. Menu Category + Items -----
  const category = await prisma.menuCategory.upsert({
    where: { uuid: "00000000-0000-0000-0000-000000000201" },
    update: {},
    create: {
      uuid: "00000000-0000-0000-0000-000000000201",
      cafeId: cafe.id,
      branchId: branch.id,
      name: "Coffee",
      description: "Hot & cold coffee drinks",
      sortOrder: 0,
      status: "active",
    },
  });

  const items = [
    { uuid: "00000000-0000-0000-0000-000000000301", name: "Spanish Latte", price: 2.5 },
    { uuid: "00000000-0000-0000-0000-000000000302", name: "V60 Drip", price: 3.2 },
    { uuid: "00000000-0000-0000-0000-000000000303", name: "Avocado Toast", price: 4.0 },
  ];
  for (const it of items) {
    await prisma.menuItem.upsert({
      where: { uuid: it.uuid },
      update: {},
      create: {
        uuid: it.uuid,
        cafeId: cafe.id,
        branchId: branch.id,
        categoryId: category.id,
        name: it.name,
        price: omr(it.price),
        isAvailable: true,
        status: "active",
      },
    });
  }
  console.log(`Menu items seeded: ${items.length}`);

  console.log("");
  console.log("");
  console.log("Seed complete. Test with:");
  console.log(`  curl https://www.cafe-qr.com/api/public/cafes/${cafe.id}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
