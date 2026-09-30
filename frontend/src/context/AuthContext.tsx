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
      setLoading(false);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
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
