import { z } from 'zod';

// Snippet validation schemas
export const createSnippetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  code: z.string().min(1, 'Code is required'),
  language: z.string().max(50, 'Language must be less than 50 characters').optional(),
  collection_id: z.string().uuid('Invalid collection ID').optional().nullable(),
  tags: z.array(z.string().uuid('Invalid tag ID')).optional(),
  is_public: z.boolean().optional(),
});

export const updateSnippetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  code: z.string().min(1, 'Code is required').optional(),
  language: z.string().max(50, 'Language must be less than 50 characters').optional(),
  collection_id: z.string().uuid('Invalid collection ID').optional().nullable(),
  tags: z.array(z.string().uuid('Invalid tag ID')).optional(),
  is_public: z.boolean().optional(),
});

export const paginationSchema = z.object({
  page: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(1).default(1)
  ),
  limit: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(1).max(100).default(20)
  ),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export type CreateSnippetInput = z.infer<typeof createSnippetSchema>;
export type UpdateSnippetInput = z.infer<typeof updateSnippetSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
