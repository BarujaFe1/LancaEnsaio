// mobile/src/session.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = '@orquestra/prefs_v1';

export type UserPrefs = {
  nomeLancador: string;
  tipoSelecionado: 'IRMAOS' | 'IRMAS' | null;
};

let memPrefs: UserPrefs = { nomeLancador: '', tipoSelecionado: null };
const listeners = new Set<(p: UserPrefs) => void>();

function notify(p: UserPrefs) {
  for (const fn of listeners) {
    try { fn(p); } catch {}
  }
}

export function subscribePrefs(listener: (p: UserPrefs) => void) {
  listeners.add(listener);
  listener(memPrefs);
  return () => { listeners.delete(listener); };
}

export async function getPrefs(): Promise<UserPrefs> {
  const stored = await AsyncStorage.getItem(PREFS_KEY);
  if (stored) {
    try {
      memPrefs = JSON.parse(stored);
    } catch {}
  }
  return memPrefs;
}

export async function savePrefs(prefs: Partial<UserPrefs>): Promise<void> {
  memPrefs = { ...memPrefs, ...prefs };
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(memPrefs));
  notify(memPrefs);
}

export async function clearPrefs(): Promise<void> {
  memPrefs = { nomeLancador: '', tipoSelecionado: null };
  await AsyncStorage.removeItem(PREFS_KEY);
  notify(memPrefs);
}

// Compatibilidade com código antigo que pode procurar por clearToken
export const clearToken = clearPrefs;

const CUSTOM_CITIES_KEY = '@orquestra/custom_cities_v1';

export async function getCustomCities(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(CUSTOM_CITIES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addCustomCity(novaCidade: string): Promise<string[]> {
  const limpa = (novaCidade || '').trim();
  if (!limpa) return getCustomCities();
  try {
    const list = await getCustomCities();
    if (!list.includes(limpa)) {
      const updated = [limpa, ...list];
      await AsyncStorage.setItem(CUSTOM_CITIES_KEY, JSON.stringify(updated));
      return updated;
    }
    return list;
  } catch {
    return [limpa];
  }
}

export async function removeCustomCity(cidade: string): Promise<string[]> {
  try {
    const list = await getCustomCities();
    const updated = list.filter((c) => c !== cidade);
    await AsyncStorage.setItem(CUSTOM_CITIES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
