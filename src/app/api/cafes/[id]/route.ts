import { cafeController } from '@/modules/cafes/cafes.controller';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  return cafeController.getById(req, { params });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return cafeController.update(req, { params });
}
