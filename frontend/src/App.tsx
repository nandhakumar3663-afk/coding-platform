import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProblemList } from './pages/ProblemList';
import { ProblemPage } from './pages/ProblemPage';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';

import { LoginPage } from './pages/LoginPage';

const ProtectedRoute: React.FC<{ admin?: boolean }> = ({ admin }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <p className="p-8 text-slate-400">Loading your session…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-dark-950 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
              <Route path="/" element={<ProblemList />} />
              <Route path="/problem/:slug" element={<ProblemPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              </Route>
              <Route element={<ProtectedRoute admin />}><Route path="/admin" element={<AdminPanel />} /></Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
