import { Router } from 'express';
import { accountController } from '../controllers/accountController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.route('/')
  .get(accountController.getAll)
  .post(accountController.create);

router.get('/summary', accountController.getSummary);
router.post('/transfer', accountController.transfer);

router.route('/:id')
  .get(accountController.getById)
  .patch(accountController.update)
  .delete(accountController.delete);

export default router;
