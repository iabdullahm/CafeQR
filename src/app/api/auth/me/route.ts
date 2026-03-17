
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { authService } from '@/services/auth-service';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const user = await authService.getCurrentUser(payload);
  return NextResponse.json(user);
}
