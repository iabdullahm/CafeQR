import { authController } from '@/modules/auth/auth.controller';

export async function POST() {
  return authController.logout();
}
