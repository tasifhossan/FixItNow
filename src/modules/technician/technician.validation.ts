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

const updateWorkingHoursValidation = z.object({
  body: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
    })
  ).refine(
    (arr) => {
      const days = arr.map(item => item.dayOfWeek);
      return new Set(days).size === days.length;
    },
    { message: 'Duplicate dayOfWeek is not allowed' }
  ).refine(
    (arr) => arr.every(item => item.startTime < item.endTime),
    { message: 'startTime must be before endTime' }
  )
});

export const technicianValidation = {
  updateTechnicianProfileValidation,
  toggleAvailabilityValidation,
  assignServicesValidation,
  updateWorkingHoursValidation,
};
