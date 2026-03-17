import { NextResponse } from 'next/server';
import { dashboardService } from './dashboard.service';
import { getAuthorizedUser, unauthorizedResponse, forbiddenResponse } from '@/middleware/auth-helpers';

/**
 * @fileOverview Dashboard Controller manages HTTP request/response for analytics routes.
 */

export class DashboardController {
  async getStats(req: Request) {
    const user = getAuthorizedUser(req);
    if (!user) return unauthorizedResponse();
    if (!['super_admin', 'admin', 'support', 'finance', 'sales'].includes(user.role)) return forbiddenResponse();

    const stats = await dashboardService.getStats();
    return NextResponse.json({
      success: true,
      data: stats
    });
  }

  async getRecentCafes(req: Request) {
    const user = getAuthorizedUser(req);
    if (!user) return unauthorizedResponse();
    if (!['super_admin', 'admin', 'sales'].includes(user.role)) return forbiddenResponse();
    
    const recent = await dashboardService.getRecentCafes();
    return NextResponse.json({
      success: true,
      data: recent
    });
  }

  async getExpiringSubscriptions(req: Request) {
    const user = getAuthorizedUser(req);
    if (!user) return unauthorizedResponse();
    if (!['super_admin', 'admin', 'finance', 'sales'].includes(user.role)) return forbiddenResponse();

    const expiring = await dashboardService.getExpiringSubscriptions();
    return NextResponse.json({
      success: true,
      data: expiring
    });
  }

  async getRevenueData(req: Request) {
    const user = getAuthorizedUser(req);
    if (!user) return unauthorizedResponse();
    if (!['super_admin', 'admin', 'finance'].includes(user.role)) return forbiddenResponse();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'monthly';

    const data = await dashboardService.getRevenueData(period);
    return NextResponse.json({
      success: true,
      data: data
    });
  }
}

export const dashboardController = new DashboardController();
