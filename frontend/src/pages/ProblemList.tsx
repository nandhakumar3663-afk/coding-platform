import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, Circle, Code2,
  Layers, Search, Sparkles, Terminal, Trophy, XCircle, Zap, Target
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { levelBadge, problemLevel } from '../lib/levels';
import { OrbitShowcase } from '../components/OrbitShowcase';

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
  const levels = ['All', 'Level 1', 'Level 2', 'Level 3', ...(problems.some(p => problemLevel(p) === 'Practice') ? ['Practice'] : [])];
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
  const attempted = problems.filter(p => p.user_status === 'attempted').length;
  const metrics = [
    { label: 'Problem library', value: problems.length, caption: 'Curated challenges', icon: Layers, tone: 'metric-violet' },
    { label: 'Level 1', value: problems.filter(p => problemLevel(p) === 'Level 1').length, caption: 'Build your foundations', icon: Sparkles, tone: 'metric-sky' },
    { label: 'Level 2', value: problems.filter(p => problemLevel(p) === 'Level 2').length, caption: 'Sharpen your patterns', icon: Zap, tone: 'metric-mint' },
    { label: 'Level 3', value: problems.filter(p => problemLevel(p) === 'Level 3').length, caption: 'Take on the challenge', icon: Target, tone: 'metric-amber' },
    { label: 'Solved by you', value: solved, caption: user ? `${attempted} in progress` : 'Sign in to track progress', icon: CheckCircle2, tone: 'metric-rose' },
  ];

  return (
    <div className="home-shell mx-auto animate-fade-in">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="hero-kicker-dot" /> YOUR NEXT LEVEL STARTS HERE</div>
          <h1 id="home-title" className="hero-title">Less scrolling.<span>More solving.</span></h1>
          <p className="hero-description">
            A calmer space to think, code, and get better. Pick a problem, write a solution, and let every small win build your momentum.
          </p>
          <div className="hero-actions">
            <a className="hero-primary" href="#problem-library">Explore problems <ArrowRight size={16} /></a>
            <Link className="hero-secondary" to="/leaderboard"><Trophy size={16} /> Meet the leaderboard <ArrowUpRight size={15} /></Link>
          </div>
          <div className="hero-footnote">
            <span><CheckCircle2 size={14} /> C, C++, Java &amp; Python</span>
            <span><Terminal size={14} /> Real code execution</span>
          </div>
        </div>
        <OrbitShowcase />
      </section>

      <section className="stats-grid stagger-cards" aria-label="Practice overview">
        {metrics.map(({ label, value, caption, icon: Icon, tone }) => (
          <div className={`metric-card ${tone}`} key={label}>
            <div className="metric-head">
              <span className="metric-label">{label}</span>
              <span className="metric-icon"><Icon size={16} /></span>
            </div>
            <p className="metric-value" aria-live="polite">{value}</p>
            <p className="metric-caption">{caption}</p>
          </div>
        ))}
      </section>

      <section id="problem-library" className="library-section scroll-mt-28" aria-labelledby="library-title">
        <div className="library-heading">
          <div>
            <span className="library-eyebrow">The practice room</span>
            <h2 id="library-title" className="library-title">Find your next challenge</h2>
            <p className="library-subtitle">Search by name or topic, or choose a level that fits today.</p>
          </div>
          <div className="library-count"><span>{filtered.length.toLocaleString()}</span> {filtered.length === 1 ? 'problem' : 'problems'}</div>
        </div>

        <div className="level-tabs" aria-label="Filter by level">
          {levels.map(l => (
            <button key={l} type="button" onClick={() => setLevel(l)} aria-pressed={level === l} className="level-tab">
              {l === 'All' ? 'All problems' : l}
            </button>
          ))}
        </div>

        <div className="filters-panel">
          <label className="search-box">
            <Search size={17} aria-hidden="true" />
            <input aria-label="Search questions" placeholder="Search questions, numbers, or topics…" value={search} onChange={e => setSearch(e.target.value)} />
          </label>
          <div className="filters-selects">
            <label className="sr-only" htmlFor="problem-status-filter">Filter by status</label>
            <select id="problem-status-filter" value={status} onChange={e => setStatus(e.target.value)} className="filter-select">
              {['All', 'Solved', 'Attempted', 'Unsolved'].map(s => <option key={s} value={s}>{s === 'All' ? 'All status' : s}</option>)}
            </select>
            <label className="sr-only" htmlFor="problem-topic-filter">Filter by topic</label>
            <select id="problem-topic-filter" value={tag} onChange={e => setTag(e.target.value)} className="filter-select">
              {tags.map(t => <option key={t} value={t}>{t === 'All' ? 'All topics' : t}</option>)}
            </select>
          </div>
        </div>

        {error ? (
          <p role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-rose-400">Could not load questions: {error}</p>
        ) : (
          <div className="problem-table-shell">
            <div className="problem-row problem-table-head px-4 sm:px-5 py-3 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              <span><span className="sm:hidden">Done</span><span className="hidden sm:inline">Status</span></span>
              <span>#</span><span>Question</span><span>Level</span><span className="hidden md:block">Topics</span>
            </div>
            {loading ? (
              <div role="status" className="py-20 text-center text-sm text-slate-400"><span className="inline-block w-5 h-5 mr-2 align-middle border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />Loading your problem library…</div>
            ) : !filtered.length ? (
              <div className="empty-state"><Layers size={27} /><p className="font-semibold text-slate-300">No problems found</p><p className="mt-1 text-sm">Try another search or clear a filter to see more challenges.</p><button type="button" onClick={() => { setSearch(''); setLevel('All'); setStatus('All'); setTag('All'); }} className="mt-4 text-sm font-semibold text-indigo-400 hover:text-indigo-300">Clear all filters</button></div>
            ) : filtered.map(p => (
              <Link key={p.id} to={`/problem/${p.slug}`} className="problem-row problem-row-link px-4 sm:px-5 py-4 border-t border-dark-700/60 group">
                <span aria-label={p.user_status || 'Unsolved'}>
                  {p.user_status === 'solved' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : p.user_status === 'attempted' ? <XCircle className="w-4 h-4 text-amber-400" /> : <Circle className="w-4 h-4 text-slate-500" />}
                </span>
                <span className="font-mono text-xs text-slate-500">{p.problem_number}</span>
                <span className="problem-title min-w-0 text-sm font-semibold flex items-center gap-2">
                  <span className="break-words">{p.title}</span>
                  <ArrowDownRight className="hidden sm:block shrink-0 w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className={`justify-self-start whitespace-nowrap px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold border ${levelBadge[problemLevel(p)]}`}>{problemLevel(p)}</span>
                <span className="hidden md:flex flex-wrap gap-1">
                  {p.tags?.filter((t: any) => !t.slug?.startsWith('level-')).slice(0, 2).map((t: any) => <span key={t.id} className="text-[10px] text-slate-400 bg-dark-800 px-2 py-1 rounded-md">{t.name}</span>)}
                </span>
              </Link>
            ))}
          </div>
        )}
        <div className="catalog-footer">
          <span>{filtered.length} {filtered.length === 1 ? 'challenge' : 'challenges'} shown · {problems.length} total in the library</span>
          <span>{user ? `Practicing as ${user.username}` : 'Sign in to save solves and join the leaderboard'}</span>
        </div>
      </section>
    </div>
  );
};
