import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.get('/preferences', userController.getPreferences);
router.patch('/preferences', userController.updatePreferences);
router.delete('/account', userController.deleteAccount);

export default router;
