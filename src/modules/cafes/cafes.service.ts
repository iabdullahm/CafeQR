
import prisma from '../../config/prisma';

export const getAllCafes = async (query: any) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const skip = (page - 1) * limit;

  const where: any = {
    deletedAt: null,
    ...(query.search
      ? {
          name: {
            contains: query.search,
            mode: 'insensitive'
          }
        }
      : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.city ? { city: query.city } : {})
  };

  const [items, total] = await Promise.all([
    prisma.cafe.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        owner: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true }
        }
      }
    }),
    prisma.cafe.count({ where })
  ]);

  return {
    items: items.map((c: any) => ({
      ...c,
      id: String(c.id),
      owner_name: c.owner?.fullName || 'N/A',
      plan_name: c.subscriptions[0]?.plan?.name || 'N/A',
      subscription_end_date: c.subscriptions[0]?.endDate?.toISOString().split('T')[0] || 'N/A'
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getCafeById = async (id: string) => {
  const cafe = await prisma.cafe.findUnique({
    where: { id: BigInt(id) },
    include: {
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { plan: true }
      },
      branches: true,
      tables: true,
      orders: true
    }
  });

  if (!cafe) return null;

  return {
    ...cafe,
    id: String(cafe.id),
    subscriptions: cafe.subscriptions.map((s: any) => ({ ...s, id: String(s.id) })),
    branches_count: cafe.branches.length,
    tables_count: cafe.tables.length,
    orders_count: cafe.orders.length
  };
};

export const createCafe = async (payload: any) => {
  return prisma.cafe.create({
    data: {
      cafeCode: `CAF-${Date.now()}`,
      ...payload,
      joinedAt: new Date()
    }
  });
};

export const updateCafeStatus = async (id: string, status: string) => {
  return prisma.cafe.update({
    where: { id: BigInt(id) },
    data: { status }
  });
};
