
import { findAll, create } from '@/modules/cafes/cafes.controller';
import { withAuth } from '@/middleware/auth-helpers';

export async function GET(req: Request) {
  return withAuth(req, ['super_admin', 'admin'], async () => {
    return findAll(req);
  });
}

export async function POST(req: Request) {
  return withAuth(req, ['super_admin'], async () => {
    return create(req);
  });
}
