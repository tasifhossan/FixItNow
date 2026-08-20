import AppError from '../../errors/AppError.js';
import { prisma } from '../../shared/prisma.js';
import type { Prisma } from '@prisma/client';
import { toDhakaTime } from '../../utils/date.js';

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isBlocked: true,
  createdAt: true,
  updatedAt: true,
};

function getSlotsForDay(startTimeStr: string, endTimeStr: string, durationMinutes: number = 60): string[] {
  const slots: string[] = [];
  const startParts = startTimeStr.split(':');
  const endParts = endTimeStr.split(':');
  const startH = Number(startParts[0] ?? 0);
  const startM = Number(startParts[1] ?? 0);
  const endH = Number(endParts[0] ?? 0);
  const endM = Number(endParts[1] ?? 0);
  
  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  while (currentMinutes + durationMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    currentMinutes += durationMinutes;
  }
  return slots;
}

const createBooking = async (
  customerId: string,
  payload: {
    technicianId: string;
    serviceId: string;
    scheduledDate: string;
    address: string;
    notes?: string;
  }
) => {
  // 1. Verify technicianId exists AND isVerified AND isAvailable
  const technician = await prisma.technicianProfile.findUnique({
    where: { id: payload.technicianId },
    include: {
      services: true,
    },
  });

  if (!technician) {
    throw new AppError(404, 'Technician profile not found');
  }

  if (!technician.isVerified) {
    throw new AppError(400, 'Technician is not verified');
  }

  if (!technician.isAvailable) {
    throw new AppError(400, 'Technician is not available');
  }

  // 1a. Verify working hours for scheduledDate exist and the requested time is a valid slot (Asia/Dhaka local time)
  const reqDate = new Date(payload.scheduledDate);
  const dhakaDate = toDhakaTime(reqDate);
  const dayOfWeek = dhakaDate.getUTCDay();
  const reqHours = dhakaDate.getUTCHours();
  const reqMinutes = dhakaDate.getUTCMinutes();
  const reqTimeStr = `${String(reqHours).padStart(2, '0')}:${String(reqMinutes).padStart(2, '0')}`;

  const workingHours = await prisma.workingHours.findUnique({
    where: {
      technicianProfileId_dayOfWeek: {
        technicianProfileId: payload.technicianId,
        dayOfWeek,
      },
    },
  });

  if (!workingHours) {
    throw new AppError(400, 'Technician does not have working hours configured for this day');
  }

  const allSlots = getSlotsForDay(workingHours.startTime, workingHours.endTime, 60);
  if (!allSlots.includes(reqTimeStr)) {
    throw new AppError(400, 'Requested booking time is not a valid 60-minute time slot for this technician');
  }

  // 1b. Verify no conflict/overlap with an existing active booking
  const conflictBooking = await prisma.booking.findFirst({
    where: {
      technicianId: payload.technicianId,
      scheduledDate: reqDate,
      status: {
        notIn: ['CANCELLED', 'DECLINED'],
      },
    },
  });

  if (conflictBooking) {
    throw new AppError(400, 'This slot is already booked for this technician');
  }

  // 2. Verify serviceId exists
  const service = await prisma.service.findUnique({
    where: { id: payload.serviceId },
  });

  if (!service) {
    throw new AppError(404, 'Service not found');
  }

  // 3. Verify the technician actually offers this service
  const offersService = technician.services.some(
    (s) => s.id === payload.serviceId
  );
  if (!offersService) {
    throw new AppError(400, 'Technician does not offer this service');
  }

  // 4. Create booking with status REQUESTED and service.basePrice as totalAmount
  const result = await prisma.booking.create({
    data: {
      customerId,
      technicianId: payload.technicianId,
      serviceId: payload.serviceId,
      scheduledDate: new Date(payload.scheduledDate),
      address: payload.address,
      notes: payload.notes ?? null,
      totalAmount: service.basePrice,
      status: 'REQUESTED',
    },
    include: {
      service: true,
      technician: {
        include: {
          user: {
            select: userSelect,
          },
        },
      },
    },
  });

  return result;
};

const getMyBookingsAsCustomer = async (
  customerId: string,
  query: {
    status?: string;
    page?: string | number;
    limit?: string | number;
  }
) => {
  const { status, page = 1, limit = 10 } = query;
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 10;
  const skip = (parsedPage - 1) * parsedLimit;

  const whereConditions: Prisma.BookingWhereInput = {
    customerId,
  };

  if (status) {
    whereConditions.status = status as any;
  }

  const [total, result] = await prisma.$transaction([
    prisma.booking.count({ where: whereConditions }),
    prisma.booking.findMany({
      where: whereConditions,
      skip,
      take: parsedLimit,
      include: {
        service: true,
        technician: {
          include: {
            user: {
              select: userSelect,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  return {
    meta: {
      page: parsedPage,
      limit: parsedLimit,
      total,
    },
    data: result,
  };
};

const getMyBookingsAsTechnician = async (
  userId: string,
  query: {
    status?: string;
    page?: string | number;
    limit?: string | number;
  }
) => {
  // First resolve technicianProfile.id from the userId
  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!technicianProfile) {
    throw new AppError(404, 'Technician profile not found');
  }

  const technicianId = technicianProfile.id;

  const { status, page = 1, limit = 10 } = query;
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 10;
  const skip = (parsedPage - 1) * parsedLimit;

  const whereConditions: Prisma.BookingWhereInput = {
    technicianId,
  };

  if (status) {
    whereConditions.status = status as any;
  }

  const [total, result] = await prisma.$transaction([
    prisma.booking.count({ where: whereConditions }),
    prisma.booking.findMany({
      where: whereConditions,
      skip,
      take: parsedLimit,
      include: {
        service: true,
        customer: {
          select: userSelect,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  return {
    meta: {
      page: parsedPage,
      limit: parsedLimit,
      total,
    },
    data: result,
  };
};

const getBookingById = async (
  id: string,
  requesterId: string,
  requesterRole: string
) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      service: true,
      technician: {
        include: {
          user: {
            select: userSelect,
          },
        },
      },
      customer: {
        select: userSelect,
      },
      payment: true,
      review: true,
    },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  // Permission check
  const isCustomer = booking.customerId === requesterId;
  const isTechnician = booking.technician.userId === requesterId;
  const isAdmin = requesterRole === 'ADMIN';

  if (!isCustomer && !isTechnician && !isAdmin) {
    throw new AppError(403, 'You do not have permission to view this booking');
  }

  return booking;
};

const respondToBooking = async (
  userId: string,
  bookingId: string,
  action: 'ACCEPT' | 'DECLINE'
) => {
  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!technicianProfile) {
    throw new AppError(404, 'Technician profile not found');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  if (booking.technicianId !== technicianProfile.id) {
    throw new AppError(403, 'You do not have permission to respond to this booking');
  }

  if (booking.status !== 'REQUESTED') {
    throw new AppError(400, 'Booking is not in REQUESTED status');
  }

  const updatedStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';

  const result = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: updatedStatus },
    include: {
      service: true,
      technician: {
        include: {
          user: {
            select: userSelect,
          },
        },
      },
      customer: {
        select: userSelect,
      },
      payment: true,
      review: true,
    },
  });

  return result;
};

const updateBookingStatus = async (
  userId: string,
  bookingId: string,
  newStatus: 'IN_PROGRESS' | 'COMPLETED'
) => {
  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!technicianProfile) {
    throw new AppError(404, 'Technician profile not found');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  if (booking.technicianId !== technicianProfile.id) {
    throw new AppError(403, 'You do not have permission to update this booking');
  }

  if (newStatus === 'IN_PROGRESS' && booking.status !== 'PAID') {
    throw new AppError(
      400,
      `Invalid transition. Cannot change status from ${booking.status} to IN_PROGRESS. Only PAID bookings can be started.`
    );
  }

  if (newStatus === 'COMPLETED' && booking.status !== 'IN_PROGRESS') {
    throw new AppError(
      400,
      `Invalid transition. Cannot change status from ${booking.status} to COMPLETED. Only IN_PROGRESS bookings can be completed.`
    );
  }

  const result = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: newStatus },
    include: {
      service: true,
      technician: {
        include: {
          user: {
            select: userSelect,
          },
        },
      },
      customer: {
        select: userSelect,
      },
      payment: true,
      review: true,
    },
  });

  return result;
};

const cancelBooking = async (
  userId: string,
  userRole: string,
  bookingId: string
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  const isCustomer = booking.customerId === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isCustomer && !isAdmin) {
    throw new AppError(403, 'You do not have permission to cancel this booking');
  }

  if (booking.status !== 'REQUESTED' && booking.status !== 'ACCEPTED') {
    throw new AppError(
      400,
      `Cannot cancel booking because it is already in ${booking.status} status`
    );
  }

  const result = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED' },
    include: {
      service: true,
      technician: {
        include: {
          user: {
            select: userSelect,
          },
        },
      },
      customer: {
        select: userSelect,
      },
      payment: true,
      review: true,
    },
  });

  return result;
};

export const bookingService = {
  createBooking,
  getMyBookingsAsCustomer,
  getMyBookingsAsTechnician,
  getBookingById,
  respondToBooking,
  updateBookingStatus,
  cancelBooking,
};
