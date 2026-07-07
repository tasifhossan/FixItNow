import { z } from 'zod';

export const updateProfileValidation = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().min(5, 'Phone number must be at least 5 characters').optional(),
  }),
});

export const changePasswordValidation = z.object({
  body: z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string()
      .min(8, 'New password must be at least 8 characters')
      .refine((val) => /\d/.test(val), {
        message: 'New password must contain at least one number',
      }),
  }),
});
