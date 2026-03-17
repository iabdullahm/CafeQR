
import { loginSchema } from './auth.validation';
import { loginUser, getCurrentUser } from './auth.service';
import { successResponse, errorResponse } from '../../utils/api-response';

/**
 * @fileOverview Auth Controller handles login and current user requests.
 */

export const login = async (req: Request) => {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return errorResponse('Invalid request body', 400);
    }

    // Validate request
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(validationResult.error.errors[0].message, 400);
    }

    // Process login
    const data = await loginUser(validationResult.data);

    return successResponse('Login successful', data);
  } catch (error: any) {
    return errorResponse(error.message || 'Authentication failed', 401);
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
