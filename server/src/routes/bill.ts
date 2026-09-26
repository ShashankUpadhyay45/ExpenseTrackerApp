import { Router } from 'express';
import { billController } from '../controllers/billController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.route('/')
  .get(billController.getAll)
  .post(billController.create);

router.get('/upcoming', billController.getUpcoming);
router.post('/:id/mark-paid', billController.markPaid);

router.route('/:id')
  .get(billController.getById)
  .patch(billController.update)
  .delete(billController.delete);

export default router;