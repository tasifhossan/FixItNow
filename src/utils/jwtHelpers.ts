import jwt from 'jsonwebtoken';
import type { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import config from '../config/index.js';

const createToken = (
  payload: Record<string, any>,
  secret: Secret,
  expiresIn: string
): string => {
  return jwt.sign(payload, secret, {
    expiresIn,
  } as SignOptions);
};

const verifyToken = (token: string, secret: Secret): JwtPayload | string => {
  return jwt.verify(token, secret);
};

export const jwtHelpers = {
  createToken,
  verifyToken,
};

// Access Token Helpers
export const generateAccessToken = (payload: Record<string, any>): string => {
  return createToken(payload, config.jwt.secret, config.jwt.access_expires_in);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return verifyToken(token, config.jwt.secret) as JwtPayload;
};

// Refresh Token Helpers
export const generateRefreshToken = (payload: Record<string, any>): string => {
  return createToken(
    payload,
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in
  );
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return verifyToken(token, config.jwt.refresh_secret) as JwtPayload;
};
