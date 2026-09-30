import { Router } from 'express';
import { getUserProgress } from '../controllers/userController.js';
import { authenticate, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/progress', authenticate, requireAuth, getUserProgress);

export default router;
