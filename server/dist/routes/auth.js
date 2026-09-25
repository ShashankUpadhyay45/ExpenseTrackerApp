import { Router } from 'express';
// We will build the controller logic in the next steps
const router = Router();
// Routes will be defined here
router.post('/register', (req, res) => res.send('Register'));
router.post('/login', (req, res) => res.send('Login'));
export default router;
