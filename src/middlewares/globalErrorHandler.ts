import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '../../generated/prisma/client.js';
import AppError from '../errors/AppError.js';
import handleZodError from '../errors/handleZodError.js';
import handlePrismaError from '../errors/handlePrismaError.js';
import config from '../config/index.js';

const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorDetails: any = null;

  if (err instanceof ZodError) {
    const formattedError = handleZodError(err);
    statusCode = formattedError.statusCode;
    message = formattedError.message;
    errorDetails = formattedError.errorDetails;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const formattedError = handlePrismaError(err);
    statusCode = formattedError.statusCode;
    message = formattedError.message;
    errorDetails = formattedError.errorDetails;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorDetails = err.details || null;
  } else if (err instanceof Error) {
    message = err.message;
    errorDetails = err;
  }

  // Response structure: { success: false, message, errorDetails }
  // If in production, don't leak details for unknown errors
  if (config.env === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
    errorDetails = null;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorDetails,
    ...(config.env !== 'production' ? { stack: err.stack } : {}),
  });
};

export default globalErrorHandler;
