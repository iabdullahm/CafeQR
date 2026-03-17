
import { me } from '@/modules/auth/auth.controller';
import { withAuth } from '@/middleware/auth-helpers';

export async function GET(req: Request) {
  return withAuth(req, null, async (user) => {
    return me(user.sub);
  });
}
