import { Router } from 'express';
import { goalController } from '../controllers/goalController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.route('/')
  .get(goalController.getAll)
  .post(goalController.create);

router.post('/:id/contribute', goalController.addContribution);

router.route('/:id')
  .get(goalController.getById)
  .patch(goalController.update)
  .delete(goalController.delete);

export default router;