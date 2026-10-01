import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { api, setAuthToken } from '../api/client';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        if (!isSupabaseConfigured) {
          throw new Error('Supabase is not configured.');
        }

        // Get the active session (detectSessionInUrl will have parsed hash or code)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          setAuthToken(session.access_token);
          // Ping /api/auth/me to trigger SQLite user sync
          try {
            await api.getMe();
          } catch {
            // non-fatal if backend sync runs later
          }
          await refreshProfile();

          const returnTo = sessionStorage.getItem('oauth_return_to') || '/';
          sessionStorage.removeItem('oauth_return_to');
          if (isMounted) {
            navigate(returnTo, { replace: true });
          }
        } else {
          // Listen for next auth state change in case hash is being processed asynchronously
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (newSession && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
              setAuthToken(newSession.access_token);
              try {
                await api.getMe();
              } catch {
                // ignore
              }
              await refreshProfile();
              const returnTo = sessionStorage.getItem('oauth_return_to') || '/';
              sessionStorage.removeItem('oauth_return_to');
              if (isMounted) {
                navigate(returnTo, { replace: true });
              }
            }
          });

          // Fallback timeout to prevent infinite spinner
          setTimeout(() => {
            if (isMounted && !error) {
              const returnTo = sessionStorage.getItem('oauth_return_to') || '/';
              sessionStorage.removeItem('oauth_return_to');
              navigate(returnTo, { replace: true });
            }
          }, 3500);

          return () => {
            authListener.subscription.unsubscribe();
          };
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Authentication callback failed.');
        }
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, refreshProfile]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-dark-900 border border-dark-700 text-center shadow-xl">
        {error ? (
          <div>
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-strong mb-2">Authentication Failed</h2>
            <p className="text-xs text-rose-300 mb-6">{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
            <h2 className="text-lg font-semibold text-strong">Completing Sign In…</h2>
            <p className="text-xs text-slate-400 mt-1">Please wait while we verify your credentials.</p>
          </div>
        )}
      </div>
    </div>
  );
};
