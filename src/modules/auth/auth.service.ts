import bcrypt from 'bcryptjs';
import { z } from 'zod';
import AppError from '../../errors/AppError.js';
import { prisma } from '../../shared/prisma.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwtHelpers.js';
import { registerValidation, loginValidation } from './auth.validation.js';
import type { Prisma } from '../../../generated/prisma/client.js';

type TRegisterPayload = z.infer<typeof registerValidation>['body'];
type TLoginPayload = z.infer<typeof loginValidation>['body'];

const registerUser = async (payload: TRegisterPayload) => {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new AppError(409, 'Email already exists');
  }

  // Hash password with bcrypt (12 salt rounds)
  const hashedPassword = await bcrypt.hash(payload.password, 12);

  // Create User in a Prisma transaction
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const newUser = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        phone: payload.phone,
        role: payload.role,
      },
    });

    // If role === TECHNICIAN, also create a linked TechnicianProfile with default values
    if (payload.role === 'TECHNICIAN') {
      await tx.technicianProfile.create({
        data: {
          userId: newUser.id,
          isVerified: false,
          isAvailable: true,
          hourlyRate: 0,
          skills: [],
        },
      });
    }

    return newUser;
  });

  // Return user without password field
  const { password, ...userWithoutPassword } = result;
  return userWithoutPassword;
};

const loginUser = async (payload: TLoginPayload) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  // Throw AppError 404 if not found
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Throw AppError 403 if user.isBlocked
  if (user.isBlocked) {
    throw new AppError(403, 'Your account is blocked');
  }

  // Compare password with bcrypt
  const isPasswordMatched = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordMatched) {
    throw new AppError(401, 'Password mismatch');
  }

  // Generate access token (payload: userId, email, role) and refresh token
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Return user without password
  const { password, ...userWithoutPassword } = user;

  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
};

const refreshToken = async (token: string) => {
  // Verify refresh token, throw AppError 401 if invalid/expired
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (error) {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  // Fetch user by id from decoded payload
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  // Throw AppError 404 if not found or isBlocked
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user.isBlocked) {
    throw new AppError(403, 'Your account is blocked');
  }

  // Issue and return a new access token
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);

  return {
    accessToken,
  };
};

export const authService = {
  registerUser,
  loginUser,
  refreshToken,
};
