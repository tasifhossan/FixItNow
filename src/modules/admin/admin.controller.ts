import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import AppError from '../../errors/AppError.js';
import { adminService } from './admin.service.js';

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getDashboardStats();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Dashboard statistics retrieved successfully',
    data: result,
  });
});

const getAllBookingsAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllBookingsAdmin(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bookings retrieved successfully',
    data: result,
  });
});

const getBookingDetailsAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    throw new AppError(400, 'Booking ID is required');
  }

  const result = await adminService.getBookingDetailsAdmin(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking details retrieved successfully',
    data: result,
  });
});

export const adminController = {
  getDashboardStats,
  getAllBookingsAdmin,
  getBookingDetailsAdmin,
};
