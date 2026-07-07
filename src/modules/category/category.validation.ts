import { z } from 'zod';

const createCategoryValidation = z.object({
  body: z.object({
    name: z.string({
      message: 'Name is required',
    }).min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
  }),
});

const updateCategoryValidation = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    description: z.string().optional(),
  }),
});

export const categoryValidation = {
  createCategoryValidation,
  updateCategoryValidation,
};
