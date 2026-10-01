import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Trophy, RefreshCw, ChevronLeft, ChevronRight, Medal } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{ entries: any[]; totalUsers: number; currentUser: any } | null>(null);
  const [offset, setOffset] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const load = () => {
      setLoading(true);
      api.getLeaderboard(offset).then(res => { if (active) { setData(res); setError(''); } })
        .catch(err => { if (active) setError(err.message); })
        .finally(() => { if (active) setLoading(false); });
    };
    load();
    window.addEventListener('focus', load);
    return () => { active = false; window.removeEventListener('focus', load); };
  }, [user?.id, offset, refresh]);
  return <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10 animate-fade-in">
    <div className="flex items-center justify-between gap-3 mb-7">
      <div><p className="text-xs uppercase tracking-widest font-bold text-indigo-400 mb-3">A little friendly competition</p><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-strong">Leaderboard</h1><p className="mt-3 text-sm text-slate-400">Every solved question counts. See how you’re progressing together.</p></div>
      <button onClick={() => setRefresh(n => n + 1)} disabled={loading} aria-label="Refresh leaderboard" className="shrink-0 flex items-center gap-2 bg-dark-900 border border-dark-700 p-3 rounded-xl text-slate-300 hover:text-indigo-400 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /><span className="hidden sm:block text-xs">Refresh</span></button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7 stagger-cards">
      {[['Your rank', data?.currentUser ? `#${data.currentUser.rank}` : user ? '—' : 'Sign in'], ['Your points', data?.currentUser?.points ?? 0], ['Coders', data?.totalUsers ?? 0]].map(([label, value]) => <div key={label} className="stat-card bg-dark-900 rounded-2xl border border-dark-700 p-5"><p className="text-xs text-slate-400 mb-2">{label}</p><p className="text-3xl font-bold text-strong">{value}</p></div>)}
    </div>
    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6 flex gap-3 items-start"><Trophy className="w-5 h-5 shrink-0 text-indigo-400" /><p className="text-xs leading-relaxed text-slate-300">Level 2: <strong>10 points</strong> · Level 3: <strong>20 points</strong> per solved question. Only accepted submissions count, once per question. Equal points and solve counts share a rank. Admin accounts are excluded.</p></div>
    {error ? <p role="alert" className="text-rose-400 border border-rose-500/30 rounded-xl p-6">Could not load the leaderboard: {error}. Use Refresh to try again.</p> :
      <div className="overflow-x-auto bg-dark-900 rounded-2xl border border-dark-700" aria-busy={loading}>
        <table className="w-full text-left whitespace-nowrap"><thead className="bg-dark-850 text-slate-500 text-[11px] uppercase tracking-wider"><tr>{['Rank', 'Coder', 'Solved', 'Level 2', 'Level 3', 'Points'].map(h => <th key={h} scope="col" className="px-4 sm:px-5 py-4">{h}</th>)}</tr></thead>
          <tbody>{loading ? <tr><td colSpan={6} className="text-center py-16 text-sm text-slate-400">Loading rankings…</td></tr> : !data?.entries.length ? <tr><td colSpan={6} className="text-center py-16 text-sm text-slate-400">No coders yet. Sign in and submit your first solution!</td></tr> : data.entries.map(e => <tr key={e.user_id} className={`border-t border-dark-700/60 transition-colors ${e.user_id === user?.id ? 'bg-indigo-500/10' : 'hover:bg-dark-850'}`}>
            <td className="px-4 sm:px-5 py-4"><span className="flex items-center gap-2 font-mono text-sm text-slate-300">{e.rank <= 3 && e.points > 0 && <Medal className={`w-4 h-4 ${e.rank === 1 ? 'text-amber-400' : e.rank === 2 ? 'text-slate-400' : 'text-orange-400'}`} />}#{e.rank}</span></td>
            <th scope="row" className="px-4 sm:px-5 py-4 text-sm font-semibold text-slate-200"><span className="inline-block max-w-48 truncate align-middle">{e.username}</span>{e.user_id === user?.id && <span className="ml-2 text-[10px] text-indigo-400">YOU</span>}</th>
            <td className="px-4 sm:px-5 py-4 text-sm text-slate-300">{e.solved}</td><td className="px-4 sm:px-5 py-4 text-sm text-emerald-400">{e.level2_solved}</td><td className="px-4 sm:px-5 py-4 text-sm text-amber-400">{e.level3_solved}</td><td className="px-4 sm:px-5 py-4 font-bold text-indigo-400">{e.points}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    <div className="flex items-center justify-between mt-4 gap-3 text-xs text-slate-500"><span>{data?.totalUsers ? `${offset + 1}–${Math.min(offset + 50, data.totalUsers)} of ${data.totalUsers} coders` : 'Rankings update after submissions'}</span><div className="flex gap-2"><button aria-label="Previous page" disabled={!offset || loading} onClick={() => setOffset(n => Math.max(0, n - 50))} className="p-2 rounded-lg border border-dark-700 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button><button aria-label="Next page" disabled={loading || offset + 50 >= (data?.totalUsers || 0)} onClick={() => setOffset(n => n + 50)} className="p-2 rounded-lg border border-dark-700 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button></div></div>
  </div>;
};
