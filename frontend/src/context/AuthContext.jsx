import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (err) {
        // 401 is expected when not logged in, don't log as error
        if (err.response?.status !== 401) {
          console.error('Auth check failed:', err.message);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  }, []);

  const hasRole = useCallback(
    (...roles) => {
      if (!user) return false;
      if (user.role === 'owner') return true;
      return roles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
