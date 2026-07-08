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

const assignServicesValidation = z.object({
  body: z.object({
    serviceIds: z
      .array(z.string())
      .min(1, 'At least one service ID is required'),
  }),
});

export const technicianValidation = {
  updateTechnicianProfileValidation,
  toggleAvailabilityValidation,
  assignServicesValidation,
};
