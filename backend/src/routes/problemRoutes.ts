import { Router } from 'express';
import { getProblems, getProblemBySlug, runCode, submitCode } from '../controllers/problemController.js';
import { authenticate, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getProblems);
router.get('/:slug', authenticate, getProblemBySlug);
router.post('/:slug/run', authenticate, requireAuth, runCode);
router.post('/:slug/submit', authenticate, requireAuth, submitCode);

export default router;
