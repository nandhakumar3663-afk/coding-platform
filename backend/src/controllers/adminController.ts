import { Request, Response } from 'express';
import { queryAll, queryOne, execute } from '../models/db.js';
import { generateAndStoreTestCases } from '../test-generator/testCaseGenerator.js';
import { v4 as uuidv4 } from 'uuid';

export function getAdminProblems(req: Request, res: Response): void {
  const problems = queryAll(`
    SELECT 
      p.*,
      (SELECT COUNT(*) FROM test_cases tc WHERE tc.problem_id = p.id) as test_case_count,
      (SELECT COUNT(*) FROM submissions s WHERE s.problem_id = p.id) as submission_count
    FROM problems p
    ORDER BY p.problem_number ASC
  `);

  for (const p of problems) {
    p.tags = queryAll(
      `SELECT t.id, t.name, t.slug 
       FROM tags t 
       JOIN problem_tags pt ON pt.tag_id = t.id 
       WHERE pt.problem_id = ?`,
      [p.id]
    );
  }

  res.json({ problems });
}

export async function createProblem(req: Request, res: Response): Promise<void> {
  const {
    title,
    difficulty,
    category,
    description,
    constraints,
    input_format,
    output_format,
    starter_c,
    starter_cpp,
    starter_java,
    starter_python,
    reference_solution,
    reference_lang = 'python',
    tags = [],
  } = req.body;

  if (!title || !description || !reference_solution) {
    res.status(400).json({ error: 'Title, description, and reference solution are required' });
    return;
  }

  // Determine next problem number
  const maxNumRow = queryOne('SELECT MAX(problem_number) as max_num FROM problems');
  const problemNumber = (maxNumRow?.max_num || 0) + 1;
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const problemId = uuidv4();

  execute(
    `INSERT INTO problems (
      id, problem_number, title, slug, description, difficulty, category,
      constraints, input_format, output_format,
      starter_c, starter_cpp, starter_java, starter_python,
      reference_solution, reference_lang
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      problemId,
      problemNumber,
      title,
      slug,
      description,
      difficulty || 'Easy',
      category || 'Algorithms',
      constraints || 'None',
      input_format || 'Standard input',
      output_format || 'Standard output',
      starter_c || '#include <stdio.h>\nint main() {\n  return 0;\n}',
      starter_cpp || '#include <iostream>\nusing namespace std;\nint main() {\n  return 0;\n}',
      starter_java || 'public class Main {\n  public static void main(String[] args) {}\n}',
      starter_python || 'def main():\n  pass\nif __name__ == "__main__":\n  main()',
      reference_solution,
      reference_lang,
    ]
  );

  // Link tags
  for (const tagName of tags) {
    const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let tag = queryOne('SELECT id FROM tags WHERE slug = ?', [tagSlug]);
    if (!tag) {
      const tagId = uuidv4();
      execute('INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)', [tagId, tagName, tagSlug]);
      tag = { id: tagId };
    }
    execute('INSERT OR IGNORE INTO problem_tags (problem_id, tag_id) VALUES (?, ?)', [problemId, tag.id]);
  }

  // Automatically generate 5 test cases using the trusted solution!
  const genResult = await generateAndStoreTestCases(
    problemId,
    slug,
    reference_solution,
    reference_lang,
    constraints
  );

  res.status(201).json({
    problem: { id: problemId, problem_number: problemNumber, title, slug },
    generation: genResult,
  });
}

export async function updateProblem(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const {
    title,
    difficulty,
    category,
    description,
    constraints,
    input_format,
    output_format,
    starter_c,
    starter_cpp,
    starter_java,
    starter_python,
    reference_solution,
  } = req.body;

  const existing = queryOne('SELECT * FROM problems WHERE id = ?', [id]);
  if (!existing) {
    res.status(404).json({ error: 'Problem not found' });
    return;
  }

  execute(
    `UPDATE problems SET
      title = COALESCE(?, title),
      difficulty = COALESCE(?, difficulty),
      category = COALESCE(?, category),
      description = COALESCE(?, description),
      constraints = COALESCE(?, constraints),
      input_format = COALESCE(?, input_format),
      output_format = COALESCE(?, output_format),
      starter_c = COALESCE(?, starter_c),
      starter_cpp = COALESCE(?, starter_cpp),
      starter_java = COALESCE(?, starter_java),
      starter_python = COALESCE(?, starter_python),
      reference_solution = COALESCE(?, reference_solution)
     WHERE id = ?`,
    [
      title,
      difficulty,
      category,
      description,
      constraints,
      input_format,
      output_format,
      starter_c,
      starter_cpp,
      starter_java,
      starter_python,
      reference_solution,
      id,
    ]
  );

  res.json({ message: 'Problem updated successfully' });
}

export function deleteProblem(req: Request, res: Response): void {
  const { id } = req.params;
  execute('DELETE FROM problems WHERE id = ?', [id]);
  res.json({ message: 'Problem deleted successfully' });
}

export async function generateTestCasesForProblem(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const problem = queryOne('SELECT * FROM problems WHERE id = ?', [id]);
  if (!problem) {
    res.status(404).json({ error: 'Problem not found' });
    return;
  }

  const examples = queryAll('SELECT input FROM problem_examples WHERE problem_id = ?', [id]);
  const sampleInputs = examples.map((e: any) => e.input);

  const genResult = await generateAndStoreTestCases(
    problem.id,
    problem.slug,
    problem.reference_solution,
    problem.reference_lang || 'python',
    problem.constraints,
    sampleInputs
  );

  if (!genResult.success) {
    res.status(400).json({ error: genResult.message });
    return;
  }

  res.json({
    message: genResult.message,
    testCases: genResult.testCases,
  });
}

export function getProblemTestCases(req: Request, res: Response): void {
  const { id } = req.params;

  const testCases = queryAll(
    'SELECT * FROM test_cases WHERE problem_id = ? ORDER BY order_num ASC',
    [id]
  );

  res.json({ testCases });
}

export function toggleTestCaseVisibility(req: Request, res: Response): void {
  const { testCaseId } = req.params;
  const tc = queryOne('SELECT is_hidden FROM test_cases WHERE id = ?', [testCaseId]);
  if (!tc) {
    res.status(404).json({ error: 'Test case not found' });
    return;
  }

  const newHidden = tc.is_hidden === 1 ? 0 : 1;
  execute('UPDATE test_cases SET is_hidden = ? WHERE id = ?', [newHidden, testCaseId]);

  res.json({ is_hidden: newHidden });
}

export function getAdminStats(req: Request, res: Response): void {
  const totalUsers = queryOne('SELECT COUNT(*) as count FROM users');
  const totalProblems = queryOne('SELECT COUNT(*) as count FROM problems');
  const totalSubmissions = queryOne('SELECT COUNT(*) as count FROM submissions');
  const totalTestCases = queryOne('SELECT COUNT(*) as count FROM test_cases');

  const verdictDistribution = queryAll(`
    SELECT verdict, COUNT(*) as count 
    FROM submissions 
    GROUP BY verdict
  `);

  const languageDistribution = queryAll(`
    SELECT language, COUNT(*) as count 
    FROM submissions 
    GROUP BY language
  `);

  const recentFailures = queryAll(`
    SELECT s.id, s.language, s.verdict, s.created_at, p.title as problem_title, u.username
    FROM submissions s
    JOIN problems p ON p.id = s.problem_id
    JOIN users u ON u.id = s.user_id
    WHERE s.verdict != 'Accepted'
    ORDER BY s.created_at DESC
    LIMIT 10
  `);

  res.json({
    counts: {
      users: totalUsers?.count || 0,
      problems: totalProblems?.count || 0,
      submissions: totalSubmissions?.count || 0,
      testCases: totalTestCases?.count || 0,
    },
    verdicts: verdictDistribution,
    languages: languageDistribution,
    recentFailures,
  });
}
