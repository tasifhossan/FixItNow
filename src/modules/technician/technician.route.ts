import { Router } from 'express';
import auth from '../../middlewares/auth.js';
import roleGuard from '../../middlewares/roleGuard.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { technicianController } from './technician.controller.js';
import { technicianValidation } from './technician.validation.js';

const router = Router();

router.get('/', technicianController.getAllTechnicians);

router.get(
  '/me/profile',
  auth,
  roleGuard('TECHNICIAN'),
  technicianController.getMyTechnicianProfile
);

router.patch(
  '/me/profile',
  auth,
  roleGuard('TECHNICIAN'),
  validateRequest(technicianValidation.updateTechnicianProfileValidation),
  technicianController.updateMyTechnicianProfile
);

router.patch(
  '/me/availability',
  auth,
  roleGuard('TECHNICIAN'),
  validateRequest(technicianValidation.toggleAvailabilityValidation),
  technicianController.toggleAvailability
);

router.post(
  '/me/services',
  auth,
  roleGuard('TECHNICIAN'),
  validateRequest(technicianValidation.assignServicesValidation),
  technicianController.assignServices
);

router.delete(
  '/me/services/:serviceId',
  auth,
  roleGuard('TECHNICIAN'),
  technicianController.removeService
);

router.get('/:id', technicianController.getTechnicianById);

router.patch(
  '/:id/verify',
  auth,
  roleGuard('ADMIN'),
  technicianController.verifyTechnician
);

export const technicianRoutes = router;
export default technicianRoutes;
