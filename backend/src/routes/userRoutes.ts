import { Router } from 'express';
import { getUserProgress } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/progress', authenticate, getUserProgress);

export default router;
