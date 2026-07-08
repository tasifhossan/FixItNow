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

router.get(
  '/bookings',
  auth,
  roleGuard('ADMIN'),
  adminController.getAllBookingsAdmin
);

router.get(
  '/bookings/:id',
  auth,
  roleGuard('ADMIN'),
  adminController.getBookingDetailsAdmin
);

export const adminRoutes = router;
export default adminRoutes;
