import type { ZodError } from 'zod';

const handleZodError = (err: ZodError) => {
  const errorDetails = err.issues.map((issue) => {
    return {
      field: issue.path[issue.path.length - 1],
      message: issue.message,
    };
  });

  return {
    statusCode: 400,
    message: 'Validation Error',
    errorDetails,
  };
};

export default handleZodError;
