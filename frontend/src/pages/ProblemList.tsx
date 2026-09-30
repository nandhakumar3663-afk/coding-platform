import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Search, Filter, CheckCircle2, Circle, XCircle, ChevronRight,
  Zap, Flame, Trophy, Tag, BarChart3
} from 'lucide-react';

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const STATUSES = ['All', 'Solved', 'Attempted', 'Unsolved'];

const diffColor: Record<string, string> = {
  Easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  Hard: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
};

const statusIcon = (status: string | null) => {
  if (status === 'solved') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === 'attempted') return <XCircle className="w-4 h-4 text-amber-400" />;
  return <Circle className="w-4 h-4 text-slate-600" />;
};

export const ProblemList: React.FC = () => {
  const { user } = useAuth();
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');

  useEffect(() => {
    api.getProblems().then(res => {
      setProblems(res.problems);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    problems.forEach(p => p.tags?.forEach((t: any) => tags.add(t.name)));
    return ['All', ...Array.from(tags)];
  }, [problems]);

  const filtered = useMemo(() => {
    return problems.filter(p => {
      if (difficulty !== 'All' && p.difficulty !== difficulty) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
          !String(p.problem_number).includes(search) && !(p.category || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter === 'Solved' && p.user_status !== 'solved') return false;
      if (statusFilter === 'Attempted' && p.user_status !== 'attempted') return false;
      if (statusFilter === 'Unsolved' && p.user_status) return false;
      if (tagFilter !== 'All' && !p.tags?.some((t: any) => t.name === tagFilter)) return false;
      return true;
    });
  }, [problems, difficulty, search, statusFilter, tagFilter]);

  const counts = useMemo(() => ({
    total: problems.length,
    easy: problems.filter(p => p.difficulty === 'Easy').length,
    medium: problems.filter(p => p.difficulty === 'Medium').length,
    hard: problems.filter(p => p.difficulty === 'Hard').length,
    solved: problems.filter(p => p.user_status === 'solved').length,
  }), [problems]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium mb-1">
            <BarChart3 className="w-3.5 h-3.5" /><span>Total</span>
          </div>
          <div className="text-2xl font-bold text-white">{counts.total}</div>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-medium mb-1">
            <Zap className="w-3.5 h-3.5" /><span>Easy</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{counts.easy}</div>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-medium mb-1">
            <Flame className="w-3.5 h-3.5" /><span>Medium</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{counts.medium}</div>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-medium mb-1">
            <Trophy className="w-3.5 h-3.5" /><span>Hard</span>
          </div>
          <div className="text-2xl font-bold text-rose-400">{counts.hard}</div>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 col-span-2 md:col-span-1">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-medium mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" /><span>Solved</span>
          </div>
          <div className="text-2xl font-bold text-indigo-400">{counts.solved}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title or problem number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Difficulty filter */}
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
            className="px-3 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 appearance-none cursor-pointer"
          >
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d === 'All' ? 'All Difficulty' : d}</option>)}
          </select>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 appearance-none cursor-pointer"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
          </select>
          {/* Tag filter */}
          <select
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
            className="px-3 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 appearance-none cursor-pointer"
          >
            {allTags.map(t => <option key={t} value={t}>{t === 'All' ? 'All Tags' : t}</option>)}
          </select>
        </div>
      </div>

      {/* Problem Table */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-dark-850 border-b border-dark-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <div className="col-span-1">Status</div>
          <div className="col-span-1">#</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-2">Difficulty</div>
          <div className="col-span-3">Tags</div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">No problems match your filters.</div>
        ) : (
          filtered.map((p, idx) => (
            <Link
              key={p.id}
              to={`/problem/${p.slug}`}
              className={`grid grid-cols-12 gap-2 px-4 py-3.5 items-center hover:bg-dark-850 transition-colors group border-b border-dark-800 last:border-b-0 ${
                idx % 2 === 0 ? '' : 'bg-dark-950/30'
              }`}
            >
              <div className="col-span-1">{statusIcon(p.user_status)}</div>
              <div className="col-span-1 text-slate-400 text-sm font-mono">{p.problem_number}</div>
              <div className="col-span-5 text-sm font-medium text-slate-200 group-hover:text-indigo-400 transition-colors flex items-center space-x-2">
                <span>{p.title}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
              <div className="col-span-2">
                <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-semibold border ${diffColor[p.difficulty] || 'text-slate-400'}`}>
                  {p.difficulty}
                </span>
              </div>
              <div className="col-span-3 flex flex-wrap gap-1">
                {p.tags?.slice(0, 3).map((t: any) => (
                  <span key={t.id} className="px-2 py-0.5 rounded-md bg-dark-800 border border-dark-700 text-[10px] text-slate-400 font-medium">
                    {t.name}
                  </span>
                ))}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};
