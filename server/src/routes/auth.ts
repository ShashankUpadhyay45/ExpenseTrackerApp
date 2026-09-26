import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.patch('/change-password', protect, authController.changePassword);
router.post('/forgot-password', authLimiter, authController.forgotPassword);

export default router;
