import { z } from 'zod';

/**
 * @fileOverview Validation schemas for cafe-related requests.
 */

export const createCafeSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  slug: z.string().min(2, 'Slug is too short'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  country: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  owner_user_id: z.string().optional(),
  status: z.enum(['active', 'trial', 'expired', 'suspended', 'pending', 'archived']).optional(),
});

export const updateCafeStatusSchema = z.object({
  status: z.enum(['active', 'trial', 'expired', 'suspended', 'pending', 'archived']),
});

export type CreateCafeInput = z.infer<typeof createCafeSchema>;
export type UpdateCafeStatusInput = z.infer<typeof updateCafeStatusSchema>;
