// Para que serve: Auth + auto-entrada na equipe (ORG) para deixar TUDO coletivo automaticamente.
// Onde colar: substitua este arquivo no seu projeto em /src/context/AuthContext.js
//
// Como funciona:
// - O app entra automaticamente na equipe ao autenticar usando DEFAULT_ORG_CODE (GEMVGS-2026).
// - Assim, tudo no app vira coletivo sem passos extras.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getMyProfile, upsertMyProfileName } from '../services/db';
import { logError, logInfo } from '../utils/logger';

const AuthContext = createContext(null);

// Você pode mudar aqui e/ou definir EXPO_PUBLIC_ORG_JOIN_CODE no .env/EAS Secrets
const DEFAULT_ORG_CODE = process.env.EXPO_PUBLIC_ORG_JOIN_CODE || 'GEMVGS-2026';

async function ensureOrgMembership() {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    if (!uid) return;

    const { data: prof, error: e1 } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', uid)
      .single();

    if (e1) return;

    if (prof?.org_id) return;

    if (DEFAULT_ORG_CODE) {
      const { error } = await supabase.rpc('join_org_by_code', { p_code: DEFAULT_ORG_CODE });
      if (error) {
        await logError('Auto join org failed', error, { code: DEFAULT_ORG_CODE });
      } else {
        await logInfo('Auto join org ok', { code: DEFAULT_ORG_CODE });
      }
    }
  } catch (e) {}
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const p = await getMyProfile();
      setProfile(p);
      return p;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user || null);

        if (data.session?.user) {
          await ensureOrgMembership();
          await refreshProfile();
        }
      } finally {
        setLoading(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.user) {
        await ensureOrgMembership();
        await refreshProfile();
      } else {
        setProfile(null);
      }
    });

    const sub = listener?.subscription;
    return () => {
      try { sub?.unsubscribe?.(); } catch {}
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      await logError('Auth signIn error', error, { email });
      throw error;
    }
    await ensureOrgMembership();
    await refreshProfile();
    await logInfo('Auth signIn ok', { email });
    return data;
  };

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName || null } }
    });

    if (error) {
      await logError('Auth signUp error', error, { email });
      throw error;
    }

    const hasSession = !!data?.session;

    if (hasSession && fullName) {
      try { await upsertMyProfileName(fullName); } catch {}
    }

    if (hasSession) {
      await ensureOrgMembership();
      await refreshProfile();
    }

    await logInfo('Auth signUp ok', { email, hasSession });

    return { needsEmailConfirmation: !hasSession, data };
  };

  const signInAnonymous = async (fullName) => {
    if (typeof supabase.auth.signInAnonymously !== 'function') {
      throw new Error('Seu @supabase/supabase-js não tem signInAnonymously(). Atualize para v2+.');
    }

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      await logError('Auth signInAnonymously error', error, {});
      throw error;
    }

    if (fullName) {
      try { await upsertMyProfileName(fullName); } catch {}
    }

    await ensureOrgMembership();
    await refreshProfile();
    await logInfo('Auth signInAnonymously ok', { is_anonymous: true });
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      await logError('Auth signOut error', error, {});
      throw error;
    }
    await logInfo('Auth signOut ok', {});
  };

  const saveProfileName = async (full_name) => {
    await upsertMyProfileName(full_name);
    await refreshProfile();
  };

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      signIn,
      signUp,
      signInAnonymous,
      signOut,
      refreshProfile,
      saveProfileName
    }),
    [session, user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
