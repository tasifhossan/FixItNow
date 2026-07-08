import { Router } from 'express';
import auth from '../../middlewares/auth.js';
import roleGuard from '../../middlewares/roleGuard.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { reviewController } from './review.controller.js';
import { reviewValidation } from './review.validation.js';

const router = Router();

router.post(
  '/',
  auth,
  roleGuard('CUSTOMER'),
  validateRequest(reviewValidation.createReviewValidation),
  reviewController.createReview
);

router.get(
  '/technician/:technicianId',
  reviewController.getReviewsForTechnician
);

export const reviewRoutes = router;
export default reviewRoutes;
