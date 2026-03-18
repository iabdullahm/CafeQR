
import { findAll, create } from '@/modules/cafes/cafes.controller';
import { withAuth } from '@/middleware/auth-helpers';

export async function GET(req: Request) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    return findAll(req);
  });
}

export async function POST(req: Request) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    return create(req);
  });
}
