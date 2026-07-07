import { Router } from 'express';
import auth from '../../middlewares/auth.js';
import roleGuard from '../../middlewares/roleGuard.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { userController } from './user.controller.js';
import {
  changePasswordValidation,
  updateProfileValidation,
} from './user.validation.js';

const router = Router();

router.get(
  '/me',
  auth,
  userController.getMyProfile
);

router.patch(
  '/me',
  auth,
  validateRequest(updateProfileValidation),
  userController.updateMyProfile
);

router.patch(
  '/change-password',
  auth,
  validateRequest(changePasswordValidation),
  userController.changePassword
);

router.get(
  '/',
  auth,
  roleGuard('ADMIN'),
  userController.getAllUsers
);

router.get(
  '/:id',
  auth,
  roleGuard('ADMIN'),
  userController.getSingleUser
);

router.patch(
  '/:id/toggle-block',
  auth,
  roleGuard('ADMIN'),
  userController.toggleBlockUser
);

export const userRoutes = router;
export default userRoutes;
