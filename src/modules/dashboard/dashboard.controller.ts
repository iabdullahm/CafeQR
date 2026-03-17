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
    if (!['super_admin', 'admin'].includes(user.role)) return forbiddenResponse();

    const stats = await dashboardService.getStats();
    return NextResponse.json(stats);
  }

  async getRecentCafes(req: Request) {
    const user = getAuthorizedUser(req);
    if (!user) return unauthorizedResponse();
    
    const recent = await dashboardService.getRecentCafes();
    return NextResponse.json(recent);
  }

  async getRevenueData(req: Request) {
    const user = getAuthorizedUser(req);
    if (!user) return unauthorizedResponse();

    const data = await dashboardService.getRevenueData();
    return NextResponse.json(data);
  }
}

export const dashboardController = new DashboardController();
