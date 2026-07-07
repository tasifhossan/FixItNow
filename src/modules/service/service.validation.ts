import { z } from 'zod';

const createServiceValidation = z.object({
  body: z.object({
    name: z.string({
      message: 'Name is required and must be a string',
    }).min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    categoryId: z.string({
      message: 'categoryId is required and must be a string',
    }),
    basePrice: z.number({
      message: 'basePrice is required and must be a number',
    }).positive('basePrice must be a positive number'),
  }),
});

const updateServiceValidation = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    basePrice: z.number().positive('basePrice must be a positive number').optional(),
  }),
});

export const serviceValidation = {
  createServiceValidation,
  updateServiceValidation,
};
