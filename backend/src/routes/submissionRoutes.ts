import { Router } from 'express';
import { getSubmissions, getSubmissionById } from '../controllers/submissionController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getSubmissions);
router.get('/:id', authenticate, getSubmissionById);

export default router;
