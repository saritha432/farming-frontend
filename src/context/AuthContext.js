import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!api.getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.getMe();
      setUser(me && me.id ? me : null);
    } catch {
      api.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (credentials) => {
    const data = await api.authLogin(credentials);
    const u = data.user;
    if (u && u.id) {
      setUser(u);
      return u;
    }
    if (data.token) {
      const me = await api.getMe();
      if (me && me.id) {
        setUser(me);
        return me;
      }
    }
    const fallback = data.id ? { id: data.id, username: data.username, fullName: data.fullName, email: data.email, avatar: data.avatar, bio: data.bio } : null;
    setUser(fallback);
    return fallback;
  }, []);

  const signup = useCallback(async (body) => {
    const data = await api.authSignup(body);
    const u = data.user;
    if (u && u.id) {
      setUser(u);
      return u;
    }
    if (data.token) {
      const me = await api.getMe();
      if (me && me.id) {
        setUser(me);
        return me;
      }
    }
    const fallback = data.id ? { id: data.id, username: data.username, fullName: data.fullName, email: data.email, avatar: data.avatar, bio: data.bio } : null;
    setUser(fallback);
    return fallback;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.authLogout();
    } finally {
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const refreshUser = useCallback(async () => {
    if (!api.getToken()) return;
    try {
      const me = await api.getMe();
      if (me && me.id) setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
