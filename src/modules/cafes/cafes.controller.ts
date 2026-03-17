
import { successResponse, errorResponse } from '../../utils/api-response';
import {
  getAllCafes,
  getCafeById,
  createCafe,
  updateCafeStatus
} from './cafes.service';
import { createCafeSchema, updateCafeStatusSchema } from './cafes.validation';

export const findAll = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams.entries());
  const data = await getAllCafes(query);
  return successResponse('Cafes fetched successfully', data);
};

export const findOne = async (id: string) => {
  const data = await getCafeById(id);
  if (!data) return errorResponse('Cafe not found', 404);
  return successResponse('Cafe fetched successfully', data);
};

export const create = async (req: Request) => {
  try {
    const body = await req.json();
    const validatedData = createCafeSchema.parse(body);
    const data = await createCafe(validatedData);
    return successResponse('Cafe created successfully', data, 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Creation failed', 400);
  }
};

export const changeStatus = async (id: string, req: Request) => {
  try {
    const body = await req.json();
    const validatedData = updateCafeStatusSchema.parse(body);
    const data = await updateCafeStatus(id, validatedData.status);
    return successResponse('Cafe status updated successfully', data);
  } catch (error: any) {
    return errorResponse(error.message || 'Update failed', 400);
  }
};
