
import { login } from '@/modules/auth/auth.controller';

export async function POST(req: Request) {
  return login(req);
}
