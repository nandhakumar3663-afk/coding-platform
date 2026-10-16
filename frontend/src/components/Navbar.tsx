import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Code2, LayoutDashboard, ShieldCheck, Trophy, LogOut, LogIn, Sun, Moon } from 'lucide-react';

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

  const navigation = (mobile: boolean) => (
    <div aria-label={mobile ? 'Mobile navigation' : 'Primary navigation'} className={mobile ? 'nav-links nav-links-mobile' : 'nav-links nav-links-desktop'}>
      {links.map(({ path, label, icon: Icon }) => {
        const active = pathname === path || (path !== '/' && pathname.startsWith(`${path}/`));
        return (
          <Link key={path} to={path} aria-current={pathname === path ? 'page' : undefined}
            className={`nav-link ${active ? 'nav-link-active' : ''}`}>
            <Icon size={16} aria-hidden="true" /><span>{label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <nav aria-label="Main navigation" className="site-nav">
      <div className="site-nav-inner">
        <Link to="/" className="brand-link" aria-label="AlgoSphere home">
          <span className="brand-mark"><Code2 size={21} strokeWidth={2.5} /></span>
          <span className="brand-copy">
            <span className="brand-name">AlgoSphere</span>
            <span className="brand-subtitle">Practice with purpose</span>
          </span>
        </Link>

        {navigation(false)}

        <div className="nav-actions">
          <button type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className="nav-icon-button">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {user ? (
            <>
              <span className="nav-user" title={user.username}>{user.username}</span>
              <button type="button" onClick={logout} aria-label="Sign out" title="Sign out" className="nav-icon-button"><LogOut size={16} /></button>
            </>
          ) : (
            <Link to="/login" className="nav-signin"><LogIn size={15} /><span>Sign in</span></Link>
          )}
        </div>
        {navigation(true)}
      </div>
    </nav>
  );
};
