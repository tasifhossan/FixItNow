import AppError from '../../errors/AppError.js';
import { prisma } from '../../shared/prisma.js';

const createCategory = async (payload: { name: string; description?: string }) => {
  const existingCategory = await prisma.category.findUnique({
    where: { name: payload.name },
  });

  if (existingCategory) {
    throw new AppError(409, 'Category with this name already exists');
  }

  const result = await prisma.category.create({
    data: payload,
  });

  return result;
};

const getAllCategories = async () => {
  const result = await prisma.category.findMany({
    include: {
      _count: {
        select: { services: true },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return result;
};

const getCategoryById = async (id: string) => {
  const result = await prisma.category.findUnique({
    where: { id },
  });

  if (!result) {
    throw new AppError(404, 'Category not found');
  }

  return result;
};

const updateCategory = async (id: string, payload: { name?: string; description?: string }) => {
  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new AppError(404, 'Category not found');
  }

  if (payload.name) {
    const nameConflict = await prisma.category.findFirst({
      where: {
        name: payload.name,
        NOT: { id },
      },
    });

    if (nameConflict) {
      throw new AppError(409, 'Category with this name already exists');
    }
  }

  const result = await prisma.category.update({
    where: { id },
    data: payload,
  });

  return result;
};

const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { services: true },
      },
    },
  });

  if (!category) {
    throw new AppError(404, 'Category not found');
  }

  if (category._count.services > 0) {
    throw new AppError(400, 'Cannot delete category as it contains linked services');
  }

  const result = await prisma.category.delete({
    where: { id },
  });

  return result;
};

export const categoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
