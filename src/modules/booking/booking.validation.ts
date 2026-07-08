import { z } from 'zod';

const createBookingValidation = z.object({
  body: z.object({
    technicianId: z.string({
      message: 'Technician ID is required',
    }),
    serviceId: z.string({
      message: 'Service ID is required',
    }),
    scheduledDate: z
      .string({
        message: 'Scheduled date is required',
      })
      .datetime({ message: 'Invalid ISO date string' })
      .refine((val) => new Date(val) > new Date(), {
        message: 'Scheduled date must be in the future',
      }),
    address: z
      .string({
        message: 'Address is required',
      })
      .min(5, 'Address must be at least 5 characters long'),
    notes: z.string().optional(),
  }),
});

export const bookingValidation = {
  createBookingValidation,
};
