import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Terminal, ArrowRight, Loader2, Lock, User, Mail, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { user, register, loginWithGoogle } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const validate = (): string | null => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || !cleanEmail || !password || !confirmPassword) {
      return 'All fields are required.';
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return 'Username must be between 3 and 30 characters.';
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return 'Username can only contain letters, numbers, and underscores.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return 'Please enter a valid email address.';
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters.';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    try {
      await register(username.trim(), email.trim(), password);
      setSuccessMessage('Account created successfully! Redirecting...');
    } catch (err: any) {
      setError(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setBusy(true);
    try {
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
              Join the arena.<br />
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Benchmark your skills.
              </span>
            </h1>

            <p className="text-slate-400 mt-4 text-sm leading-relaxed">
              Create your account to solve challenging algorithmic problems, submit solutions, and track your progress across C, C++, Java, and Python.
            </p>
          </div>

          <div className="space-y-4 pt-6 border-t border-dark-700/60">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-dark-850/60 border border-dark-700/60">
                <strong className="block text-2xl font-bold text-white">100% Free</strong>
                <span className="text-xs text-slate-400">Cloud Evaluation</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-850/60 border border-dark-700/60">
                <strong className="block text-2xl font-bold text-white">Real-Time</strong>
                <span className="text-xs text-slate-400">Hidden Test Cases</span>
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
              <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
              <p className="text-xs text-slate-400 mt-1">Sign up with your credentials or continue with Google.</p>
            </div>

            {error && (
              <div role="alert" className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-2 animate-slide-down">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div role="status" className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2 animate-slide-down">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="reg-username" className="block text-xs font-semibold text-slate-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="reg-username"
                    autoComplete="username"
                    autoFocus
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="alphanumeric, e.g. dev_pro"
                    className="w-full rounded-xl bg-dark-950/80 border border-dark-700/80 pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl bg-dark-950/80 border border-dark-700/80 pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl bg-dark-950/80 border border-dark-700/80 pl-10 pr-10 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
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

              <div>
                <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="reg-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full rounded-xl bg-dark-950/80 border border-dark-700/80 pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 px-4 py-2.5 text-sm text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.99]"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{busy ? 'Creating Account…' : 'Sign Up'}</span>
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
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
          <div className="mt-6 pt-4 border-t border-dark-700/60 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
