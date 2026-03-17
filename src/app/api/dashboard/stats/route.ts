
import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard-service';

export async function GET() {
  const stats = await dashboardService.getStats();
  return NextResponse.json(stats);
}
