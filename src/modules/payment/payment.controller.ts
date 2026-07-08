import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import AppError from '../../errors/AppError.js';
import { paymentService } from './payment.service.js';

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.userId;
  if (!customerId) {
    throw new AppError(401, 'You are not authorized');
  }

  const { bookingId } = req.body;
  if (!bookingId || typeof bookingId !== 'string') {
    throw new AppError(400, 'Booking ID is required');
  }

  const result = await paymentService.initiatePayment(customerId, bookingId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment session initiated successfully',
    data: result,
  });
});

export const paymentController = {
  initiatePayment,
};
