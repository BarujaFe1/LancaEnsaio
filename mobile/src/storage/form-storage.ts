import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FormState } from '../utils/form-state';

const KEYS = {
  FORM_DRAFT: '@ensaio/form_draft_v1',
  TRAVA_CIDADE: '@ensaio/trava_cidade_v1'
};

export async function saveFormDraft(form: FormState) {
  await AsyncStorage.setItem(KEYS.FORM_DRAFT, JSON.stringify(form));
}

export async function loadFormDraft(): Promise<FormState | null> {
  const raw = await AsyncStorage.getItem(KEYS.FORM_DRAFT);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveTravaCidade(value: boolean) {
  await AsyncStorage.setItem(KEYS.TRAVA_CIDADE, value ? '1' : '0');
}

export async function loadTravaCidade() {
  const raw = await AsyncStorage.getItem(KEYS.TRAVA_CIDADE);
  return raw === '1';
}

export { KEYS as FORM_STORAGE_KEYS };
