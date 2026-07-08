import AppError from '../../errors/AppError.js';
import { prisma } from '../../shared/prisma.js';
import type { Prisma } from '../../../generated/prisma/client.js';

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isBlocked: true,
  createdAt: true,
  updatedAt: true,
};

const getAllTechnicians = async (query: {
  minRating?: string | number;
  isAvailable?: string | boolean;
  searchTerm?: string;
  page?: string | number;
  limit?: string | number;
  includeUnverified?: string | boolean;
}) => {
  const { minRating, isAvailable, searchTerm, page = 1, limit = 10, includeUnverified } = query;

  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 10;
  const skip = (parsedPage - 1) * parsedLimit;

  const whereConditions: Prisma.TechnicianProfileWhereInput = {};

  if (minRating !== undefined && minRating !== '') {
    const ratingNum = Number(minRating);
    if (!isNaN(ratingNum)) {
      whereConditions.averageRating = {
        gte: ratingNum,
      };
    }
  }

  if (isAvailable !== undefined && isAvailable !== '') {
    whereConditions.isAvailable = isAvailable === 'true' || isAvailable === true;
  }

  if (includeUnverified !== 'true' && includeUnverified !== true) {
    whereConditions.isVerified = true;
  }

  if (searchTerm) {
    whereConditions.user = {
      name: {
        contains: searchTerm,
        mode: 'insensitive',
      },
    };
  }

  const [total, result] = await prisma.$transaction([
    prisma.technicianProfile.count({ where: whereConditions }),
    prisma.technicianProfile.findMany({
      where: whereConditions,
      skip,
      take: parsedLimit,
      include: {
        user: {
          select: userSelect,
        },
        services: true,
      },
      orderBy: {
        id: 'asc',
      },
    }),
  ]);

  return {
    meta: {
      page: parsedPage,
      limit: parsedLimit,
      total,
    },
    data: result,
  };
};

const getTechnicianById = async (id: string) => {
  const technician = await prisma.technicianProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: userSelect,
      },
      services: true,
    },
  });

  if (!technician) {
    throw new AppError(404, 'Technician profile not found');
  }

  return technician;
};

const getMyTechnicianProfile = async (userId: string) => {
  const technician = await prisma.technicianProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: userSelect,
      },
    },
  });

  if (!technician) {
    throw new AppError(404, 'Technician profile not found');
  }

  return technician;
};

const updateMyTechnicianProfile = async (
  userId: string,
  payload: { bio?: string; hourlyRate?: number; skills?: string[] }
) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new AppError(404, 'Technician profile not found');
  }

  const updatedProfile = await prisma.technicianProfile.update({
    where: { userId },
    data: payload,
    include: {
      user: {
        select: userSelect,
      },
    },
  });

  return updatedProfile;
};

const toggleAvailability = async (userId: string, isAvailable: boolean) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new AppError(404, 'Technician profile not found');
  }

  const updatedProfile = await prisma.technicianProfile.update({
    where: { userId },
    data: { isAvailable },
    include: {
      user: {
        select: userSelect,
      },
    },
  });

  return updatedProfile;
};

const verifyTechnician = async (id: string) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { id },
  });

  if (!profile) {
    throw new AppError(404, 'Technician profile not found');
  }

  const updatedProfile = await prisma.technicianProfile.update({
    where: { id },
    data: { isVerified: true },
    include: {
      user: {
        select: userSelect,
      },
    },
  });

  return updatedProfile;
};

const assignServices = async (userId: string, serviceIds: string[]) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new AppError(404, 'Technician profile not found');
  }

  const existingServices = await prisma.service.findMany({
    where: {
      id: {
        in: serviceIds,
      },
    },
    select: {
      id: true,
    },
  });

  const existingIds = existingServices.map((s) => s.id);
  const invalidIds = serviceIds.filter((id) => !existingIds.includes(id));

  if (invalidIds.length > 0) {
    throw new AppError(400, `Invalid service ID(s): ${invalidIds.join(', ')}`);
  }

  const updatedProfile = await prisma.technicianProfile.update({
    where: { userId },
    data: {
      services: {
        connect: serviceIds.map((id) => ({ id })),
      },
    },
    include: {
      user: {
        select: userSelect,
      },
      services: true,
    },
  });

  return updatedProfile;
};

const removeService = async (userId: string, serviceId: string) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
    include: {
      services: {
        where: {
          id: serviceId,
        },
      },
    },
  });

  if (!profile) {
    throw new AppError(404, 'Technician profile not found');
  }

  if (profile.services.length === 0) {
    throw new AppError(404, 'Service is not assigned to this technician');
  }

  const updatedProfile = await prisma.technicianProfile.update({
    where: { userId },
    data: {
      services: {
        disconnect: { id: serviceId },
      },
    },
    include: {
      user: {
        select: userSelect,
      },
      services: true,
    },
  });

  return updatedProfile;
};

export const technicianService = {
  getAllTechnicians,
  getTechnicianById,
  getMyTechnicianProfile,
  updateMyTechnicianProfile,
  toggleAvailability,
  verifyTechnician,
  assignServices,
  removeService,
};
