import AppError from '../../errors/AppError.js';
import { prisma } from '../../shared/prisma.js';

const createReview = async (
  reviewerId: string,
  payload: {
    bookingId: string;
    rating: number;
    comment?: string;
  }
) => {
  // 1. Fetch booking with technician relation
  const booking = await prisma.booking.findUnique({
    where: { id: payload.bookingId },
    include: {
      technician: true,
    },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  // 2. Verify booking.customerId matches reviewerId
  if (booking.customerId !== reviewerId) {
    throw new AppError(403, 'You do not have permission to review this booking');
  }

  // 3. Verify booking status is COMPLETED
  if (booking.status !== 'COMPLETED') {
    throw new AppError(400, 'You can only review completed bookings');
  }

  // 4. Check if a review already exists for this bookingId
  const existingReview = await prisma.review.findUnique({
    where: { bookingId: payload.bookingId },
  });

  if (existingReview) {
    throw new AppError(409, 'A review already exists for this booking');
  }

  // 5. Create review and update technician average rating & total reviews inside a transaction
  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        bookingId: payload.bookingId,
        reviewerId,
        technicianId: booking.technicianId,
        rating: payload.rating,
        comment: payload.comment || null,
      },
    });

    // Fetch all reviews for this technician
    const reviews = await tx.review.findMany({
      where: { technicianId: booking.technicianId },
    });

    const totalReviews = reviews.length;
    const sumRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalReviews > 0 ? sumRatings / totalReviews : 0;

    await tx.technicianProfile.update({
      where: { id: booking.technicianId },
      data: {
        averageRating,
        totalReviews,
      },
    });

    return review;
  });

  return result;
};

const getReviewsForTechnician = async (
  technicianId: string,
  query: {
    page?: string | number;
    limit?: string | number;
  }
) => {
  const { page = 1, limit = 10 } = query;
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 10;
  const skip = (parsedPage - 1) * parsedLimit;

  const [total, result] = await prisma.$transaction([
    prisma.review.count({
      where: { technicianId },
    }),
    prisma.review.findMany({
      where: { technicianId },
      skip,
      take: parsedLimit,
      include: {
        reviewer: {
          select: {
            name: true,
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

export const reviewService = {
  createReview,
  getReviewsForTechnician,
};
