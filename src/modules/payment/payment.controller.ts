import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import AppError from '../../errors/AppError.js';
import config from '../../config/index.js';
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

const paymentSuccessCallback = catchAsync(async (req: Request, res: Response) => {
  const { tran_id, val_id } = req.body;
  const frontendUrl =
    config.frontendUrl || 'http://localhost:3000';

  try {
    if (!tran_id || !val_id) {
      throw new Error('Transaction ID and Validation ID are required');
    }

    const booking = await paymentService.validateAndProcessPayment(
      tran_id,
      val_id
    );

    res.redirect(`${frontendUrl}/payment/success?bookingId=${booking.id}`);
  } catch (error) {
    console.error('Success callback processing failed:', error);
    res.redirect(`${frontendUrl}/payment/failed`);
  }
});

const paymentFailCallback = catchAsync(async (req: Request, res: Response) => {
  const { tran_id } = req.body;
  const frontendUrl =
    config.frontendUrl || 'http://localhost:3000';

  try {
    if (tran_id) {
      await paymentService.handleFailedPayment(tran_id);
    }
  } catch (error) {
    console.error('Failure callback processing failed:', error);
  }

  res.redirect(`${frontendUrl}/payment/failed`);
});

const paymentCancelCallback = catchAsync(async (req: Request, res: Response) => {
  const { tran_id } = req.body;
  const frontendUrl =
    config.frontendUrl || 'http://localhost:3000';

  try {
    if (tran_id) {
      await paymentService.handleCancelledPayment(tran_id);
    }
  } catch (error) {
    console.error('Cancel callback processing failed:', error);
  }

  res.redirect(`${frontendUrl}/payment/cancelled`);
});

const getPaymentStatus = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  if (!bookingId || typeof bookingId !== 'string') {
    throw new AppError(400, 'Booking ID is required');
  }

  const result = await paymentService.getPaymentStatus(bookingId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment status retrieved successfully',
    data: result,
  });
});

export const paymentController = {
  initiatePayment,
  paymentSuccessCallback,
  paymentFailCallback,
  paymentCancelCallback,
  getPaymentStatus,
};
