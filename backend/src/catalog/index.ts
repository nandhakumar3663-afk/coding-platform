import definitions from './problems.json' with { type: 'json' };
export const catalog = definitions;
export const catalogBySlug = new Map(catalog.map(problem => [problem.slug, problem]));
