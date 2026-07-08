import AppError from '../../errors/AppError.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import { prisma } from '../../shared/prisma.js';

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

const getDashboardStats = async () => {
  const [
    totalUsers,
    totalCustomers,
    totalTechnicians,
    totalBookings,
    statusGroups,
    revenueAggregation,
    totalVerifiedTechnicians,
    totalCategories,
    totalServices,
    rawRecentBookings,
  ] = await Promise.all([
    // Counts of users by role and total
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'TECHNICIAN' } }),
    
    // Booking counts
    prisma.booking.count(),
    
    // Group bookings by status
    prisma.booking.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    }),
    
    // Total revenue from paid payments
    prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: 'PAID',
      },
    }),
    
    // Verified technicians count
    prisma.technicianProfile.count({
      where: {
        isVerified: true,
      },
    }),
    
    // Categories and Services counts
    prisma.category.count(),
    prisma.service.count(),
    
    // Recent 5 bookings
    prisma.booking.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        technician: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  // Format bookingsByStatus as an object mapping status to its count
  const bookingsByStatus = {
    REQUESTED: 0,
    ACCEPTED: 0,
    DECLINED: 0,
    PAID: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  statusGroups.forEach((group) => {
    if (group.status in bookingsByStatus) {
      bookingsByStatus[group.status as keyof typeof bookingsByStatus] = group._count.id;
    }
  });

  const totalRevenue = revenueAggregation._sum.amount || 0;

  // Map raw recent bookings to clean objects
  const recentBookings = rawRecentBookings.map((booking) => ({
    id: booking.id,
    customerName: booking.customer.name,
    technicianName: booking.technician.user.name,
    serviceName: booking.service.name,
    status: booking.status,
    createdAt: booking.createdAt,
  }));

  return {
    totalUsers,
    totalCustomers,
    totalTechnicians,
    totalBookings,
    bookingsByStatus,
    totalRevenue,
    totalVerifiedTechnicians,
    totalCategories,
    totalServices,
    recentBookings,
  };
};

const getAllBookingsAdmin = async (query: {
  status?: string;
  customerId?: string;
  technicianId?: string;
  page?: string | number;
  limit?: string | number;
}) => {
  const { status, customerId, technicianId, page = 1, limit = 10 } = query;
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 10;
  const skip = (parsedPage - 1) * parsedLimit;

  const whereConditions: Prisma.BookingWhereInput = {};

  if (status) {
    whereConditions.status = status as any;
  }
  if (customerId) {
    whereConditions.customerId = customerId;
  }
  if (technicianId) {
    whereConditions.technicianId = technicianId;
  }

  const [total, result] = await prisma.$transaction([
    prisma.booking.count({ where: whereConditions }),
    prisma.booking.findMany({
      where: whereConditions,
      skip,
      take: parsedLimit,
      include: {
        customer: {
          select: userSelect,
        },
        technician: {
          include: {
            user: {
              select: userSelect,
            },
          },
        },
        service: true,
        payment: true,
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

const getBookingDetailsAdmin = async (id: string) => {
  const result = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: {
        select: userSelect,
      },
      technician: {
        include: {
          user: {
            select: userSelect,
          },
        },
      },
      service: true,
      payment: true,
      review: true,
    },
  });

  if (!result) {
    throw new AppError(404, 'Booking not found');
  }

  return result;
};

export const adminService = {
  getDashboardStats,
  getAllBookingsAdmin,
  getBookingDetailsAdmin,
};
