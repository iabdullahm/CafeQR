/**
 * @fileOverview Dashboard Service handles business logic for platform analytics.
 * This file is currently returning mock data to avoid Prisma initialization errors
 * during the migration to Firestore.
 */

export const dashboardService = {
  /**
   * Fetches high-level platform statistics.
   */
  async getStats() {
    return {
      totalCafes: 5,
      activeSubscriptions: 3,
      expiredSubscriptions: 0,
      monthlyRevenue: 39.000,
      ordersThisMonth: 128,
      newRegistrations: 2
    };
  },

  /**
   * Fetches the most recently registered cafes.
   */
  async getRecentCafes() {
    return [
      { id: '1', name: 'Brew Corner', email: 'brew@example.com', createdAt: new Date().toISOString(), status: 'active' },
      { id: '2', name: 'Qahwa House', email: 'qahwa@example.com', createdAt: new Date().toISOString(), status: 'active' },
    ];
  },

  /**
   * Fetches subscriptions that are nearing their end date.
   */
  async getExpiringSubscriptions() {
    return [];
  },

  /**
   * Fetches revenue data formatted for charting.
   */
  async getRevenueData(period: string) {
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
