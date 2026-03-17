/**
 * @fileOverview Dashboard Service handles platform-wide metrics and analytics.
 */

export class DashboardService {
  async getStats() {
    return {
      totalCafes: 24,
      activeSubscriptions: 18,
      expiredSubscriptions: 3,
      monthlyRevenue: 540.000,
      ordersThisMonth: 1280,
      newRegistrations: 6
    };
  }

  async getRecentCafes() {
    return [
      { name: "Coffee Haven", status: "active", plan: "Premium", joinDate: "2024-03-10" },
      { name: "The Bean Sprout", status: "active", plan: "Basic", joinDate: "2024-03-09" },
      { name: "Rustic Roast", status: "suspended", plan: "Pro", joinDate: "2024-03-08" }
    ];
  }

  async getExpiringSubscriptions() {
    return [
      { cafe: "Green Leaf Cafe", plan: "Pro", expiry: "In 2 days", amount: 49.000 },
      { cafe: "Mocha Magic", plan: "Premium", expiry: "In 5 days", amount: 99.000 }
    ];
  }

  async getRevenueData(period: string = 'monthly') {
    // Mocking revenue data based on period
    return [
      { name: 'Jan', revenue: 320.000 },
      { name: 'Feb', revenue: 350.000 },
      { name: 'Mar', revenue: 420.000 },
      { name: 'Apr', revenue: 450.000 },
      { name: 'May', revenue: 480.000 },
      { name: 'Jun', revenue: 540.000 },
    ];
  }
}

export const dashboardService = new DashboardService();
