import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, ArrowRight, Loader2, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please provide a valid email address.');
      return;
    }

    setBusy(true);
    try {
      if (isSupabaseConfigured) {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetErr) {
          throw resetErr;
        }
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to send recovery email. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md p-8 rounded-2xl border border-dark-700/80 bg-dark-900/90 backdrop-blur-xl shadow-2xl relative z-10 animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reset Password</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enter your registered email and we'll send you instructions to reset your password.
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 animate-slide-down">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="text-center py-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-base font-semibold text-white mb-2">Check your email</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              If an account with <strong className="text-white">{email}</strong> exists, we have sent a secure link to reset your password.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  autoFocus
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl bg-dark-950/80 border border-dark-700/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 px-4 py-2.5 text-sm text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.99]"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>{busy ? 'Sending Reset Link…' : 'Send Reset Link'}</span>
            </button>

            <div className="pt-4 border-t border-dark-700/60 text-center">
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to sign in</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
