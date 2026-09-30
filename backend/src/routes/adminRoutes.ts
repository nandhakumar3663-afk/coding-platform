import { Router } from 'express';
import {
  getAdminProblems,
  createProblem,
  updateProblem,
  deleteProblem,
  generateTestCasesForProblem,
  getProblemTestCases,
  toggleTestCaseVisibility,
  getAdminStats,
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Apply auth & admin check
router.use(authenticate, requireAdmin);

router.get('/problems', getAdminProblems);
router.post('/problems', createProblem);
router.put('/problems/:id', updateProblem);
router.delete('/problems/:id', deleteProblem);

router.post('/problems/:id/generate-tests', generateTestCasesForProblem);
router.get('/problems/:id/test-cases', getProblemTestCases);
router.patch('/test-cases/:testCaseId/toggle', toggleTestCaseVisibility);

router.get('/stats', getAdminStats);

export default router;
