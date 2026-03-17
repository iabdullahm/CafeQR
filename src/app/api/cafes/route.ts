import { cafeController } from '@/modules/cafes/cafes.controller';

export async function GET(req: Request) {
  return cafeController.getAll(req);
}

export async function POST(req: Request) {
  return cafeController.create(req);
}
