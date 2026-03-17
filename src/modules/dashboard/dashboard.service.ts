
import prisma from '../../config/prisma';

export const getDashboardStats = async () => {
  const [
    totalCafes,
    activeSubscriptions,
    expiredSubscriptions,
    ordersThisMonth
  ] = await Promise.all([
    prisma.cafe.count({
      where: { deletedAt: null }
    }),
    prisma.subscription.count({
      where: { status: 'active' }
    }),
    prisma.subscription.count({
      where: { status: 'expired' }
    }),
    prisma.order.count()
  ]);

  return {
    totalCafes,
    activeSubscriptions,
    expiredSubscriptions,
    monthlyRevenue: 540.000,
    ordersThisMonth,
    newRegistrations: 6
  };
};

export const getRecentCafes = async () => {
  const cafes = await prisma.cafe.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  return cafes.map((c: any) => ({ ...c, id: String(c.id) }));
};

export const getExpiringSubscriptions = async () => {
  const subs = await prisma.subscription.findMany({
    where: {
      status: 'active'
    },
    orderBy: {
      endDate: 'asc'
    },
    take: 5,
    include: {
      cafe: true,
      plan: true
    }
  });
  return subs.map((s: any) => ({ ...s, id: String(s.id) }));
};
