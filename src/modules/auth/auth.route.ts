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

export const authRoutes = router;
export default authRoutes;
