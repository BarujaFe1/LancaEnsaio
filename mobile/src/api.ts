// mobile/src/api.ts
import axios from 'axios';
import { getToken } from './session';

/**
 * ✅ Agora o backend vai rodar no Supabase Edge Functions (HTTPS público).
 *
 * Você vai configurar no mobile/.env (Expo Go) e no EAS (APK) esta variável:
 *   EXPO_PUBLIC_API_URL=https://SEU-PROJECT-REF.supabase.co/functions/v1/api
 *
 * Exemplo:
 *   EXPO_PUBLIC_API_URL=https://abcxyz.supabase.co/functions/v1/api
 */
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim();

if (!BASE_URL) {
  // Para não “passar batido” em build e gerar APK quebrado
  console.warn(
    '⚠️ EXPO_PUBLIC_API_URL não definido. Crie mobile/.env (Expo Go) e configure no EAS (APK).'
  );
}

export const api = axios.create({
  baseURL: BASE_URL || 'https://SEU-PROJECT-REF.supabase.co/functions/v1/api',
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const url = String(config.url || '');
  // login é público
  if (url.startsWith('/auth/login')) return config;

  const token = await getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
