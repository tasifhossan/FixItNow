import { Router } from 'express';
import auth from '../../middlewares/auth.js';
import roleGuard from '../../middlewares/roleGuard.js';
import { adminController } from './admin.controller.js';

const router = Router();

router.get(
  '/stats',
  auth,
  roleGuard('ADMIN'),
  adminController.getDashboardStats
);

export const adminRoutes = router;
export default adminRoutes;
