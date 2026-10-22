import { Response } from 'express';
import { queryAll, queryOne } from '../models/db.js';
import { AuthRequest } from '../middleware/auth.js';

const DEFAULT_SUBMISSION_LIMIT = 50;
const MAX_SUBMISSION_LIMIT = 100;

export function getSubmissions(req: AuthRequest, res: Response): void {
  const userId = req.user?.id;
  const rawProblemId = req.query.problemId;
  const rawLimit = req.query.limit;
  let limit = DEFAULT_SUBMISSION_LIMIT;

  if (rawLimit !== undefined) {
    if (typeof rawLimit !== 'string' || !/^\\d+$/.test(rawLimit)) {
      res.status(400).json({ error: 'limit must be an integer between 1 and 100' });
      return;
    }

    limit = Number(rawLimit);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_SUBMISSION_LIMIT) {
      res.status(400).json({ error: 'limit must be an integer between 1 and 100' });
      return;
    }
  }

  if (rawProblemId !== undefined && (typeof rawProblemId !== 'string' || !rawProblemId.trim())) {
    res.status(400).json({ error: 'problemId must be a non-empty string' });
    return;
  }

  let sql = `
    SELECT 
      s.id, s.problem_id, s.language, s.verdict, s.passed_count, s.total_count,
      s.execution_time_ms, s.memory_used_kb, s.created_at,
      p.title as problem_title, p.slug as problem_slug,
      u.username
    FROM submissions s
    JOIN problems p ON p.id = s.problem_id
    JOIN users u ON u.id = s.user_id
    WHERE 1=1
  `;
  const params: Array<string | number> = [];

  if (userId && req.user?.role !== 'admin') {
    sql += ' AND s.user_id = ? ';
    params.push(userId);
  }

  if (typeof rawProblemId === 'string') {
    sql += ' AND s.problem_id = ? ';
    params.push(rawProblemId);
  }

  sql += ' ORDER BY s.created_at DESC LIMIT ? ';
  params.push(limit);

  const submissions = queryAll(sql, params);
  res.json({ submissions });
}

export function getSubmissionById(req: AuthRequest, res: Response): void {
  const { id } = req.params;

  const submission = queryOne(
    `SELECT 
      s.*, p.title as problem_title, p.slug as problem_slug, u.username
     FROM submissions s
     JOIN problems p ON p.id = s.problem_id
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`,
    [id]
  );

  if (!submission) {
    res.status(404).json({ error: 'Submission not found' });
    return;
  }

  if (submission.user_id !== req.user?.id && req.user?.role !== 'admin') {
    res.status(403).json({ error: 'This submission belongs to another user' });
    return;
  }

  const results = queryAll(
    `SELECT 
      sr.id, sr.test_case_number, sr.status, sr.input_preview, sr.expected_output,
      sr.actual_output, sr.execution_time_ms, sr.memory_used_kb, sr.error_message, COALESCE(tc.is_hidden, 1) as is_hidden
     FROM submission_results sr
     LEFT JOIN test_cases tc ON tc.id = sr.test_case_id
     WHERE sr.submission_id = ?
     ORDER BY sr.test_case_number ASC`,
    [id]
  );

  res.json({
    submission: {
      ...submission,
      results: results.map(row => row.is_hidden ? { ...row, input_preview: '[Hidden]', expected_output: '[Hidden]', actual_output: '[Hidden]', error_message: row.error_message ? 'Hidden test execution failed' : null } : row),
    },
  });
}
