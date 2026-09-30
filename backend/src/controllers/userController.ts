import { Response } from 'express';
import { queryAll, queryOne } from '../models/db.js';
import { AuthRequest } from '../middleware/auth.js';

export function getUserProgress(req: AuthRequest, res: Response): void {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Authentication required for progress' });
    return;
  }

  // Total problems by difficulty
  const counts = queryAll(`
    SELECT 
      difficulty,
      COUNT(*) as total
    FROM problems
    WHERE is_published = 1
    GROUP BY difficulty
  `);

  let totalProblems = 0;
  let totalEasy = 0;
  let totalMedium = 0;
  let totalHard = 0;

  for (const c of counts) {
    totalProblems += Number(c.total);
    if (c.difficulty === 'Easy') totalEasy = Number(c.total);
    if (c.difficulty === 'Medium') totalMedium = Number(c.total);
    if (c.difficulty === 'Hard') totalHard = Number(c.total);
  }

  // Solved problems by difficulty
  const solvedCounts = queryAll(`
    SELECT 
      p.difficulty,
      COUNT(DISTINCT up.problem_id) as count
    FROM user_progress up
    JOIN problems p ON p.id = up.problem_id
    WHERE up.user_id = ? AND up.status = 'solved'
    GROUP BY p.difficulty
  `, [userId]);

  let solvedEasy = 0;
  let solvedMedium = 0;
  let solvedHard = 0;

  for (const sc of solvedCounts) {
    if (sc.difficulty === 'Easy') solvedEasy = Number(sc.count);
    if (sc.difficulty === 'Medium') solvedMedium = Number(sc.count);
    if (sc.difficulty === 'Hard') solvedHard = Number(sc.count);
  }

  const totalSolved = solvedEasy + solvedMedium + solvedHard;

  // Attempted problems count
  const attemptedRow = queryOne(`
    SELECT COUNT(DISTINCT problem_id) as count
    FROM user_progress
    WHERE user_id = ? AND status = 'attempted'
  `, [userId]);
  const totalAttempted = Number(attemptedRow?.count || 0);

  // Submissions stats
  const subStats = queryOne(`
    SELECT 
      COUNT(*) as total_submissions,
      SUM(CASE WHEN verdict = 'Accepted' THEN 1 ELSE 0 END) as accepted_submissions
    FROM submissions
    WHERE user_id = ?
  `, [userId]);

  const totalSubmissions = Number(subStats?.total_submissions || 0);
  const acceptedSubmissions = Number(subStats?.accepted_submissions || 0);
  const accuracy = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

  // Solved tags distribution
  const solvedTags = queryAll(`
    SELECT t.name, t.slug, COUNT(DISTINCT up.problem_id) as count
    FROM user_progress up
    JOIN problem_tags pt ON pt.problem_id = up.problem_id
    JOIN tags t ON t.id = pt.tag_id
    WHERE up.user_id = ? AND up.status = 'solved'
    GROUP BY t.id
    ORDER BY count DESC
  `, [userId]);

  // Recent 5 submissions
  const recentSubmissions = queryAll(`
    SELECT 
      s.id, s.language, s.verdict, s.passed_count, s.total_count,
      s.execution_time_ms, s.created_at,
      p.title as problem_title, p.slug as problem_slug, p.difficulty
    FROM submissions s
    JOIN problems p ON p.id = s.problem_id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC
    LIMIT 6
  `, [userId]);

  res.json({
    stats: {
      totalProblems,
      totalSolved,
      totalAttempted,
      totalSubmissions,
      accuracy,
      difficulty: {
        easy: { solved: solvedEasy, total: totalEasy },
        medium: { solved: solvedMedium, total: totalMedium },
        hard: { solved: solvedHard, total: totalHard },
      },
      solvedTags,
      recentSubmissions,
    },
  });
}
