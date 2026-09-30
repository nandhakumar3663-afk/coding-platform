import React, { useState } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { Terminal, ArrowRight, Loader2, Lock, User, Eye, EyeOff, ShieldCheck, GraduationCap, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const from = location.state?.from;
  const destination = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && from !== '/login' ? from : '/';

  if (user) return <Navigate to={destination} replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please verify your details.');
    } finally {
      setBusy(false);
    }
  };

  const handleQuickLogin = async (role: 'student' | 'admin') => {
    setError('');
    setBusy(true);
    try {
      if (role === 'admin') {
        await login('admin', '3663');
      } else {
        await login('user', '123');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient decorative glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-4xl grid md:grid-cols-2 overflow-hidden rounded-2xl border border-dark-700/80 bg-dark-900/90 backdrop-blur-xl shadow-2xl shadow-black/60 relative z-10 animate-fade-in">
        {/* Left Hero Branding Section */}
        <section className="p-8 md:p-12 bg-gradient-to-br from-indigo-950/80 via-dark-900 to-dark-950 flex flex-col justify-between gap-8 border-b md:border-b-0 md:border-r border-dark-700/50">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 mb-8">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <Terminal className="h-6 w-6" />
              </div>
              <span className="text-xs uppercase tracking-widest font-bold text-indigo-300">AlgoSphere Judge</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight">
              A blank editor.<br />
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                A new challenge.
              </span>
            </h1>

            <p className="text-slate-400 mt-4 text-sm leading-relaxed">
              Step into an industry-grade coding arena. Write, run, and benchmark your code in C, C++, Java, and Python with automated hidden test evaluation.
            </p>
          </div>

          <div className="space-y-4 pt-6 border-t border-dark-700/60">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-dark-850/60 border border-dark-700/60">
                <strong className="block text-2xl font-bold text-white">109</strong>
                <span className="text-xs text-slate-400">Curated Problems</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-850/60 border border-dark-700/60">
                <strong className="block text-2xl font-bold text-white">4</strong>
                <span className="text-xs text-slate-400">Core Compilers</span>
              </div>
            </div>

            <Link
              to="/"
              className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors"
            >
              <span>← Browse problem catalog as guest</span>
            </Link>
          </div>
        </section>

        {/* Right Form Section */}
        <section className="p-8 md:p-12 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
              <p className="text-xs text-slate-400 mt-1">Sign in with your credentials to submit solutions and track progress.</p>
            </div>

            {error && (
              <div role="alert" className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-2 animate-slide-down">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="username"
                    autoComplete="username"
                    autoFocus
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full rounded-xl bg-dark-950/80 border border-dark-700/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-dark-950/80 border border-dark-700/80 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 px-4 py-2.5 text-sm text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.99]"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{busy ? 'Authenticating…' : 'Sign in'}</span>
              </button>
            </form>
          </div>

          {/* Quick Access Switchers without showing plain passwords */}
          <div className="mt-8 pt-5 border-t border-dark-700/60">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-2.5 text-center">
              Quick One-Click Access
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => handleQuickLogin('student')}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-700/70 hover:border-emerald-500/40 text-xs text-emerald-400 font-medium transition-all group active:scale-[0.98]"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400/80 group-hover:scale-110 transition-transform" />
                <span>Student</span>
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => handleQuickLogin('admin')}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-700/70 hover:border-amber-500/40 text-xs text-amber-400 font-medium transition-all group active:scale-[0.98]"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400/80 group-hover:scale-110 transition-transform" />
                <span>Administrator</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
