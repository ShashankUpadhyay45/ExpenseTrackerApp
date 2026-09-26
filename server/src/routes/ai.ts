import { Router } from 'express';
import { aiController } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(protect);

router.get('/summary', aiController.getSummary);
router.post('/query', aiLimiter, aiController.query);
router.post('/categorize', aiController.categorize);
router.get('/anomalies', aiController.detectAnomalies);
router.get('/forecast', aiController.forecast);
router.post('/what-if', aiController.whatIf);

export default router;