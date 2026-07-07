import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { userService } from './user.service.js';
import AppError from '../../errors/AppError.js';

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(401, 'You are not authorized');
  }

  const result = await userService.getMyProfile(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(401, 'You are not authorized');
  }

  const result = await userService.updateMyProfile(userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User profile updated successfully',
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(401, 'You are not authorized');
  }

  const result = await userService.changePassword(userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getAllUsers(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users retrieved successfully',
    data: result,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    throw new AppError(400, 'User ID is required');
  }

  const result = await userService.getSingleUser(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

const toggleBlockUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    throw new AppError(400, 'User ID is required');
  }

  const result = await userService.toggleBlockUser(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User blocked status toggled successfully',
    data: result,
  });
});

export const userController = {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getAllUsers,
  getSingleUser,
  toggleBlockUser,
};
