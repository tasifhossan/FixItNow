import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { authService } from './auth.service.js';
import { storeBridgeCode, consumeBridgeCode } from './bridgeCodeStore.js';
import config from '../../config/index.js';
import AppError from '../../errors/AppError.js';

// ─── Existing auth handlers ───────────────────────────────────────────────────

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);
  const { refreshToken, accessToken, user } = result;

  const isProduction = config.env === 'production';
  res.cookie('refreshToken', refreshToken, {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged in successfully',
    data: {
      accessToken,
      refreshToken, // returned so frontend can store it for cross-origin refresh
      user,
    },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  // Accept token from HttpOnly cookie first; fall back to request body
  // (body fallback handles cross-origin cookie blocking on Vercel)
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) {
    throw new AppError(401, 'Refresh token is missing');
  }

  const result = await authService.refreshToken(token);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Access token retrieved successfully',
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const isProduction = config.env === 'production';
  res.clearCookie('refreshToken', {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged out successfully',
    data: null,
  });
});

// ─── Bridge: allowed return-URL origins (open-redirect protection) ─────────────
const ALLOWED_ORIGINS = [
  'https://fix-it-now-frontend-three.vercel.app',
  'http://localhost:3000',
];

function isSafeReturnUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return ALLOWED_ORIGINS.includes(url.origin);
  } catch {
    return false;
  }
}

// ─── GET /auth/bridge ─────────────────────────────────────────────────────────
// Browser is redirected here via top-level navigation, so the backend-domain
// HttpOnly refreshToken cookie IS present (same-origin request).
// Verifies the token, rotates it, mints a single-use bridge_code, and redirects
// back to the frontend with ?bridge_code=<uuid>.
function bridge(req: Request, res: Response): void {
  const rawReturn = (req.query.return as string) || '';

  // Validate return URL against allowlist before doing anything (open-redirect protection)
  if (!rawReturn || !isSafeReturnUrl(rawReturn)) {
    res.status(400).json({ message: 'Invalid or missing return URL' });
    return;
  }

  const token = req.cookies?.refreshToken;
  if (!token) {
    const sep = rawReturn.includes('?') ? '&' : '?';
    res.redirect(`${rawReturn}${sep}bridge_failed=1`);
    return;
  }

  // Verify + rotate token using existing authService logic
  authService
    .refreshToken(token)
    .then(({ accessToken, refreshToken: newRefreshToken }) => {
      // Mint single-use opaque code, TTL 60s (enforced in store)
      const code = randomUUID();
      storeBridgeCode(code, { accessToken, refreshToken: newRefreshToken });

      // Rotate the HttpOnly cookie on the backend domain while we're here
      const isProduction = config.env === 'production';
      res.cookie('refreshToken', newRefreshToken, {
        secure: isProduction,
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      const sep = rawReturn.includes('?') ? '&' : '?';
      res.redirect(`${rawReturn}${sep}bridge_code=${code}`);
    })
    .catch(() => {
      const sep = rawReturn.includes('?') ? '&' : '?';
      res.redirect(`${rawReturn}${sep}bridge_failed=1`);
    });
}

// ─── POST /auth/bridge/exchange ───────────────────────────────────────────────
// Frontend POSTs { bridge_code } here, receives { accessToken, refreshToken }.
// Code is single-use and deleted on first read — replay attacks are prevented.
const bridgeExchange = catchAsync(async (req: Request, res: Response) => {
  const { bridge_code } = req.body;
  if (!bridge_code || typeof bridge_code !== 'string') {
    throw new AppError(400, 'bridge_code is required');
  }

  const payload = consumeBridgeCode(bridge_code);
  if (!payload) {
    throw new AppError(400, 'Invalid or expired bridge code');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bridge exchange successful',
    data: payload,
  });
});

export const authController = {
  register,
  login,
  refreshToken,
  logout,
  bridge,
  bridgeExchange,
};
