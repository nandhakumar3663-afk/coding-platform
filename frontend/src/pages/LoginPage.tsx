import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Terminal, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const from = location.state?.from;
  const destination = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && from !== '/login' ? from : '/';
  if (user) return <Navigate to={destination} replace />;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { await login(username.trim(), password); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.'); }
    finally { setBusy(false); }
  };
  return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-5 py-12">
    <div className="w-full max-w-4xl grid md:grid-cols-2 overflow-hidden rounded-2xl border border-dark-700 bg-dark-900 shadow-2xl">
      <section className="p-8 md:p-12 bg-gradient-to-br from-indigo-950 via-dark-900 to-dark-950 flex flex-col justify-between gap-10">
        <div><Terminal className="h-10 w-10 text-indigo-400 mb-8" /><p className="text-xs uppercase tracking-widest text-indigo-300 mb-4">AlgoSphere / Practice</p>
          <h1 className="text-4xl font-bold text-white leading-tight">A blank editor.<br />A new challenge.</h1>
          <p className="text-slate-400 mt-5 leading-relaxed">Build your problem-solving skills, one solution at a time. Run examples, submit your code, and track your progress.</p></div>
        <div className="flex gap-8 text-slate-400 text-sm"><span><strong className="block text-2xl text-white">109</strong>PDF exercises</span><span><strong className="block text-2xl text-white">4</strong>languages</span></div>
      </section>
      <section className="p-8 md:p-12">
        <h2 className="text-2xl font-bold text-white">Sign in</h2>
        <p className="text-sm text-slate-400 mt-2 mb-8">Use your student or administrator account.</p>
        <form onSubmit={submit} className="space-y-5">
          <div><label htmlFor="username" className="block text-sm text-slate-300 mb-2">Username</label>
            <input id="username" autoComplete="username" autoFocus required value={username} onChange={e => setUsername(e.target.value)} className="w-full rounded-lg bg-dark-950 border border-dark-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label htmlFor="password" className="block text-sm text-slate-300 mb-2">Password</label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg bg-dark-950 border border-dark-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          {error && <p role="alert" className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
          <button disabled={busy} className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-3 text-white font-semibold">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>

        <div className="mt-8 pt-6 border-t border-dark-700">
          <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">Quick Demo Login</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setUsername('user'); setPassword('123'); }}
              className="flex-1 py-2 px-3 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs text-emerald-400 font-medium transition-colors text-center"
            >
              Student (user / 123)
            </button>
            <button
              type="button"
              onClick={() => { setUsername('admin'); setPassword('3663'); }}
              className="flex-1 py-2 px-3 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs text-amber-400 font-medium transition-colors text-center"
            >
              Admin (admin / 3663)
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>;
};
