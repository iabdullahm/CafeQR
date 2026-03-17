import { dashboardController } from '@/modules/dashboard/dashboard.controller';

export async function GET(req: Request) {
  return dashboardController.getExpiringSubscriptions(req);
}
