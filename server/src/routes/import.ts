import { Router } from 'express';
import { importController } from '../controllers/importController.js';
import { protect } from '../middleware/auth.js';
import { uploadCSV } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(protect);

router.post('/csv', uploadLimiter, uploadCSV.single('file'), importController.importCSV);
router.post('/json', uploadLimiter, uploadCSV.single('file'), importController.importJSON);
router.get('/:id', importController.getJobStatus);

export default router;