import { Router } from 'express';
import { searchController } from '../controllers/searchController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', searchController.globalSearch);

export default router;