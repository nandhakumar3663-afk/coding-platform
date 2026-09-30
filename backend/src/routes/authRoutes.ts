import { Router } from 'express';
import { register, login, loginWithUsername, getCurrentUser } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/login-username', loginWithUsername);
router.get('/me', authenticate, getCurrentUser);

export default router;
