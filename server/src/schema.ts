
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Image schema
export const imageSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  filename: z.string(),
  file_path: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
  short_url: z.string(),
  view_count: z.number(),
  is_public: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Image = z.infer<typeof imageSchema>;

// Input schemas for user operations
export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Input schemas for image operations
export const uploadImageInputSchema = z.object({
  user_id: z.number(),
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  filename: z.string(),
  file_path: z.string(),
  file_size: z.number().positive(),
  mime_type: z.string(),
  is_public: z.boolean().default(true)
});

export type UploadImageInput = z.infer<typeof uploadImageInputSchema>;

export const updateImageInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  is_public: z.boolean().optional()
});

export type UpdateImageInput = z.infer<typeof updateImageInputSchema>;

export const getImageByShortUrlInputSchema = z.object({
  short_url: z.string()
});

export type GetImageByShortUrlInput = z.infer<typeof getImageByShortUrlInputSchema>;

export const getUserImagesInputSchema = z.object({
  user_id: z.number()
});

export type GetUserImagesInput = z.infer<typeof getUserImagesInputSchema>;

export const deleteImageInputSchema = z.object({
  id: z.number(),
  user_id: z.number() // For authorization - only owner can delete
});

export type DeleteImageInput = z.infer<typeof deleteImageInputSchema>;
