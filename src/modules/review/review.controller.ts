import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import AppError from '../../errors/AppError.js';
import { reviewService } from './review.service.js';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const reviewerId = req.user?.userId;
  if (!reviewerId) {
    throw new AppError(401, 'You are not authorized');
  }

  const result = await reviewService.createReview(reviewerId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Review created successfully',
    data: result,
  });
});

const getReviewsForTechnician = catchAsync(async (req: Request, res: Response) => {
  const { technicianId } = req.params;

  if (!technicianId || typeof technicianId !== 'string') {
    throw new AppError(400, 'Technician ID is required');
  }

  const result = await reviewService.getReviewsForTechnician(
    technicianId,
    req.query
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Reviews retrieved successfully',
    data: result,
  });
});

export const reviewController = {
  createReview,
  getReviewsForTechnician,
};
