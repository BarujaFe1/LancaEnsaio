// mobile/src/api.ts
import axios from 'axios';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim();

if (!BASE_URL) {
  console.warn(
    '⚠️ EXPO_PUBLIC_API_URL não definido. Crie mobile/.env (Expo Go) e configure no EAS (APK).'
  );
}

export const api = axios.create({
  baseURL: BASE_URL || 'https://SEU-PROJECT-REF.supabase.co/functions/v1/api',
  timeout: 15000,
});
