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

const respondToBookingValidation = z.object({
  body: z.object({
    action: z.enum(['ACCEPT', 'DECLINE'], {
      message: 'Action must be either ACCEPT or DECLINE',
    }),
  }),
});

const updateBookingStatusValidation = z.object({
  body: z.object({
    status: z.enum(['IN_PROGRESS', 'COMPLETED'], {
      message: 'Status is required',
    }),
  }),
});

export const bookingValidation = {
  createBookingValidation,
  respondToBookingValidation,
  updateBookingStatusValidation,
};
