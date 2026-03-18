import {
  PrismaClient,
  BranchStatus,
  CategoryStatus,
  LoyaltyLogType,
  OrderStatus,
  OrderType,
  ProductStatus,
  SubscriptionStatus,
  TableStatus,
  TableType,
  UserRole,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function omr(value: number) {
  return new Decimal(value.toFixed(3));
}

async function main() {
  console.log('🌱 Starting Prisma seed...');

  // Clean up existing data
  await prisma.loyaltyLog.deleteMany();
  await prisma.loyaltyAccount.deleteMany();
  await prisma.loyaltyRule.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.qRCode.deleteMany();
  await prisma.table.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.cafe.deleteMany();

  const passwordHash = await bcrypt.hash('Admin@123', 10);

  // 1. Create Plans
  const basicPlan = await prisma.plan.create({
    data: {
      name: 'Basic',
      code: 'basic',
      description: 'Single branch plan for small cafes.',
      priceMonthly: omr(19.9),
      maxBranches: 1,
      maxTables: 20,
      maxProducts: 80,
      hasLoyalty: false,
      hasMultiBranch: false,
      hasAdvancedAnalytics: false,
    },
  });

  const premiumPlan = await prisma.plan.create({
    data: {
      name: 'Premium',
      code: 'premium',
      description: 'Multi-branch plan with loyalty and advanced analytics.',
      priceMonthly: omr(49.9),
      maxBranches: 10,
      maxTables: 300,
      maxProducts: 1000,
      hasLoyalty: true,
      hasMultiBranch: true,
      hasAdvancedAnalytics: true,
    },
  });

  const enterprisePlan = await prisma.plan.create({
    data: {
      name: 'Enterprise',
      code: 'enterprise',
      description: 'Custom enterprise plan for large cafe groups.',
      priceMonthly: omr(99.9),
      maxBranches: 999,
      maxTables: 9999,
      maxProducts: 9999,
      hasLoyalty: true,
      hasMultiBranch: true,
      hasAdvancedAnalytics: true,
    },
  });

  // 2. Create Cafes
  const urbanCafe = await prisma.cafe.create({
    data: {
      name: 'Urban Brew Cafe',
      slug: 'urban-brew-cafe',
      logoUrl: 'https://picsum.photos/seed/urban/200/200',
      description: 'Modern specialty coffee experience in Muscat.',
      phone: '+96890000001',
      email: 'hello@urbanbrew.om',
      address: 'Sultan Qaboos Street',
      city: 'Muscat',
      country: 'Oman',
      currency: 'OMR',
      timezone: 'Asia/Muscat',
      taxPercent: omr(5),
      serviceFee: omr(0.5),
      isActive: true,
    },
  });

  const coastalCafe = await prisma.cafe.create({
    data: {
      name: 'Coastal Cup',
      slug: 'coastal-cup',
      logoUrl: 'https://picsum.photos/seed/coastal/200/200',
      description: 'Beach-inspired cafe with dine-in and car service.',
      phone: '+96890000002',
      email: 'info@coastalcup.om',
      address: 'Al Mouj',
      city: 'Muscat',
      country: 'Oman',
      currency: 'OMR',
      timezone: 'Asia/Muscat',
      taxPercent: omr(5),
      serviceFee: omr(0.25),
      isActive: true,
    },
  });

  // 3. Create Subscriptions
  await prisma.subscription.create({
    data: {
      cafeId: urbanCafe.id,
      planId: premiumPlan.id,
      status: SubscriptionStatus.ACTIVE,
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
      endsAt: new Date('2026-12-31T23:59:59.000Z'),
      autoRenew: true,
    },
  });

  await prisma.subscription.create({
    data: {
      cafeId: coastalCafe.id,
      planId: basicPlan.id,
      status: SubscriptionStatus.ACTIVE,
      startsAt: new Date('2026-01-15T00:00:00.000Z'),
      endsAt: new Date('2026-12-31T23:59:59.000Z'),
      autoRenew: true,
    },
  });

  // 4. Create Users
  const ownerUser = await prisma.user.create({
    data: {
      cafeId: urbanCafe.id,
      fullName: 'Abdullah Al Jahwari',
      email: 'abdullah@urbanbrew.om',
      passwordHash,
      role: UserRole.OWNER,
      isActive: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      cafeId: urbanCafe.id,
      fullName: 'Sara Al Balushi',
      email: 'sara@urbanbrew.om',
      passwordHash,
      role: UserRole.MANAGER,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      cafeId: coastalCafe.id,
      fullName: 'Faisal Al Hinai',
      email: 'faisal@coastalcup.om',
      passwordHash,
      role: UserRole.OWNER,
      isActive: true,
    },
  });

  // 5. Create Branches
  const muscatBranch = await prisma.branch.create({
    data: {
      cafeId: urbanCafe.id,
      name: 'Muscat Branch',
      code: 'MCT-01',
      phone: '+96891000011',
      email: 'muscat@urbanbrew.om',
      address: 'Muscat Grand Mall',
      city: 'Muscat',
      latitude: new Decimal('23.5880000'),
      longitude: new Decimal('58.3829000'),
      status: BranchStatus.ACTIVE,
      openingTime: '07:00',
      closingTime: '23:00',
    },
  });

  const azaibaBranch = await prisma.branch.create({
    data: {
      cafeId: urbanCafe.id,
      name: 'Azaiba Branch',
      code: 'AZB-01',
      phone: '+96891000012',
      email: 'azaiba@urbanbrew.om',
      address: 'Azaiba Main Road',
      city: 'Muscat',
      latitude: new Decimal('23.5937000'),
      longitude: new Decimal('58.4251000'),
      status: BranchStatus.ACTIVE,
      openingTime: '08:00',
      closingTime: '22:00',
    },
  });

  const moujBranch = await prisma.branch.create({
    data: {
      cafeId: coastalCafe.id,
      name: 'Al Mouj Branch',
      code: 'MOUJ-01',
      phone: '+96891000021',
      email: 'almouj@coastalcup.om',
      address: 'Al Mouj Waterfront',
      city: 'Muscat',
      latitude: new Decimal('23.6403000'),
      longitude: new Decimal('58.2800000'),
      status: BranchStatus.ACTIVE,
      openingTime: '07:30',
      closingTime: '23:30',
    },
  });

  // 6. Create Tables
  const muscatTables = await Promise.all(
    [
      { name: 'Table 01', number: 1, type: TableType.DINE_IN, status: TableStatus.AVAILABLE },
      { name: 'Table 02', number: 2, type: TableType.DINE_IN, status: TableStatus.OCCUPIED },
      { name: 'Table 03', number: 3, type: TableType.DINE_IN, status: TableStatus.OCCUPIED },
      { name: 'Table 04', number: 4, type: TableType.OUTDOOR, status: TableStatus.AVAILABLE },
      { name: 'Car 01', number: 101, type: TableType.CAR_SERVICE, status: TableStatus.RESERVED },
      { name: 'Table 05', number: 5, type: TableType.DINE_IN, status: TableStatus.OUT_OF_SERVICE },
    ].map((table) =>
      prisma.table.create({
        data: {
          cafeId: urbanCafe.id,
          branchId: muscatBranch.id,
          name: table.name,
          number: table.number,
          type: table.type,
          capacity: 4,
          status: table.status,
          isActive: true,
        },
      })
    )
  );

  const azaibaTables = await Promise.all(
    [
      { name: 'Table 11', number: 11, type: TableType.DINE_IN, status: TableStatus.AVAILABLE },
      { name: 'Table 12', number: 12, type: TableType.DINE_IN, status: TableStatus.OCCUPIED },
      { name: 'Outdoor 01', number: 21, type: TableType.OUTDOOR, status: TableStatus.AVAILABLE },
      { name: 'Car 02', number: 102, type: TableType.CAR_SERVICE, status: TableStatus.AVAILABLE },
    ].map((table) =>
      prisma.table.create({
        data: {
          cafeId: urbanCafe.id,
          branchId: azaibaBranch.id,
          name: table.name,
          number: table.number,
          type: table.type,
          capacity: 4,
          status: table.status,
          isActive: true,
        },
      })
    )
  );

  const moujTables = await Promise.all(
    [
      { name: 'Sea View 01', number: 1, type: TableType.DINE_IN, status: TableStatus.AVAILABLE },
      { name: 'Sea View 02', number: 2, type: TableType.OUTDOOR, status: TableStatus.AVAILABLE },
    ].map((table) =>
      prisma.table.create({
        data: {
          cafeId: coastalCafe.id,
          branchId: moujBranch.id,
          name: table.name,
          number: table.number,
          type: table.type,
          capacity: 4,
          status: table.status,
          isActive: true,
        },
      })
    )
  );

  // 7. Create QR Codes
  await Promise.all(
    [...muscatTables, ...azaibaTables, ...moujTables].map((table) =>
      prisma.qRCode.create({
        data: {
          cafeId: table.cafeId,
          branchId: table.branchId,
          tableId: table.id,
          code: `QR-${table.branchId.slice(-4)}-${table.number}`,
          url: `https://cafeqr.app/menu/${table.id}`,
          isActive: true,
        },
      })
    )
  );

  // 8. Create Categories
  const hotDrinksCategory = await prisma.category.create({
    data: {
      cafeId: urbanCafe.id,
      name: 'Hot Drinks',
      description: 'Espresso-based hot drinks and specialty coffee.',
      sortOrder: 1,
      status: CategoryStatus.ACTIVE,
    },
  });

  const coldDrinksCategory = await prisma.category.create({
    data: {
      cafeId: urbanCafe.id,
      name: 'Cold Drinks',
      description: 'Iced coffee, mojitos, and refreshing beverages.',
      sortOrder: 2,
      status: CategoryStatus.ACTIVE,
    },
  });

  const dessertsCategory = await prisma.category.create({
    data: {
      cafeId: urbanCafe.id,
      name: 'Desserts',
      description: 'Signature desserts and baked items.',
      sortOrder: 3,
      status: CategoryStatus.ACTIVE,
    },
  });

  // 9. Create Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        cafeId: urbanCafe.id,
        categoryId: hotDrinksCategory.id,
        name: 'Spanish Latte',
        slug: 'spanish-latte',
        description: 'Creamy espresso drink with condensed milk.',
        imageUrl: 'https://picsum.photos/seed/latte/400/400',
        price: omr(2.8),
        comparePrice: omr(3.2),
        sku: 'UB-SL-001',
        status: ProductStatus.ACTIVE,
        isFeatured: true,
        sortOrder: 1,
      },
    }),
    prisma.product.create({
      data: {
        cafeId: urbanCafe.id,
        categoryId: hotDrinksCategory.id,
        name: 'Cappuccino',
        slug: 'cappuccino',
        description: 'Classic cappuccino with rich foam.',
        imageUrl: 'https://picsum.photos/seed/cappuccino/400/400',
        price: omr(2.2),
        sku: 'UB-CP-001',
        status: ProductStatus.ACTIVE,
        isFeatured: false,
        sortOrder: 2,
      },
    }),
    prisma.product.create({
      data: {
        cafeId: urbanCafe.id,
        categoryId: coldDrinksCategory.id,
        name: 'Iced Americano',
        slug: 'iced-americano',
        description: 'Bold and chilled espresso over ice.',
        imageUrl: 'https://picsum.photos/seed/americano/400/400',
        price: omr(2.1),
        sku: 'UB-IA-001',
        status: ProductStatus.ACTIVE,
        isFeatured: true,
        sortOrder: 1,
      },
    }),
    prisma.product.create({
      data: {
        cafeId: urbanCafe.id,
        categoryId: coldDrinksCategory.id,
        name: 'Classic Mojito',
        slug: 'classic-mojito',
        description: 'Refreshing lime and mint mojito.',
        imageUrl: 'https://picsum.photos/seed/mojito/400/400',
        price: omr(2.4),
        sku: 'UB-MJ-001',
        status: ProductStatus.ACTIVE,
        isFeatured: false,
        sortOrder: 2,
      },
    }),
    prisma.product.create({
      data: {
        cafeId: urbanCafe.id,
        categoryId: dessertsCategory.id,
        name: 'Cheesecake',
        slug: 'cheesecake',
        description: 'Creamy baked cheesecake slice.',
        imageUrl: 'https://picsum.photos/seed/cheesecake/400/400',
        price: omr(2.6),
        sku: 'UB-CK-001',
        status: ProductStatus.ACTIVE,
        isFeatured: true,
        sortOrder: 1,
      },
    }),
    prisma.product.create({
      data: {
        cafeId: urbanCafe.id,
        categoryId: dessertsCategory.id,
        name: 'Chocolate Brownie',
        slug: 'chocolate-brownie',
        description: 'Warm chocolate brownie served soft.',
        imageUrl: 'https://picsum.photos/seed/brownie/400/400',
        price: omr(1.9),
        sku: 'UB-BR-001',
        status: ProductStatus.ACTIVE,
        isFeatured: false,
        sortOrder: 2,
      },
    }),
  ]);

  // 10. Loyalty Rules
  await prisma.loyaltyRule.create({
    data: {
      cafeId: urbanCafe.id,
      name: 'Urban Rewards',
      pointsPerOrder: 10,
      pointsPerCurrencyUnit: 1,
      minimumRedeemPoints: 100,
      isActive: true,
    },
  });

  const loyaltyAccount = await prisma.loyaltyAccount.create({
    data: {
      cafeId: urbanCafe.id,
      customerPhone: '+96895550001',
      customerName: 'Mohammed Al Riyami',
      totalPoints: 140,
    },
  });

  // 11. Create Orders
  const [spanishLatte, cappuccino, icedAmericano, classicMojito, cheesecake, brownie] = products;
  const [table01, table02, table03] = muscatTables;
  const [table11, table12] = azaibaTables;

  const ordersSeed = [
    {
      branchId: muscatBranch.id,
      tableId: table02.id,
      createdById: ownerUser.id,
      orderNumber: 1042,
      orderType: OrderType.DINE_IN,
      status: OrderStatus.NEW,
      guestCount: 2,
      subtotal: omr(5.6),
      taxAmount: omr(0.28),
      serviceAmount: omr(0.5),
      discountAmount: omr(0),
      totalAmount: omr(6.38),
      customerName: 'Ahmed',
      customerPhone: '+96893330001',
      notes: 'Less sugar',
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      items: [
        { productId: spanishLatte.id, quantity: 2, unitPrice: omr(2.8), totalPrice: omr(5.6) },
      ],
    },
    {
      branchId: muscatBranch.id,
      tableId: table03.id,
      createdById: managerUser.id,
      orderNumber: 1041,
      orderType: OrderType.CAR_SERVICE,
      status: OrderStatus.PREPARING,
      guestCount: 1,
      subtotal: omr(4.5),
      taxAmount: omr(0.225),
      serviceAmount: omr(0.5),
      discountAmount: omr(0),
      totalAmount: omr(5.225),
      customerName: 'Fatma',
      customerPhone: '+96893330002',
      notes: 'Extra ice',
      createdAt: new Date(Date.now() - 12 * 60 * 1000),
      items: [
        { productId: icedAmericano.id, quantity: 1, unitPrice: omr(2.1), totalPrice: omr(2.1) },
        { productId: cheesecake.id, quantity: 1, unitPrice: omr(2.4), totalPrice: omr(2.4) },
      ],
    },
    {
      branchId: muscatBranch.id,
      tableId: table01.id,
      createdById: ownerUser.id,
      orderNumber: 1040,
      orderType: OrderType.DINE_IN,
      status: OrderStatus.READY,
      guestCount: 3,
      subtotal: omr(7.6),
      taxAmount: omr(0.38),
      serviceAmount: omr(0.5),
      discountAmount: omr(0),
      totalAmount: omr(8.48),
      customerName: 'Yousef',
      customerPhone: '+96893330003',
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
      items: [
        { productId: cappuccino.id, quantity: 2, unitPrice: omr(2.2), totalPrice: omr(4.4) },
        { productId: brownie.id, quantity: 2, unitPrice: omr(1.6), totalPrice: omr(3.2) },
      ],
    },
    {
      branchId: azaibaBranch.id,
      tableId: table12.id,
      createdById: managerUser.id,
      orderNumber: 2031,
      orderType: OrderType.DINE_IN,
      status: OrderStatus.COMPLETED,
      guestCount: 2,
      subtotal: omr(5.2),
      taxAmount: omr(0.26),
      serviceAmount: omr(0.5),
      discountAmount: omr(0.5),
      totalAmount: omr(5.46),
      customerName: 'Salim',
      customerPhone: '+96893330004',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      items: [
        { productId: classicMojito.id, quantity: 1, unitPrice: omr(2.4), totalPrice: omr(2.4) },
        { productId: cheesecake.id, quantity: 1, unitPrice: omr(2.8), totalPrice: omr(2.8) },
      ],
    },
  ];

  for (const orderData of ordersSeed) {
    const order = await prisma.order.create({
      data: {
        cafeId: urbanCafe.id,
        branchId: orderData.branchId,
        tableId: orderData.tableId,
        createdById: orderData.createdById,
        orderNumber: orderData.orderNumber,
        orderType: orderData.orderType,
        status: orderData.status,
        guestCount: orderData.guestCount,
        subtotal: orderData.subtotal,
        taxAmount: orderData.taxAmount,
        serviceAmount: orderData.serviceAmount,
        discountAmount: orderData.discountAmount,
        totalAmount: orderData.totalAmount,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        notes: orderData.notes,
        createdAt: orderData.createdAt,
        items: {
          create: orderData.items,
        },
      },
    });

    if (order.status === OrderStatus.COMPLETED) {
      await prisma.loyaltyLog.create({
        data: {
          cafeId: urbanCafe.id,
          loyaltyAccountId: loyaltyAccount.id,
          orderId: order.id,
          points: 10,
          type: LoyaltyLogType.EARNED,
          note: `Points earned from order #${order.orderNumber}`,
          createdAt: orderData.createdAt,
        },
      });
    }
  }

  console.log('✅ Prisma seed completed successfully');
  console.log('Demo Login: abdullah@urbanbrew.om / Admin@123');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
