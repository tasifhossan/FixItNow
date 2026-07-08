import AppError from '../../errors/AppError.js';
import { prisma } from '../../shared/prisma.js';
import type { Prisma } from '../../../generated/prisma/client.js';

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

export const bookingService = {
  createBooking,
  getMyBookingsAsCustomer,
  getMyBookingsAsTechnician,
  getBookingById,
  respondToBooking,
};
