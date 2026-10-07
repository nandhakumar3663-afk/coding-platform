export function problemLevel(problem: { level?: string; category?: string }): string {
  return problem.level || (/Level 3/i.test(problem.category || '') ? 'Level 3' : /Level 2/i.test(problem.category || '') ? 'Level 2' : /Level 1/i.test(problem.category || '') ? 'Level 1' : 'Practice');
}

export const levelBadge: Record<string, string> = {
  'Level 1': 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  'Level 2': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  'Level 3': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  Practice: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
};
