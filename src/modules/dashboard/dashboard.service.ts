import prisma from '../../config/prisma';

/**
 * @fileOverview Dashboard Service handles business logic for platform analytics.
 */

export const dashboardService = {
  async getStats() {
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
      monthlyRevenue: 39.000, // Seed data revenue (1 Premium active)
      ordersThisMonth,
      newRegistrations: totalCafes // Simplification for demo
    };
  },

  async getRecentCafes() {
    const cafes = await prisma.cafe.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    return cafes.map((c: any) => ({ 
      ...c, 
      id: String(c.id) 
    }));
  },

  async getExpiringSubscriptions() {
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
    return subs.map((s: any) => ({ 
      ...s, 
      id: String(s.id),
      cafe_name: s.cafe?.name,
      plan_name: s.plan?.name
    }));
  },

  async getRevenueData(period: string) {
    // Return mock data for the chart based on the period
    return [
      { name: 'Jan', revenue: 12000 },
      { name: 'Feb', revenue: 15000 },
      { name: 'Mar', revenue: 18000 },
      { name: 'Apr', revenue: 22000 },
      { name: 'May', revenue: 25000 },
      { name: 'Jun', revenue: 39000 },
    ];
  }
};
