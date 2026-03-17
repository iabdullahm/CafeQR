import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Roles
  const rolesData = [
    { name: 'super_admin', displayName: 'Platform Administrator' },
    { name: 'admin', displayName: 'Administrator' },
    { name: 'owner', displayName: 'Cafe Owner' },
    { name: 'manager', displayName: 'Branch Manager' },
    { name: 'staff', displayName: 'Service Staff' },
  ];

  const roles: Record<string, any> = {};
  for (const role of rolesData) {
    roles[role.name] = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        displayName: role.displayName,
      },
    });
  }
  console.log('✅ Roles created.');

  // 2. Create Demo User
  const hashedPassword = await bcrypt.hash('123456', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'admin@cafeqr.com' },
    update: { passwordHash: hashedPassword },
    create: {
      fullName: 'Demo Administrator',
      email: 'admin@cafeqr.com',
      passwordHash: hashedPassword,
      status: 'active',
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: demoUser.id,
        roleId: roles['super_admin'].id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      roleId: roles['super_admin'].id,
    },
  });
  console.log('✅ Demo user created and assigned super_admin role.');

  // 3. Create Basic Plans
  const plans = [
    {
      name: 'Basic',
      slug: 'basic',
      monthlyPrice: 9.000,
      yearlyPrice: 90.000,
      maxBranches: 1,
      maxTables: 10,
      maxProducts: 50,
    },
    {
      name: 'Standard',
      slug: 'standard',
      monthlyPrice: 19.000,
      yearlyPrice: 190.000,
      maxBranches: 1,
      maxTables: 25,
      maxProducts: 150,
      isPopular: true,
    },
    {
      name: 'Premium',
      slug: 'premium',
      monthlyPrice: 39.000,
      yearlyPrice: 390.000,
      maxBranches: 3,
      maxTables: 100,
      maxProducts: 500,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        maxBranches: plan.maxBranches,
        maxTables: plan.maxTables,
        maxProducts: plan.maxProducts,
        isPopular: plan.isPopular || false,
      },
      create: {
        name: plan.name,
        slug: plan.slug,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        maxBranches: plan.maxBranches,
        maxTables: plan.maxTables,
        maxProducts: plan.maxProducts,
        isPopular: plan.isPopular || false,
        currency: 'USD',
      },
    });
  }
  console.log('✅ Subscription plans created.');

  console.log('✨ Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
