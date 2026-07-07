import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import AppError from '../../errors/AppError.js';
import { serviceService } from './service.service.js';

const createService = catchAsync(async (req: Request, res: Response) => {
  const result = await serviceService.createService(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Service created successfully',
    data: result,
  });
});

const getAllServices = catchAsync(async (req: Request, res: Response) => {
  const result = await serviceService.getAllServices(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Services retrieved successfully',
    data: result,
  });
});

const getServiceById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    throw new AppError(400, 'Service ID is required');
  }

  const result = await serviceService.getServiceById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service retrieved successfully',
    data: result,
  });
});

const updateService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    throw new AppError(400, 'Service ID is required');
  }

  const result = await serviceService.updateService(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service updated successfully',
    data: result,
  });
});

const deleteService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    throw new AppError(400, 'Service ID is required');
  }

  const result = await serviceService.deleteService(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service deleted successfully',
    data: result,
  });
});

export const serviceController = {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
};
