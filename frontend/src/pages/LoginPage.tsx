import React, { useState } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { Terminal, ArrowRight, Loader2, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { user, login, loginWithGoogle } = useAuth();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
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
      await login(identifier.trim(), password);
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials. Please verify your details.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setBusy(true);
    try {
      if (from && destination !== '/') {
        sessionStorage.setItem('oauth_return_to', destination);
      }
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize Google sign-in.');
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
              <p className="text-xs text-slate-400 mt-1">Sign in with your email or continue with Google.</p>
            </div>

            {error && (
              <div role="alert" className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-2 animate-slide-down">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="identifier" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="identifier"
                    autoComplete="username"
                    autoFocus
                    required
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl bg-dark-950/80 border border-dark-700/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
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

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-dark-900 px-3 text-slate-500 font-semibold tracking-wider">
                  OR
                </span>
              </div>
            </div>

            {/* Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={busy}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-medium px-4 py-2.5 text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.76-2.1-6.7-4.93H1.27v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.04 0 12s.46 3.8 1.27 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.27 6.58l4.03 3.15c.94-2.83 3.58-4.98 6.7-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 pt-5 border-t border-dark-700/60 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Create account
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
