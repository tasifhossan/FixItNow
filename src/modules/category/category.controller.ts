import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import AppError from '../../errors/AppError.js';
import { categoryService } from './category.service.js';

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.createCategory(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.getAllCategories();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Categories retrieved successfully',
    data: result,
  });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    throw new AppError(400, 'Category ID is required');
  }

  const result = await categoryService.getCategoryById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Category retrieved successfully',
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    throw new AppError(400, 'Category ID is required');
  }

  const result = await categoryService.updateCategory(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    throw new AppError(400, 'Category ID is required');
  }

  const result = await categoryService.deleteCategory(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Category deleted successfully',
    data: result,
  });
});

export const categoryController = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
