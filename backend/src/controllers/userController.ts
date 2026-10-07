import { Response } from 'express';
import { levelForProblem } from '../catalog/levels.js';
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
    WHERE up.user_id = ? AND up.status = 'solved' AND p.is_published = 1
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
    SELECT COUNT(DISTINCT up.problem_id) as count
    FROM user_progress up JOIN problems p ON p.id = up.problem_id
    WHERE up.user_id = ? AND up.status = 'attempted' AND p.is_published = 1
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
    JOIN problems p ON p.id = up.problem_id
    JOIN problem_tags pt ON pt.problem_id = up.problem_id
    JOIN tags t ON t.id = pt.tag_id
    WHERE up.user_id = ? AND up.status = 'solved' AND p.is_published = 1
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

  const levels: Record<string, { total: number; solved: number }> = {};
  for (const p of queryAll(`SELECT p.slug, p.category, up.status FROM problems p
    LEFT JOIN user_progress up ON up.problem_id = p.id AND up.user_id = ?
    WHERE p.is_published = 1`, [userId])) {
    const level = levelForProblem(p);
    levels[level] ??= { total: 0, solved: 0 };
    levels[level].total++;
    if (p.status === 'solved') levels[level].solved++;
  }

  res.json({
    stats: {
      levels,
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

// Rankings come only from server-verified solved progress, never from browser scores.
export function getLeaderboard(req: AuthRequest, res: Response): void {
  const limit = Number(req.query.limit ?? 50);
  const offset = Number(req.query.offset ?? 0);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0 || offset > 1000000) {
    res.status(400).json({ error: 'limit must be 1–100 and offset must be a non-negative integer up to 1000000' });
    return;
  }
  const users = queryAll(`SELECT id, username FROM users WHERE role = 'student' AND username != 'guest'`);
  const entries = new Map(users.map(u => [u.id, { user_id: u.id, username: u.username, solved: 0, level1_solved: 0, level2_solved: 0, level3_solved: 0, points: 0 }]));
  for (const p of queryAll(`SELECT up.user_id, p.slug, p.category FROM user_progress up
    JOIN problems p ON p.id = up.problem_id WHERE up.status = 'solved' AND p.is_published = 1`)) {
    const entry = entries.get(p.user_id);
    if (!entry) continue;
    const level = levelForProblem(p);
    entry.solved++;
    if (level === 'Level 1') entry.level1_solved++;
    if (level === 'Level 2') entry.level2_solved++;
    if (level === 'Level 3') entry.level3_solved++;
    entry.points += level === 'Level 3' ? 20 : level === 'Level 2' ? 10 : level === 'Level 1' ? 5 : 10;
  }
  const sorted = [...entries.values()].sort((a, b) => b.points - a.points || b.solved - a.solved || a.username.localeCompare(b.username) || a.user_id.localeCompare(b.user_id));
  let rank = 0;
  const ranked = sorted.map((entry, i) => {
    if (!i || entry.points !== sorted[i - 1].points || entry.solved !== sorted[i - 1].solved) rank = i + 1;
    return { ...entry, rank };
  });
  res.json({ entries: ranked.slice(offset, offset + limit), totalUsers: ranked.length, currentUser: ranked.find(e => e.user_id === req.user?.id) || null });
}
