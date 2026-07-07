import bcrypt from 'bcryptjs';
import AppError from '../../errors/AppError.js';
import { prisma } from '../../shared/prisma.js';
import type { Prisma } from '../../../generated/prisma/client.js';

const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user.role === 'TECHNICIAN') {
    const technicianUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        technicianProfile: true,
      },
    });
    if (!technicianUser) {
      throw new AppError(404, 'User not found');
    }
    const { password, ...userWithoutPassword } = technicianUser;
    return userWithoutPassword;
  }

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const updateMyProfile = async (
  userId: string,
  payload: { name?: string; phone?: string }
) => {
  // Ensure we only update name and phone
  const updateData: Prisma.UserUpdateInput = {};
  if (payload.name !== undefined) {
    updateData.name = payload.name;
  }
  if (payload.phone !== undefined) {
    updateData.phone = payload.phone;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  const { password, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

const changePassword = async (
  userId: string,
  payload: { oldPassword?: string; newPassword?: string }
) => {
  if (!payload.oldPassword || !payload.newPassword) {
    throw new AppError(400, 'Old password and new password are required');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const isPasswordMatched = await bcrypt.compare(payload.oldPassword, user.password);
  if (!isPasswordMatched) {
    throw new AppError(401, 'Password mismatch');
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: 'Password changed successfully',
  };
};

const getAllUsers = async (query: {
  role?: string;
  searchTerm?: string;
  page?: string | number;
  limit?: string | number;
}) => {
  const { role, searchTerm, page = 1, limit = 10 } = query;

  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 10;
  const skip = (parsedPage - 1) * parsedLimit;

  const whereConditions: Prisma.UserWhereInput = {};

  if (role) {
    whereConditions.role = role as any;
  }

  if (searchTerm) {
    whereConditions.OR = [
      {
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      {
        email: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
    ];
  }

  const [total, result] = await prisma.$transaction([
    prisma.user.count({ where: whereConditions }),
    prisma.user.findMany({
      where: whereConditions,
      skip,
      take: parsedLimit,
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  const data = result.map((user) => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });

  return {
    meta: {
      page: parsedPage,
      limit: parsedLimit,
      total,
    },
    data,
  };
};

const getSingleUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const toggleBlockUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      isBlocked: !user.isBlocked,
    },
  });

  const { password, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

export const userService = {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getAllUsers,
  getSingleUser,
  toggleBlockUser,
};
