import type { NextFunction, Request, Response } from 'express';
import AppError from '../errors/AppError.js';
import { verifyAccessToken } from '../utils/jwtHelpers.js';
import type { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { userId: string; email: string; role: string };
    }
  }
}

const auth = (reqOrUnused?: any, resOrUnused?: any, nextOrUnused?: any) => {
  const middleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new AppError(401, 'You are not authorized');
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        throw new AppError(401, 'You are not authorized');
      }

      let decoded;
      try {
        decoded = verifyAccessToken(token);
      } catch (error) {
        throw new AppError(401, 'You are not authorized');
      }

      req.user = decoded as JwtPayload & { userId: string; email: string; role: string };
      next();
    } catch (error) {
      next(error);
    }
  };

  // If called directly as a middleware: auth(req, res, next)
  if (reqOrUnused && reqOrUnused.headers && resOrUnused && nextOrUnused) {
    return middleware(reqOrUnused, resOrUnused, nextOrUnused);
  }

  // If called as a factory: auth()
  return middleware;
};

export default auth;
