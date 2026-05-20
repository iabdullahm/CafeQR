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
      totalCafes: 0,
      activeSubscriptions: 0,
      expiredSubscriptions: 0,
      monthlyRevenue: 0,
      ordersThisMonth: 0,
      newRegistrations: 0
    };
  },

  /**
   * Fetches the most recently registered cafes.
   */
  async getRecentCafes() {
    return [];
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
    return [];
  }
};

