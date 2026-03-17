import { loginSchema } from './auth.validation';
import { loginUser, getCurrentUser } from './auth.service';
import { successResponse, errorResponse } from '../../utils/api-response';

/**
 * @fileOverview Auth Controller handles login and current user requests.
 */

export const login = async (req: Request) => {
  try {
    const body = await req.json();
    const validatedData = loginSchema.parse(body);
    const data = await loginUser(validatedData);

    return successResponse('Login successful', data);
  } catch (error: any) {
    return errorResponse(error.message || 'Login failed', 401);
  }
};

export const me = async (userId: string) => {
  try {
    const data = await getCurrentUser(userId);
    return successResponse('User fetched successfully', data);
  } catch (error: any) {
    return errorResponse(error.message || 'Fetch failed', 400);
  }
};
