import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
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

export const adminController = {
  getDashboardStats,
};
