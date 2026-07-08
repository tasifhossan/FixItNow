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

// Note: The main server/app file must enable express.urlencoded({ extended: true })
// globally or scoped to these callback routes for form-encoded bodies to parse correctly.
router.post('/callback/success', paymentController.paymentSuccessCallback);
router.post('/callback/fail', paymentController.paymentFailCallback);
router.post('/callback/cancel', paymentController.paymentCancelCallback);

router.get('/:bookingId/status', auth, paymentController.getPaymentStatus);

export const paymentRoutes = router;
export default paymentRoutes;
