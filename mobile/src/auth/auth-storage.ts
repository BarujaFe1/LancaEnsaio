import AsyncStorage from '@react-native-async-storage/async-storage';

export type StoredSession = {
  token: string;
  exp: number;
  usuario: {
    usuario: string;
    nome: string;
    perfil: string;
    modulos: string[];
  };
};

const SESSION_KEY = '@ensaio/auth_session_v2';

export async function saveSession(session: StoredSession) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<StoredSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
