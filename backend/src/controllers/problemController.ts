import { Request, Response } from 'express';
import { levelMetadata } from '../catalog/levels.js';
import { queryAll, queryOne, execute } from '../models/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { judgeSubmission } from '../judges/judgeService.js';
import { SupportedLanguage } from '../judges/types.js';
import { v4 as uuidv4 } from 'uuid';

export async function getProblems(req: AuthRequest, res: Response): Promise<void> {
  const { difficulty, tag, status, search } = req.query;
  const userId = req.user?.id;

  let sql = `
    SELECT 
      p.id, p.problem_number, p.title, p.slug, p.difficulty, p.category,
      p.time_limit_ms, p.memory_limit_mb,
      (SELECT COUNT(*) FROM test_cases tc WHERE tc.problem_id = p.id) as total_test_cases,
      (SELECT COUNT(*) FROM submissions s WHERE s.problem_id = p.id AND s.verdict = 'Accepted') as accepted_submissions,
      (SELECT COUNT(*) FROM submissions s WHERE s.problem_id = p.id) as total_submissions
  `;

  if (userId) {
    sql += `, (SELECT up.status FROM user_progress up WHERE up.user_id = ? AND up.problem_id = p.id) as user_status `;
  } else {
    sql += `, NULL as user_status `;
  }

  sql += ` FROM problems p WHERE p.is_published = 1 `;
  const params: any[] = [];
  if (userId) {
    params.push(userId);
  }

  if (difficulty && difficulty !== 'All') {
    sql += ` AND p.difficulty = ? `;
    params.push(difficulty);
  }

  if (search) {
    sql += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.category LIKE ? OR CAST(p.problem_number AS TEXT) = ?) `;
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern, search);
  }

  sql += ` ORDER BY p.problem_number ASC `;

  const problems = queryAll(sql, params);

  // Attach tags to each problem
  for (const p of problems) {
    const tags = queryAll(
      `SELECT t.id, t.name, t.slug 
       FROM tags t 
       JOIN problem_tags pt ON pt.tag_id = t.id 
       WHERE pt.problem_id = ?`,
      [p.id]
    );
    p.tags = tags;
    Object.assign(p, levelMetadata(p));
  }

  // Filter by tag in memory if specified
  let filtered = problems;
  if (tag && tag !== 'All') {
    filtered = filtered.filter((p: any) =>
      p.tags.some((t: any) => t.slug === tag || t.name.toLowerCase() === (tag as string).toLowerCase())
    );
  }

  // Filter by status if specified
  if (status && status !== 'All') {
    if (status === 'Solved') {
      filtered = filtered.filter((p: any) => p.user_status === 'solved');
    } else if (status === 'Attempted') {
      filtered = filtered.filter((p: any) => p.user_status === 'attempted');
    } else if (status === 'Unsolved') {
      filtered = filtered.filter((p: any) => !p.user_status);
    }
  }

  res.json({ problems: filtered });
}

export async function getProblemBySlug(req: AuthRequest, res: Response): Promise<void> {
  const { slug } = req.params;
  const userId = req.user?.id;
  const isAdmin = req.user?.role === 'admin';

  const problem = queryOne('SELECT * FROM problems WHERE slug = ?', [slug]);
  if (!problem) {
    res.status(404).json({ error: 'Problem not found' });
    return;
  }

  // Fetch examples
  const examples = queryAll(
    'SELECT input, output, explanation, order_num FROM problem_examples WHERE problem_id = ? ORDER BY order_num ASC',
    [problem.id]
  );

  // Fetch tags
  const tags = queryAll(
    `SELECT t.id, t.name, t.slug 
     FROM tags t 
     JOIN problem_tags pt ON pt.tag_id = t.id 
     WHERE pt.problem_id = ?`,
    [problem.id]
  );

  // Fetch visible sample test cases only for students
  const sampleTestCases = queryAll(
    `SELECT id, order_num as testCaseNumber, input, expected_output as expectedOutput, test_type as testType
     FROM test_cases
     WHERE problem_id = ? AND is_hidden = 0
     ORDER BY order_num ASC`,
    [problem.id]
  );

  // Check user progress
  let userStatus = null;
  if (userId) {
    const progress = queryOne(
      'SELECT status FROM user_progress WHERE user_id = ? AND problem_id = ?',
      [userId, problem.id]
    );
    userStatus = progress ? progress.status : null;
  }

  // Strip confidential reference solution unless admin
  if (!isAdmin) {
    delete problem.reference_solution;
  }

  res.json({
    problem: {
      ...problem,
      ...levelMetadata(problem),
      examples,
      tags,
      sampleTestCases,
      userStatus,
    },
  });
}

export async function runCode(req: AuthRequest, res: Response): Promise<void> {
  const { slug } = req.params;
  const { language, code, customInput } = req.body;

  if (!['c','cpp','java','python'].includes(language) || typeof code !== 'string' || !code.trim()) {
    res.status(400).json({ error: 'A supported language and non-empty code are required' });
    return;
  }

  const problem = queryOne('SELECT id, time_limit_ms, memory_limit_mb FROM problems WHERE slug = ?', [slug]);
  if (!problem) {
    res.status(404).json({ error: 'Problem not found' });
    return;
  }

  let testCasesToRun: any[] = [];

  if (customInput !== undefined && customInput !== null && customInput !== '') {
    // Run against user's custom input
    testCasesToRun = [
      {
        testCaseNumber: 1,
        input: String(customInput),
        expectedOutput: '',
        isHidden: false,
        testType: 'custom',
      },
    ];
  } else {
    // Run against visible sample test cases
    testCasesToRun = queryAll(
      `SELECT id, order_num as testCaseNumber, input, expected_output as expectedOutput, is_hidden as isHidden, test_type as testType
       FROM test_cases
       WHERE problem_id = ? AND is_hidden = 0
       ORDER BY order_num ASC`,
      [problem.id]
    ).map((tc: any) => ({
      ...tc,
      isHidden: tc.isHidden === 1,
    }));

    if (testCasesToRun.length === 0) {
      res.status(400).json({ error: 'No visible sample tests are available. Use custom input.' });
      return;
    }
  }

  const result = await judgeSubmission(
    language as SupportedLanguage,
    code,
    testCasesToRun,
    {
      timeLimitMs: problem.time_limit_ms || 2500,
      memoryLimitMb: problem.memory_limit_mb || 256,
    }
  );

  res.json({ result });
}

export async function submitCode(req: AuthRequest, res: Response): Promise<void> {
  const { slug } = req.params;
  const { language, code } = req.body;
  const userId = req.user?.id;

  if (!['c','cpp','java','python'].includes(language) || typeof code !== 'string' || !code.trim()) {
    res.status(400).json({ error: 'A supported language and non-empty code are required' });
    return;
  }

  const problem = queryOne('SELECT id, time_limit_ms, memory_limit_mb FROM problems WHERE slug = ?', [slug]);
  if (!problem) {
    res.status(404).json({ error: 'Problem not found' });
    return;
  }

  // Fetch all test cases (both visible and hidden)
  const testCases = queryAll(
    `SELECT id, order_num as testCaseNumber, input, expected_output as expectedOutput, is_hidden as isHidden, test_type as testType
     FROM test_cases
     WHERE problem_id = ?
     ORDER BY order_num ASC`,
    [problem.id]
  ).map((tc: any) => ({
    ...tc,
    isHidden: tc.isHidden === 1,
  }));

  if (!testCases.length) {
    res.status(400).json({ error: 'No test cases are configured for this problem' });
    return;
  }

  const judgeResult = await judgeSubmission(
    language as SupportedLanguage,
    code,
    testCases,
    {
      timeLimitMs: problem.time_limit_ms || 2500,
      memoryLimitMb: problem.memory_limit_mb || 256,
    }
  );

  const submissionId = uuidv4();
  const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';

  // Ensure anonymous/guest user exists if not logged in
  if (!userId) {
    execute(
      `INSERT OR IGNORE INTO users (id, username, email, password_hash, role)
       VALUES (?, 'guest', 'guest@platform.edu', 'none', 'student')`,
      [effectiveUserId]
    );
  }

  // Save submission
  execute(
    `INSERT INTO submissions (
      id, user_id, problem_id, language, code, verdict, passed_count, total_count,
      execution_time_ms, memory_used_kb, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      submissionId,
      effectiveUserId,
      problem.id,
      language,
      code,
      judgeResult.verdict,
      judgeResult.passedCount,
      judgeResult.totalCount,
      judgeResult.executionTimeMs,
      judgeResult.memoryUsedKb,
      judgeResult.compileError || judgeResult.runtimeError || null,
    ]
  );

  // Save individual test case results
  for (const tr of judgeResult.testCaseResults) {
    execute(
      `INSERT INTO submission_results (
        id, submission_id, test_case_id, test_case_number, status, input_preview,
        expected_output, actual_output, execution_time_ms, memory_used_kb, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        submissionId,
        tr.testCaseId || null,
        tr.testCaseNumber,
        tr.status,
        tr.isHidden ? '[Hidden]' : tr.inputPreview,
        tr.isHidden ? '[Hidden]' : tr.expectedOutput,
        tr.isHidden ? '[Hidden]' : tr.actualOutput,
        tr.executionTimeMs,
        tr.memoryUsedKb,
        tr.isHidden ? (tr.errorMessage ? 'Hidden test execution failed' : null) : tr.errorMessage || null,
      ]
    );
  }

  // Update user progress if logged in
  if (userId) {
    const isAccepted = judgeResult.verdict === 'Accepted';
    const existingProgress = queryOne(
      'SELECT status FROM user_progress WHERE user_id = ? AND problem_id = ?',
      [userId, problem.id]
    );

    if (!existingProgress) {
      execute(
        'INSERT INTO user_progress (user_id, problem_id, status, solved_at) VALUES (?, ?, ?, ?)',
        [userId, problem.id, isAccepted ? 'solved' : 'attempted', isAccepted ? new Date().toISOString() : null]
      );
    } else if (isAccepted && existingProgress.status !== 'solved') {
      execute(
        'UPDATE user_progress SET status = ?, solved_at = ? WHERE user_id = ? AND problem_id = ?',
        ['solved', new Date().toISOString(), userId, problem.id]
      );
    }
  }

  res.json({
    submissionId,
    verdict: judgeResult.verdict,
    passedCount: judgeResult.passedCount,
    totalCount: judgeResult.totalCount,
    executionTimeMs: judgeResult.executionTimeMs,
    memoryUsedKb: judgeResult.memoryUsedKb,
    compileError: judgeResult.compileError,
    testCaseResults: judgeResult.testCaseResults.map(tc => ({
      testCaseNumber: tc.testCaseNumber,
      status: tc.status,
      isHidden: tc.isHidden,
      inputPreview: tc.isHidden ? '[Hidden Test Case]' : tc.inputPreview,
      expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
      actualOutput: tc.isHidden ? '[Hidden]' : tc.actualOutput,
      executionTimeMs: tc.executionTimeMs,
      errorMessage: tc.isHidden ? (tc.errorMessage ? 'Hidden test execution failed' : undefined) : tc.errorMessage,
    })),
  });
}
