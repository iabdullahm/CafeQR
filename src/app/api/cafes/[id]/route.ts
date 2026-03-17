
import { findOne } from '@/modules/cafes/cafes.controller';
import { withAuth } from '@/middleware/auth-helpers';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
  return withAuth(req, ['super_admin', 'admin'], async () => {
    return findOne(id);
  });
}
