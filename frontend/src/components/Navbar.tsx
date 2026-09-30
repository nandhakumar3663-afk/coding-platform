import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { 
  Code2, 
  Terminal, 
  LayoutDashboard, 
  ShieldCheck, 
  History, 
  User, 
  LogOut, 
  LogIn,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && (location.pathname === '/' || location.pathname.startsWith('/problems'))) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <>
      <nav className="h-16 border-b border-dark-700 bg-dark-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
              <div className="w-full h-full bg-dark-900 rounded-[11px] flex items-center justify-center">
                <Terminal className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  AlgoSphere
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Judge
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                isActive('/') 
                  ? 'bg-dark-800 text-indigo-400 border border-dark-700' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Problems</span>
            </Link>

            <Link
              to="/dashboard"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                isActive('/dashboard') 
                  ? 'bg-dark-800 text-indigo-400 border border-dark-700' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  isActive('/admin') 
                    ? 'bg-dark-800 text-indigo-400 border border-dark-700' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300">Admin Panel</span>
              </Link>
            )}
          </div>
        </div>

        {/* Right Section: User Profile & Actions */}
        <div className="flex items-center space-x-3">
          {/* User status */}
          {user ? (
            <div className="flex items-center space-x-2.5 pl-2 border-l border-dark-700">
              <div className="flex items-center space-x-2 bg-dark-850 border border-dark-700 px-3 py-1.5 rounded-lg">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover border border-dark-600"
                  />
                ) : (
                  <div className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                )}
                <span className="text-xs font-semibold text-slate-200">{user.username}</span>
                <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                  user.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400'
                }`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-lg bg-dark-850 text-slate-400 hover:text-rose-400 hover:bg-dark-800 border border-dark-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </nav>

    </>
  );
};
