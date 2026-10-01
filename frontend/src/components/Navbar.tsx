import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Code2, Terminal, LayoutDashboard, ShieldCheck, Trophy, LogOut, LogIn, Sun, Moon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const links = [
    { path: '/', label: 'Problems', icon: Code2 },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];
  const navigation = (mobile: boolean) => <div className={mobile ? 'flex md:hidden gap-1 overflow-x-auto no-scrollbar pb-2' : 'hidden md:flex gap-1'}>
    {links.map(({ path, label, icon: Icon }) => <Link key={path} to={path} aria-current={pathname === path ? 'page' : undefined}
      className={`flex shrink-0 items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${pathname === path ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-dark-800 hover:text-slate-200'}`}>
      <Icon className="w-4 h-4" /><span>{label}</span>
    </Link>)}
  </div>;
  return <nav aria-label="Main navigation" className="sticky top-0 z-40 border-b border-dark-700 bg-dark-900/95 backdrop-blur-md px-3 sm:px-6">
    <div className="flex items-center justify-between gap-3 min-h-16 max-w-7xl mx-auto">
      <Link to="/" className="flex items-center gap-2 shrink-0 group">
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 group-hover:rotate-6 transition-transform"><Terminal className="w-5 h-5" /></span>
        <span className="text-strong font-extrabold text-base sm:text-lg tracking-tight">AlgoSphere</span>
      </Link>
      {navigation(false)}
      <div className="flex items-center gap-2 min-w-0">
        <button onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2 rounded-lg border border-dark-700 bg-dark-850 text-slate-300 hover:text-indigo-400 transition-colors">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        {user ? <>
          <span className="hidden sm:block text-xs text-slate-300 font-semibold max-w-24 truncate" title={user.username}>{user.username}</span>
          <button onClick={logout} aria-label="Sign out" className="p-2 rounded-lg border border-dark-700 text-slate-400 hover:text-rose-400"><LogOut className="w-4 h-4" /></button>
        </> : <Link to="/login" className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-xs font-semibold"><LogIn className="w-4 h-4" /><span>Sign in</span></Link>}
      </div>
    </div>
    {navigation(true)}
  </nav>;
};
