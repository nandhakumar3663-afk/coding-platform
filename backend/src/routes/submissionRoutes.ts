import { Router } from 'express';
import { getSubmissions, getSubmissionById } from '../controllers/submissionController.js';
import { authenticate, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requireAuth, getSubmissions);
router.get('/:id', authenticate, requireAuth, getSubmissionById);

export default router;
