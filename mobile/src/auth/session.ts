import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthUser = {
  usuario: string;
  nome: string;
  perfil: string;
  modulos: string[];
};

export type AuthSession = {
  token: string;
  usuario: AuthUser;
  createdAt: number;
};

const STORAGE_KEYS = {
  AUTH_SESSION: '@orquestra/auth_session_v1',
  DEVICE_ID: '@orquestra/device_id_v1',
};

type AuthEvent = 'login' | 'logout' | 'unauthorized';

const listeners = new Set<(event: AuthEvent) => void>();

export function subscribeAuthEvents(listener: (event: AuthEvent) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitAuthEvent(event: AuthEvent) {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // silêncio proposital
    }
  });
}

export async function saveSession(input: { token: string; usuario: AuthUser }) {
  const session: AuthSession = {
    token: input.token,
    usuario: input.usuario,
    createdAt: Date.now(),
  };

  await AsyncStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
  emitAuthEvent('login');
  return session;
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.usuario) return null;

    return parsed as AuthSession;
  } catch {
    return null;
  }
}

export async function getAccessToken(): Promise<string> {
  const session = await getSession();
  return session?.token || '';
}

export async function clearSession(options?: { silent?: boolean }) {
  await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);

  if (!options?.silent) {
    emitAuthEvent('logout');
  }
}

let unauthorizedInFlight = false;

export async function handleUnauthorized() {
  if (unauthorizedInFlight) return;

  unauthorizedInFlight = true;

  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    emitAuthEvent('unauthorized');
  } finally {
    setTimeout(() => {
      unauthorizedInFlight = false;
    }, 600);
  }
}

export async function getOrCreateDeviceId() {
  const existing = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (existing) return existing;

  const generated = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, generated);
  return generated;
}
