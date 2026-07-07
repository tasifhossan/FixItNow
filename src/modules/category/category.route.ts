import { Router } from 'express';
import auth from '../../middlewares/auth.js';
import roleGuard from '../../middlewares/roleGuard.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { categoryController } from './category.controller.js';
import { categoryValidation } from './category.validation.js';

const router = Router();

router.get('/', categoryController.getAllCategories);

router.get('/:id', categoryController.getCategoryById);

router.post(
  '/',
  auth,
  roleGuard('ADMIN'),
  validateRequest(categoryValidation.createCategoryValidation),
  categoryController.createCategory
);

router.patch(
  '/:id',
  auth,
  roleGuard('ADMIN'),
  validateRequest(categoryValidation.updateCategoryValidation),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  auth,
  roleGuard('ADMIN'),
  categoryController.deleteCategory
);

export const categoryRoutes = router;
export default categoryRoutes;
