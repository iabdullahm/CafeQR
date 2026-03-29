import { changeStatus } from '@/modules/cafes/cafes.controller';
import { withAuth } from '@/middleware/auth-helpers';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(req, ['SUPER_ADMIN', 'admin'], async () => {
    return changeStatus(id, req);
  });
}
