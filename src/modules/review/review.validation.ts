import { z } from 'zod';

const createReviewValidation = z.object({
  body: z.object({
    bookingId: z.string({
      message: 'Booking ID is required',
    }),
    rating: z
      .number({
        message: 'Rating is required',
      })
      .int('Rating must be an integer')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating must be at most 5'),
    comment: z.string().optional(),
  }),
});

export const reviewValidation = {
  createReviewValidation,
};
