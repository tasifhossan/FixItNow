import { z } from 'zod';

const updateTechnicianProfileValidation = z.object({
  body: z.object({
    bio: z.string().optional(),
    hourlyRate: z.number().positive('Hourly rate must be a positive number').optional(),
    skills: z.array(z.string()).optional(),
  }),
});

const toggleAvailabilityValidation = z.object({
  body: z.object({
    isAvailable: z.boolean({
      message: 'isAvailable must be a boolean',
    }),
  }),
});

export const technicianValidation = {
  updateTechnicianProfileValidation,
  toggleAvailabilityValidation,
};
