import { Router } from 'express';
import auth from '../../middlewares/auth.js';
import roleGuard from '../../middlewares/roleGuard.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { bookingController } from './booking.controller.js';
import { bookingValidation } from './booking.validation.js';

const router = Router();

router.post(
  '/',
  auth,
  roleGuard('CUSTOMER'),
  validateRequest(bookingValidation.createBookingValidation),
  bookingController.createBooking
);

router.get(
  '/my-bookings',
  auth,
  roleGuard('CUSTOMER'),
  bookingController.getMyBookingsAsCustomer
);

router.get(
  '/assigned-to-me',
  auth,
  roleGuard('TECHNICIAN'),
  bookingController.getMyBookingsAsTechnician
);

router.get(
  '/:id',
  auth,
  bookingController.getBookingById
);

router.patch(
  '/:id/respond',
  auth,
  roleGuard('TECHNICIAN'),
  validateRequest(bookingValidation.respondToBookingValidation),
  bookingController.respondToBooking
);

export const bookingRoutes = router;
export default bookingRoutes;
