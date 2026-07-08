import { Router } from 'express';
import auth from '../../middlewares/auth.js';
import roleGuard from '../../middlewares/roleGuard.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { paymentController } from './payment.controller.js';
import { paymentValidation } from './payment.validation.js';

const router = Router();

router.post(
  '/initiate',
  auth,
  roleGuard('CUSTOMER'),
  validateRequest(paymentValidation.initiatePaymentValidation),
  paymentController.initiatePayment
);

export const paymentRoutes = router;
export default paymentRoutes;
