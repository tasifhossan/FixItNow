import { Prisma } from '../../generated/prisma/client.js';

const handlePrismaError = (err: Prisma.PrismaClientKnownRequestError) => {
  let message = 'Database Error';
  let statusCode = 500;
  let errorDetails: any = null;

  if (err.code === 'P2002') {
    statusCode = 409;
    const target = err.meta?.target as string[];
    message = `Duplicate field: ${target ? target.join(', ') : 'unknown'}`;
    errorDetails = {
      code: err.code,
      meta: err.meta,
    };
  } else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Foreign key constraint failed on the database';
    errorDetails = {
      code: err.code,
      meta: err.meta,
    };
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = (err.meta?.cause as string) || 'Record not found';
    errorDetails = {
      code: err.code,
      meta: err.meta,
    };
  } else {
    message = err.message;
    errorDetails = {
      code: err.code,
      meta: err.meta,
    };
  }

  return {
    statusCode,
    message,
    errorDetails,
  };
};

export default handlePrismaError;
