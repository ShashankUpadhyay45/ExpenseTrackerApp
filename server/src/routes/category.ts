import { Router } from 'express';
import { categoryController } from '../controllers/categoryController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.route('/')
  .get(categoryController.getAll)
  .post(categoryController.create);

router.route('/:id')
  .patch(categoryController.update)
  .delete(categoryController.delete);

export default router;
