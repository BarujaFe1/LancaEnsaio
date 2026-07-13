// mobile/src/api.ts
import axios from 'axios';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim();
const APP_TOKEN = (process.env.EXPO_PUBLIC_APP_API_TOKEN || '').trim();

if (!BASE_URL && typeof __DEV__ !== 'undefined' && __DEV__) {
  console.warn(
    '⚠️ EXPO_PUBLIC_API_URL não definido. Crie mobile/.env (Expo Go) e configure no EAS (APK).'
  );
}

export const api = axios.create({
  baseURL: BASE_URL || 'https://SEU-PROJECT-REF.supabase.co/functions/v1/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (APP_TOKEN) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${APP_TOKEN}`;
    config.headers['x-app-token'] = APP_TOKEN;
  }
  return config;
});

export function getApiAuthConfigured(): boolean {
  return Boolean(APP_TOKEN);
}
