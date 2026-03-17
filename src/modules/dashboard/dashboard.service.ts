/**
 * @fileOverview Dashboard Service handles platform-wide metrics and analytics.
 */

export class DashboardService {
  async getStats() {
    return {
      totalCafes: 1240,
      activeSubs: 1150,
      expiredSubs: 45,
      monthlyRevenue: 52430,
      totalOrders: 84200,
      totalCustomers: 125000,
      qrScansToday: 12402,
      newRegistrations: 24
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

  async getRevenueData() {
    return [
      { name: 'Jan', revenue: 32000 },
      { name: 'Feb', revenue: 35000 },
      { name: 'Mar', revenue: 42000 },
      { name: 'Apr', revenue: 45000 },
      { name: 'May', revenue: 48000 },
      { name: 'Jun', revenue: 52430 },
    ];
  }
}

export const dashboardService = new DashboardService();
