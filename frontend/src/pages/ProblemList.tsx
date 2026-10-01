import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { levelBadge, problemLevel } from '../lib/levels';
import { Search, CheckCircle2, Circle, XCircle, ChevronRight, Layers, Trophy, ArrowUpRight } from 'lucide-react';

export const ProblemList: React.FC = () => {
  const { user } = useAuth();
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('All');
  const [status, setStatus] = useState('All');
  const [tag, setTag] = useState('All');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.getProblems().then(res => { if (active) setProblems(res.problems); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id]);
  const tags = useMemo(() => ['All', ...new Set<string>(problems.flatMap(p => p.tags?.map((t: any) => t.name) || []))], [problems]);
  const levels = ['All', 'Level 2', 'Level 3', ...(problems.some(p => problemLevel(p) === 'Practice') ? ['Practice'] : [])];
  const filtered = problems.filter(p => {
    if (level !== 'All' && problemLevel(p) !== level) return false;
    if (status === 'Solved' && p.user_status !== 'solved') return false;
    if (status === 'Attempted' && p.user_status !== 'attempted') return false;
    if (status === 'Unsolved' && p.user_status) return false;
    if (tag !== 'All' && !p.tags?.some((t: any) => t.name === tag)) return false;
    const query = search.trim().toLowerCase();
    return !query || `${p.title} ${p.problem_number} ${p.category} ${problemLevel(p)}`.toLowerCase().includes(query);
  });
  const solved = problems.filter(p => p.user_status === 'solved').length;
  const inputClass = 'bg-dark-900 border border-dark-700 rounded-xl py-2.5 px-3 text-sm text-slate-300';
  return <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10 animate-fade-in">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
      <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">Your daily practice space</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-strong tracking-tight">Build skill. Solve one more.</h1>
        <p className="mt-3 text-sm text-slate-400">Work through Level 2 and Level 3. Your code stays saved in this browser.</p></div>
      <Link to="/leaderboard" className="flex items-center gap-2 text-sm font-semibold text-indigo-400 shrink-0"><Trophy className="w-4 h-4" />View leaderboard<ArrowUpRight className="w-4 h-4" /></Link>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7 stagger-cards">
      {[['Total questions', problems.length], ['Level 2', problems.filter(p => problemLevel(p) === 'Level 2').length], ['Level 3', problems.filter(p => problemLevel(p) === 'Level 3').length], ['Your solves', solved]].map(([label, count]) =>
        <div key={label} className="stat-card bg-dark-900 border border-dark-700 rounded-2xl p-5"><p className="text-xs text-slate-400 mb-2">{label}</p><p className="text-3xl font-bold text-strong">{count}</p></div>)}
    </div>
    <div className="flex flex-wrap gap-2 mb-5" aria-label="Filter by level">
      {levels.map(l => <button key={l} onClick={() => setLevel(l)} aria-pressed={level === l}
        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${level === l ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-dark-900 text-slate-400 border-dark-700 hover:border-indigo-500/50'}`}>{l === 'All' ? 'All questions' : l}</button>)}
    </div>
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <div className="relative flex-1"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" /><input aria-label="Search questions" placeholder="Search questions, numbers, or topics…" value={search} onChange={e => setSearch(e.target.value)} className={`${inputClass} w-full pl-10`} /></div>
      <div className="flex gap-3"><select aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)} className={`${inputClass} flex-1 sm:flex-none`}>{['All', 'Solved', 'Attempted', 'Unsolved'].map(s => <option key={s} value={s}>{s === 'All' ? 'All status' : s}</option>)}</select>
        <select aria-label="Filter by topic" value={tag} onChange={e => setTag(e.target.value)} className={`${inputClass} flex-1 min-w-0 sm:flex-none`}>{tags.map(t => <option key={t} value={t}>{t === 'All' ? 'All topics' : t}</option>)}</select></div>
    </div>
    {error ? <p role="alert" className="p-6 rounded-xl border border-rose-500/30 text-rose-400">Could not load questions: {error}</p> :
      <div className="bg-dark-900 border border-dark-700 rounded-2xl overflow-hidden">
        <div className="problem-row bg-dark-850 px-4 sm:px-5 py-3 text-xs uppercase tracking-wider font-semibold text-slate-500"><span><span className="sm:hidden">Done</span><span className="hidden sm:inline">Status</span></span><span>#</span><span>Question</span><span>Level</span><span className="hidden md:block">Topics</span></div>
        {loading ? <div role="status" className="py-20 text-center text-slate-400">Loading questions…</div> : !filtered.length ? <div className="py-16 text-center text-slate-400"><Layers className="w-7 h-7 mx-auto mb-3" />No questions match these filters.</div> : filtered.map(p =>
          <Link key={p.id} to={`/problem/${p.slug}`} className="problem-row px-4 sm:px-5 py-4 border-t border-dark-700/60 hover:bg-dark-850 group transition-colors">
            <span aria-label={p.user_status || 'Unsolved'}>{p.user_status === 'solved' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : p.user_status === 'attempted' ? <XCircle className="w-4 h-4 text-amber-400" /> : <Circle className="w-4 h-4 text-slate-500" />}</span>
            <span className="font-mono text-xs text-slate-500">{p.problem_number}</span>
            <span className="min-w-0 text-sm text-slate-200 group-hover:text-indigo-400 font-medium flex items-center gap-2"><span className="break-words">{p.title}</span><ChevronRight className="hidden sm:block shrink-0 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></span>
            <span className={`justify-self-start whitespace-nowrap px-2 py-1 rounded-lg text-[11px] font-semibold border ${levelBadge[problemLevel(p)]}`}>{problemLevel(p)}</span>
            <span className="hidden md:flex flex-wrap gap-1">{p.tags?.filter((t: any) => !t.slug?.startsWith('level-')).slice(0, 2).map((t: any) => <span key={t.id} className="text-[10px] text-slate-400 bg-dark-800 px-2 py-1 rounded-md">{t.name}</span>)}</span>
          </Link>)}
      </div>}
    <p className="text-xs text-slate-500 mt-4">{filtered.length} questions · {user ? `Practicing as ${user.username}` : 'Sign in to track solves and join the leaderboard'}</p>
  </div>;
};
