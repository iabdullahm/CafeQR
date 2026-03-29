
import { findOne } from '@/modules/cafes/cafes.controller';
import { withAuth } from '@/middleware/auth-helpers';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(req, ['SUPER_ADMIN', 'admin'], async () => {
    return findOne(id);
  });
}
