import React, { useState } from 'react';

interface Navbar3DProps {
  streakCount?: number;
  userName?: string;
  userRank?: string;
}

export const Navbar3D: React.FC<Navbar3DProps> = ({
  streakCount = 14,
  userName = "Nandha_PS",
  userRank = "#3"
}) => {
  const [activeTab, setActiveTab] = useState<'problems' | 'compiler' | 'leaderboard' | 'contests'>('problems');

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-3 perspective-1000">
      <nav className="max-w-7xl mx-auto glass-panel-3d rounded-2xl px-6 py-3 flex items-center justify-between border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/30">
            <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300 font-extrabold text-xl">
                &lt;/&gt;
              </span>
            </div>
          </div>
          <div>
            <h1 className="text-white font-bold tracking-tight text-lg leading-tight">CodePlatform</h1>
            <p className="text-xs text-indigo-300/70 font-mono">v2.0 • 3D Engine</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-white/5">
          {(['problems', 'compiler', 'leaderboard', 'contests'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-600/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs font-semibold">
            <span>🔥 {streakCount}d Streak</span>
          </div>
          <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px]">
              <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center font-bold text-sm text-white">
                {userName[0]}
              </div>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-none">{userName}</p>
              <p className="text-[10px] font-mono text-cyan-400 leading-none mt-1">{userRank}</p>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
