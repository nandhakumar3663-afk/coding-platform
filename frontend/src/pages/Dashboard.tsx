import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Trophy, Target, BarChart3, CheckCircle2, Flame, Zap,
  Activity, Clock, Code2, TrendingUp
} from 'lucide-react';

const diffBg: Record<string, string> = {
  easy: 'from-emerald-600 to-emerald-500',
  medium: 'from-amber-600 to-amber-500',
  hard: 'from-rose-600 to-rose-500',
};
const diffTrack: Record<string, string> = {
  easy: 'bg-emerald-500/20',
  medium: 'bg-amber-500/20',
  hard: 'bg-rose-500/20',
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.getUserProgress().then(res => {
        setStats(res.stats);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-slate-400">
        <Trophy className="w-12 h-12 text-slate-600 mb-4" />
        <p className="text-lg font-medium">Sign in to view your dashboard</p>
      </div>
    );
  }

  if (!stats) return null;

  const totalSolved = stats.totalSolved || 0;
  const totalProblems = stats.totalProblems || 1;
  const solvedPct = Math.round((totalSolved / totalProblems) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Welcome back, <span className="text-indigo-400 font-semibold">{user.username}</span></p>
      </div>

      {/* Top row stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 hover:border-dark-600 transition-colors">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-medium mb-2">
            <Target className="w-4 h-4" /><span>Solved</span>
          </div>
          <div className="text-3xl font-bold text-white">{totalSolved}</div>
          <div className="text-xs text-slate-500 mt-1">of {totalProblems} total</div>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 hover:border-dark-600 transition-colors">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-medium mb-2">
            <Activity className="w-4 h-4" /><span>Attempted</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalAttempted}</div>
          <div className="text-xs text-slate-500 mt-1">still in progress</div>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 hover:border-dark-600 transition-colors">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-medium mb-2">
            <TrendingUp className="w-4 h-4" /><span>Accuracy</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.accuracy}%</div>
          <div className="text-xs text-slate-500 mt-1">acceptance rate</div>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 hover:border-dark-600 transition-colors">
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-medium mb-2">
            <Code2 className="w-4 h-4" /><span>Submissions</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalSubmissions}</div>
          <div className="text-xs text-slate-500 mt-1">total attempts</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress by difficulty */}
        <div className="lg:col-span-2 bg-dark-900 border border-dark-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-5 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" /><span>Progress by Difficulty</span>
          </h2>
          <div className="space-y-5">
            {(['easy', 'medium', 'hard'] as const).map(key => {
              const d = stats.difficulty[key];
              const pct = d.total > 0 ? Math.round((d.solved / d.total) * 100) : 0;
              const label = key.charAt(0).toUpperCase() + key.slice(1);
              const Icon = key === 'easy' ? Zap : key === 'medium' ? Flame : Trophy;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon className={`w-4 h-4 ${key === 'easy' ? 'text-emerald-400' : key === 'medium' ? 'text-amber-400' : 'text-rose-400'}`} />
                      <span className="text-sm font-medium text-slate-300">{label}</span>
                    </div>
                    <span className="text-sm font-mono text-slate-400">{d.solved} / {d.total}</span>
                  </div>
                  <div className={`h-3 rounded-full ${diffTrack[key]} overflow-hidden`}>
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${diffBg[key]} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Solved ring */}
          <div className="mt-8 flex items-center justify-center">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#232d45" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="url(#grad)" strokeWidth="10"
                  strokeDasharray={`${solvedPct * 3.27} 327`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{solvedPct}%</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Complete</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-400" /><span>Recent Submissions</span>
          </h2>
          {stats.recentSubmissions?.length > 0 ? (
            <div className="space-y-2">
              {stats.recentSubmissions.map((s: any) => (
                <div key={s.id} className="p-3 bg-dark-850 border border-dark-700 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-300 truncate max-w-[140px]">{s.problem_title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      s.verdict === 'Accepted'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    }`}>
                      {s.verdict === 'Accepted' ? 'AC' : s.verdict.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[10px] text-slate-500">
                    <span className="uppercase font-mono">{s.language}</span>
                    <span>{s.passed_count}/{s.total_count}</span>
                    <span>{s.execution_time_ms}ms</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500 text-sm py-8">No submissions yet</div>
          )}
        </div>
      </div>
    </div>
  );
};
