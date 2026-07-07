import { Router } from 'express';
import auth from '../../middlewares/auth.js';
import roleGuard from '../../middlewares/roleGuard.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { serviceController } from './service.controller.js';
import { serviceValidation } from './service.validation.js';

const router = Router();

router.get('/', serviceController.getAllServices);

router.get('/:id', serviceController.getServiceById);

router.post(
  '/',
  auth,
  roleGuard('ADMIN'),
  validateRequest(serviceValidation.createServiceValidation),
  serviceController.createService
);

router.patch(
  '/:id',
  auth,
  roleGuard('ADMIN'),
  validateRequest(serviceValidation.updateServiceValidation),
  serviceController.updateService
);

router.delete(
  '/:id',
  auth,
  roleGuard('ADMIN'),
  serviceController.deleteService
);

export const serviceRoutes = router;
export default serviceRoutes;
