import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import AppError from '../../errors/AppError.js';
import { bookingService } from './booking.service.js';

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.userId;
  if (!customerId) {
    throw new AppError(401, 'You are not authorized');
  }

  const result = await bookingService.createBooking(customerId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Booking created successfully',
    data: result,
  });
});

const getMyBookingsAsCustomer = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.userId;
  if (!customerId) {
    throw new AppError(401, 'You are not authorized');
  }

  const result = await bookingService.getMyBookingsAsCustomer(customerId, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bookings retrieved successfully',
    data: result,
  });
});

const getMyBookingsAsTechnician = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(401, 'You are not authorized');
  }

  const result = await bookingService.getMyBookingsAsTechnician(userId, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bookings retrieved successfully',
    data: result,
  });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.user?.userId;
  const requesterRole = req.user?.role;

  if (!id || typeof id !== 'string') {
    throw new AppError(400, 'Booking ID is required');
  }

  if (!requesterId || !requesterRole) {
    throw new AppError(401, 'You are not authorized');
  }

  const result = await bookingService.getBookingById(
    id,
    requesterId,
    requesterRole
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking retrieved successfully',
    data: result,
  });
});

const respondToBooking = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(401, 'You are not authorized');
  }

  const { id } = req.params;
  const { action } = req.body;

  if (!id || typeof id !== 'string') {
    throw new AppError(400, 'Booking ID is required');
  }

  const result = await bookingService.respondToBooking(userId, id, action);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking status updated successfully',
    data: result,
  });
});

export const bookingController = {
  createBooking,
  getMyBookingsAsCustomer,
  getMyBookingsAsTechnician,
  getBookingById,
  respondToBooking,
};
