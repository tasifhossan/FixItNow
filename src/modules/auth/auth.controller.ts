import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { authService } from './auth.service.js';
import config from '../../config/index.js';
import AppError from '../../errors/AppError.js';

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);
  const { refreshToken, accessToken, user } = result;

  const isProduction = config.env === 'production';
  res.cookie('refreshToken', refreshToken, {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged in successfully',
    data: {
      accessToken,
      user,
    },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  // Accept token from HttpOnly cookie first; fall back to request body
  // (body fallback handles cross-origin cookie blocking on Vercel)
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) {
    throw new AppError(401, 'Refresh token is missing');
  }

  const result = await authService.refreshToken(token);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Access token retrieved successfully',
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const isProduction = config.env === 'production';
  res.clearCookie('refreshToken', {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged out successfully',
    data: null,
  });
});

export const authController = {
  register,
  login,
  refreshToken,
  logout,
};
