import { z } from 'zod';

const initiatePaymentValidation = z.object({
  body: z.object({
    bookingId: z.string({
      message: 'Booking ID is required',
    }),
  }),
});

export const paymentValidation = {
  initiatePaymentValidation,
};
