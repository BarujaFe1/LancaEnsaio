import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Application from 'expo-application';
import { api, getFriendlyApiError, registerApiAuthHooks } from '../api';
import { clearSession, loadSession, saveSession, StoredSession } from './auth-storage';
import { logger } from '../utils/logger';

type AuthContextValue = {
  loading: boolean;
  session: StoredSession | null;
  isAuthenticated: boolean;
  login: (usuario: string, senha: string) => Promise<{ ok: boolean; error?: string; aviso?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getDeviceIdSafe() {
  return (
    Application.getAndroidId?.() ||
    Application.applicationId ||
    `device-${Date.now()}`
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<StoredSession | null>(null);

  const applySession = useCallback(async (next: StoredSession | null) => {
    setSession(next);
    if (next) {
      await saveSession(next);
    } else {
      await clearSession();
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    if (!session?.token) return null;

    try {
      const res = await api.post('/auth/refresh', null, {
        headers: { Authorization: `Bearer ${session.token}` }
      });

      const next: StoredSession = {
        token: res.data.token,
        exp: res.data.exp,
        usuario: res.data.usuario
      };

      await applySession(next);
      return next.token;
    } catch (err) {
      logger.error('refreshSession failed', err);
      await applySession(null);
      return null;
    }
  }, [session?.token, applySession]);

  const logout = useCallback(async () => {
    try {
      if (session?.token) {
        await api.post('/auth/logout', null, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
      }
    } catch (err) {
      logger.debug('logout error ignored', err);
    } finally {
      await applySession(null);
    }
  }, [session?.token, applySession]);

  const login = useCallback(async (usuario: string, senha: string) => {
    try {
      const res = await api.post('/auth/login', {
        usuario,
        senha,
        deviceId: getDeviceIdSafe()
      });

      const next: StoredSession = {
        token: res.data.token,
        exp: res.data.exp,
        usuario: res.data.usuario
      };

      await applySession(next);

      return { ok: true, aviso: res.data.aviso as string | undefined };
    } catch (err) {
      return { ok: false, error: getFriendlyApiError(err) };
    }
  }, [applySession]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await loadSession();
        if (!saved) {
          setLoading(false);
          return;
        }

        // Se já expirou localmente, limpa
        if (saved.exp <= Date.now()) {
          await clearSession();
          setLoading(false);
          return;
        }

        setSession(saved);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    registerApiAuthHooks({
      getToken: () => session?.token || null,
      onUnauthorized: () => {
        logger.debug('401 global -> logout');
        void applySession(null);
      },
      onRefreshSession: refreshSession
    });
  }, [session?.token, refreshSession, applySession]);

  const value = useMemo<AuthContextValue>(() => ({
    loading,
    session,
    isAuthenticated: !!session?.token,
    login,
    logout,
    refreshSession
  }), [loading, session, login, logout, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return ctx;
}
