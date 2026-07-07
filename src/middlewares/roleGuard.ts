import type { NextFunction, Request, Response } from 'express';
import AppError from '../errors/AppError.js';

const roleGuard = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError(401, 'You are not authorized');
      }

      if (!allowedRoles.includes(user.role)) {
        throw new AppError(403, 'You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default roleGuard;
