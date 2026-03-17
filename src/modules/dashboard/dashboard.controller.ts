import { NextResponse } from 'next/server';
import { dashboardService } from './dashboard.service';
import { withRole } from '@/middleware/auth-helpers';

/**
 * @fileOverview Dashboard Controller manages HTTP request/response for analytics routes.
 * Access restricted to super_admin and admin roles.
 */

export class DashboardController {
  async getStats(req: Request) {
    return withRole(req, ['super_admin', 'admin'], async () => {
      const stats = await dashboardService.getStats();
      return NextResponse.json({
        success: true,
        data: stats
      });
    });
  }

  async getRecentCafes(req: Request) {
    return withRole(req, ['super_admin', 'admin'], async () => {
      const recent = await dashboardService.getRecentCafes();
      return NextResponse.json({
        success: true,
        data: recent
      });
    });
  }

  async getExpiringSubscriptions(req: Request) {
    return withRole(req, ['super_admin', 'admin'], async () => {
      const expiring = await dashboardService.getExpiringSubscriptions();
      return NextResponse.json({
        success: true,
        data: expiring
      });
    });
  }

  async getRevenueData(req: Request) {
    return withRole(req, ['super_admin', 'admin'], async () => {
      const { searchParams } = new URL(req.url);
      const period = searchParams.get('period') || 'monthly';
      const data = await dashboardService.getRevenueData(period);
      return NextResponse.json({
        success: true,
        data: data
      });
    });
  }
}

export const dashboardController = new DashboardController();
