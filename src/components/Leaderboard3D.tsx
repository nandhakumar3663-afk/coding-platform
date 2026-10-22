import React from 'react';

const FALLBACK_LEADERS = [
  { rank: 1, username: "Arjun_Dev", score: 2840, problems_solved: 432, streak: 45 },
  { rank: 2, username: "SarahConnor", score: 2690, problems_solved: 398, streak: 32 },
  { rank: 3, username: "Nandha_PS", score: 2540, problems_solved: 375, streak: 28 },
  { rank: 4, username: "Alex_Tech", score: 2410, problems_solved: 340, streak: 19 },
  { rank: 5, username: "Kavya_R", score: 2280, problems_solved: 310, streak: 14 },
];

export const Leaderboard3D: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto perspective-1500">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Global Leaderboard</h2>
        <p className="text-xs text-slate-400 font-mono">Top competitive developers</p>
      </div>

      <div className="glass-panel-3d rounded-2xl overflow-hidden border border-white/10 shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs font-mono text-slate-400 uppercase border-b border-white/5">
            <tr>
              <th className="px-6 py-3">Rank</th>
              <th className="px-6 py-3">Developer</th>
              <th className="px-6 py-3">Solved</th>
              <th className="px-6 py-3">Score</th>
              <th className="px-6 py-3 text-right">Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {FALLBACK_LEADERS.map((row) => (
              <tr key={row.rank} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-3.5 font-mono font-bold text-slate-200">#{row.rank}</td>
                <td className="px-6 py-3.5 font-semibold text-white">{row.username}</td>
                <td className="px-6 py-3.5 font-mono text-slate-300">{row.problems_solved}</td>
                <td className="px-6 py-3.5 font-mono text-indigo-400 font-bold">{row.score}</td>
                <td className="px-6 py-3.5 font-mono text-right text-amber-400">🔥 {row.streak}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
