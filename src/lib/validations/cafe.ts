
import { z } from 'zod';

export const cafeCreateSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  cafe_code: z.string().min(3, 'Code is too short'),
  slug: z.string().min(2, 'Slug is too short'),
  city: z.string().min(2, 'City is required'),
  owner_user_id: z.string().optional(),
  status: z.enum(['active', 'trial', 'expired', 'suspended', 'pending', 'archived']).optional(),
});

export const cafeUpdateSchema = cafeCreateSchema.partial();

export const cafeStatusSchema = z.object({
  status: z.enum(['active', 'trial', 'expired', 'suspended', 'pending', 'archived']),
});
