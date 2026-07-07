import AppError from '../../errors/AppError.js';
import { prisma } from '../../shared/prisma.js';
import type { Prisma } from '../../../generated/prisma/client.js';

const createService = async (payload: {
  name: string;
  description?: string;
  categoryId: string;
  basePrice: number;
}) => {
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw new AppError(404, 'Category not found');
  }

  const result = await prisma.service.create({
    data: payload,
    include: {
      category: true,
    },
  });

  return result;
};

const getAllServices = async (query: {
  categoryId?: string;
  searchTerm?: string;
  page?: string | number;
  limit?: string | number;
}) => {
  const { categoryId, searchTerm, page = 1, limit = 10 } = query;

  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 10;
  const skip = (parsedPage - 1) * parsedLimit;

  const whereConditions: Prisma.ServiceWhereInput = {};

  if (categoryId) {
    whereConditions.categoryId = categoryId;
  }

  if (searchTerm) {
    whereConditions.name = {
      contains: searchTerm,
      mode: 'insensitive',
    };
  }

  const [total, result] = await prisma.$transaction([
    prisma.service.count({ where: whereConditions }),
    prisma.service.findMany({
      where: whereConditions,
      skip,
      take: parsedLimit,
      include: {
        category: true,
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

const getServiceById = async (id: string) => {
  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });

  if (!service) {
    throw new AppError(404, 'Service not found');
  }

  return service;
};

const updateService = async (
  id: string,
  payload: { name?: string; description?: string; categoryId?: string; basePrice?: number }
) => {
  const existingService = await prisma.service.findUnique({
    where: { id },
  });

  if (!existingService) {
    throw new AppError(404, 'Service not found');
  }

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }
  }

  const result = await prisma.service.update({
    where: { id },
    data: payload,
    include: {
      category: true,
    },
  });

  return result;
};

const deleteService = async (id: string) => {
  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      _count: {
        select: { bookings: true },
      },
    },
  });

  if (!service) {
    throw new AppError(404, 'Service not found');
  }

  if (service._count.bookings > 0) {
    throw new AppError(400, 'Cannot delete service as it contains linked bookings');
  }

  const result = await prisma.service.delete({
    where: { id },
  });

  return result;
};

export const serviceService = {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
};
