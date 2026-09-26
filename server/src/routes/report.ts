import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/generate', reportController.generate);
router.get('/pdf', reportController.downloadPDF);
router.get('/csv', reportController.exportCSV);
router.get('/json', reportController.exportJSON);

export default router;