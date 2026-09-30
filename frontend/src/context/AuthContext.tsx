import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../api/client.js';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'student' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loginAs: (role: 'student' | 'admin') => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getMe()
        .then((res) => setUser(res.user))
        .catch(() => {
          removeAuthToken();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      // Default to demo student for immediate convenience
      loginAs('student').finally(() => setLoading(false));
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    setAuthToken(res.token);
    setUser(res.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await api.register({ username, email, password });
    setAuthToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  const loginAs = async (role: 'student' | 'admin') => {
    try {
      const username = role;
      const password = role === 'admin' ? 'admin123' : 'student123';
      const res = await api.login({ username, password });
      setAuthToken(res.token);
      setUser(res.user);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        loginAs,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
