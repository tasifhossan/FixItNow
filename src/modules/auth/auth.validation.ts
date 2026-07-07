import { z } from 'zod';

export const registerValidation = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .refine((val) => /\d/.test(val), {
        message: 'Password must contain at least one number',
      }),
    phone: z.string().min(5, 'Phone number must be at least 5 characters'),
    role: z.enum(['CUSTOMER', 'TECHNICIAN']),
  }),
});

export const loginValidation = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});
