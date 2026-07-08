import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import AppError from '../../errors/AppError.js';
import { technicianService } from './technician.service.js';

const getAllTechnicians = catchAsync(async (req: Request, res: Response) => {
  const result = await technicianService.getAllTechnicians(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Technicians retrieved successfully',
    data: result,
  });
});

const getTechnicianById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    throw new AppError(400, 'Technician ID is required');
  }

  const result = await technicianService.getTechnicianById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Technician profile retrieved successfully',
    data: result,
  });
});

const getMyTechnicianProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(401, 'You are not authorized');
  }

  const result = await technicianService.getMyTechnicianProfile(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Technician profile retrieved successfully',
    data: result,
  });
});

const updateMyTechnicianProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(401, 'You are not authorized');
  }

  const result = await technicianService.updateMyTechnicianProfile(userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Technician profile updated successfully',
    data: result,
  });
});

const toggleAvailability = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(401, 'You are not authorized');
  }

  const { isAvailable } = req.body;
  if (isAvailable === undefined) {
    throw new AppError(400, 'isAvailable is required');
  }

  const result = await technicianService.toggleAvailability(userId, isAvailable);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Technician availability toggled successfully',
    data: result,
  });
});

const verifyTechnician = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    throw new AppError(400, 'Technician ID is required');
  }

  const result = await technicianService.verifyTechnician(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Technician profile verified successfully',
    data: result,
  });
});

const assignServices = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(401, 'You are not authorized');
  }

  const { serviceIds } = req.body;
  const result = await technicianService.assignServices(userId, serviceIds);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Services assigned successfully',
    data: result,
  });
});

const removeService = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(401, 'You are not authorized');
  }

  const { serviceId } = req.params;
  if (!serviceId || typeof serviceId !== 'string') {
    throw new AppError(400, 'Service ID is required');
  }

  const result = await technicianService.removeService(userId, serviceId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service removed successfully',
    data: result,
  });
});

export const technicianController = {
  getAllTechnicians,
  getTechnicianById,
  getMyTechnicianProfile,
  updateMyTechnicianProfile,
  toggleAvailability,
  verifyTechnician,
  assignServices,
  removeService,
};
