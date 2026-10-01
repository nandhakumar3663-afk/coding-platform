import { catalogBySlug } from './index.js';

export function levelForProblem(problem: { slug: string; category: string }): string {
  return catalogBySlug.get(problem.slug)?.source || (/Level 3/i.test(problem.category) ? 'Level 3' : /Level 2/i.test(problem.category) ? 'Level 2' : 'Practice');
}

export function levelMetadata(problem: { slug: string; category: string }) {
  return { level: levelForProblem(problem), level_question_number: catalogBySlug.get(problem.slug)?.source_number ?? null };
}
