import { cafeController } from '@/modules/cafes/cafes.controller';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return cafeController.patchStatus(req, { params });
}
