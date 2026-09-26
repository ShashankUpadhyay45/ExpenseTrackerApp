import { Router } from 'express';
import { budgetController } from '../controllers/budgetController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.route('/')
  .get(budgetController.getAll)
  .post(budgetController.create);

router.route('/:id')
  .get(budgetController.getById)
  .patch(budgetController.update)
  .delete(budgetController.delete);

export default router;