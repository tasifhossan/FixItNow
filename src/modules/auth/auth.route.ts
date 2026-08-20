import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest.js';
import { authController } from './auth.controller.js';
import { loginValidation, registerValidation } from './auth.validation.js';

const router = Router();

router.post(
  '/register',
  validateRequest(registerValidation),
  authController.register
);

router.post(
  '/login',
  validateRequest(loginValidation),
  authController.login
);

router.post(
  '/refresh-token',
  authController.refreshToken
);

router.post(
  '/logout',
  authController.logout
);

// ─── Bridge: one-time migration for pre-existing backend-domain sessions ───────
// GET  /bridge          → browser redirect, reads HttpOnly cookie, issues bridge_code
// POST /bridge/exchange → exchanges single-use bridge_code for { accessToken, refreshToken }
router.get('/bridge', authController.bridge);
router.post('/bridge/exchange', authController.bridgeExchange);

export const authRoutes = router;
export default authRoutes;

