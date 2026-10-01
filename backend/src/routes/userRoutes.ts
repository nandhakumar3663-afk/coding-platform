import { Router } from 'express';
import { getUserProgress, getLeaderboard } from '../controllers/userController.js';
import { authenticate, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/leaderboard', authenticate, getLeaderboard);

router.get('/progress', authenticate, requireAuth, getUserProgress);

export default router;
