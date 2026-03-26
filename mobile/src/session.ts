// mobile/src/session.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = '@orquestra/token_v1';
const DEVICE_ID_KEY = '@orquestra/device_id_v1';
const LAST_USER_KEY = '@orquestra/last_user_v1';

// ✅ Token em memória + notificação (evita corrida e mantém o RootLayout sincronizado)
let memToken = '';
const tokenListeners = new Set<(t: string) => void>();

function notifyToken(token: string) {
  for (const fn of tokenListeners) {
    try { fn(token); } catch {}
  }
}

function randomId(len = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function subscribeToken(listener: (t: string) => void) {
  tokenListeners.add(listener);
  // chama imediatamente com o estado atual
  listener(memToken);
  return () => tokenListeners.delete(listener);
}

export async function getToken(): Promise<string> {
  if (memToken) return memToken;
  const stored = (await AsyncStorage.getItem(TOKEN_KEY)) || '';
  memToken = stored;
  return stored;
}

export async function setToken(token: string): Promise<void> {
  memToken = token || '';
  await AsyncStorage.setItem(TOKEN_KEY, memToken);
  notifyToken(memToken);
}

export async function clearToken(): Promise<void> {
  memToken = '';
  await AsyncStorage.removeItem(TOKEN_KEY);
  notifyToken(memToken);
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const newId = "${Platform.OS}_${randomId(20)}";
  await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
  return newId;
}

export async function getLastUser(): Promise<string> {
  return (await AsyncStorage.getItem(LAST_USER_KEY)) || '';
}

export async function setLastUser(u: string): Promise<void> {
  const val = (u || '').trim();
  if (!val) return;
  await AsyncStorage.setItem(LAST_USER_KEY, val);
}
