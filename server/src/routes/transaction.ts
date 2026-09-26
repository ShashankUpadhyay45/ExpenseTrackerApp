import { Router } from 'express';
import { transactionController } from '../controllers/transactionController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.route('/')
  .get(transactionController.getAll)
  .post(transactionController.create);

router.get('/search', transactionController.search);
router.get('/duplicates', transactionController.getDuplicates);
router.post('/bulk-delete', transactionController.bulkDelete);

router.route('/:id')
  .get(transactionController.getById)
  .patch(transactionController.update)
  .delete(transactionController.delete);

router.post('/:id/duplicate', transactionController.duplicate);

export default router;
