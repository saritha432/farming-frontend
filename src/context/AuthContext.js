import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);
const LOCAL_USER_KEY = 'agrovibes_user';

function readCachedUser() {
  try {
    const raw = window.localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.id ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedUser(u) {
  try {
    if (u && u.id) {
      window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
    } else {
      window.localStorage.removeItem(LOCAL_USER_KEY);
    }
  } catch {
    // ignore
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const hasToken = !!api.getToken();
    const cached = readCachedUser();

    // If there is no token but we have a cached user, trust the cache (frontend-only auth).
    if (!hasToken && cached) {
      setUser(cached);
      setLoading(false);
      return;
    }

    if (!hasToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const me = await api.getMe();
      const nextUser = me && me.id ? me : null;
      setUser(nextUser);
      writeCachedUser(nextUser);
    } catch {
      api.setToken(null);
      setUser(null);
      writeCachedUser(null);
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
      writeCachedUser(u);
      return u;
    }
    if (data.token) {
      const me = await api.getMe();
      if (me && me.id) {
        setUser(me);
        writeCachedUser(me);
        return me;
      }
    }
    const fallback = data.id
      ? {
          id: data.id,
          username: data.username,
          fullName: data.fullName,
          email: data.email,
          avatar: data.avatar,
          bio: data.bio,
        }
      : null;
    setUser(fallback);
    writeCachedUser(fallback);
    return fallback;
  }, []);

  const signup = useCallback(async (body) => {
    const data = await api.authSignup(body);
    const u = data.user;
    if (u && u.id) {
      setUser(u);
      writeCachedUser(u);
      return u;
    }
    if (data.token) {
      const me = await api.getMe();
      if (me && me.id) {
        setUser(me);
        writeCachedUser(me);
        return me;
      }
    }
    const fallback = data.id
      ? {
          id: data.id,
          username: data.username,
          fullName: data.fullName,
          email: data.email,
          avatar: data.avatar,
          bio: data.bio,
        }
      : null;
    setUser(fallback);
    writeCachedUser(fallback);
    return fallback;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.authLogout();
    } finally {
      setUser(null);
      writeCachedUser(null);
    }
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const refreshUser = useCallback(async () => {
    if (!api.getToken()) return;
    try {
      const me = await api.getMe();
      if (me && me.id) {
        setUser(me);
        writeCachedUser(me);
      }
    } catch {
      setUser(null);
      writeCachedUser(null);
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
