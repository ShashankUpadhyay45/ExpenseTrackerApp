import { Router } from 'express';
import { receiptController } from '../controllers/receiptController.js';
import { protect } from '../middleware/auth.js';
import { uploadReceipt } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(protect);

router.post('/upload', uploadLimiter, uploadReceipt.single('receipt'), receiptController.upload);
router.get('/:id', receiptController.getById);
router.delete('/:id', receiptController.delete);

export default router;