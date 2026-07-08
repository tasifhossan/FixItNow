import { prisma } from '../../shared/prisma.js';

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

export const adminService = {
  getDashboardStats,
};
