// mobile/src/backend.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { CITY_GROUPS_FIXED } from './constants/cidades';
import { formatDeviceTimestamp } from './utils/date';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim();
const DEMO_FLAG = (process.env.EXPO_PUBLIC_DEMO || '').trim().toLowerCase() === 'true';

// Modo demo ativo quando não há backend configurado (ex.: Vercel) ou flag explícita.
export const isDemo = (): boolean => !API_URL || DEMO_FLAG;
export const getApiUrl = (): string => API_URL;

export type ConfigData = {
  instrumentos: Record<string, string[]>;
  cidades: string[];
  ministerios: string[];
  cargosMusicais: string[];
};

export type RegistroPayload = {
  tipo: 'IRMAOS' | 'IRMAS' | null;
  nomeLancador: string;
  cidade: string;
  categoria: string;
  instrumento: string;
  ministerio: string;
  musicaCargo: string;
};

export type Comprovante = {
  id: string;
  horario: string;
  cidade: string;
  instrumento: string;
  ministerio: string;
  musica: string;
  auditoria: string;
  alerta?: string;
};

type DemoLogEntry = Comprovante & {
  tipo: RegistroPayload['tipo'];
  categoria: string;
};

const DEMO_INSTRUMENTOS: Record<string, string[]> = {
  Cordas: ['Violino', 'Viola', 'Violoncelo'],
  Metais: [
    'Barítono (Pisto)',
    'Cornet',
    'Eufônio',
    'Flugelhorn',
    'Trombone',
    'Trombonito',
    'Trompa',
    'Trompete',
    'Tuba',
  ],
  Madeiras: [
    'Clarinete',
    'Clarinete Alto',
    'Clarinete Baixo (Clarone)',
    'Corne Inglês',
    'Fagote',
    'Flauta',
    'Oboé',
    "Oboé D'Amore",
    'Saxofone Alto',
    'Saxofone Baritono',
    'Saxofone Soprano (Reto)',
    'Saxofone Tenor',
  ],
  Teclas: ['Acordeon'],
};

const DEMO_MINISTERIOS = [
  'Ancião',
  'Diácono',
  'Cooperador de Ofício',
  'Cooperador de Jovens',
];

const DEMO_CARGOS = [
  'Encarregado Regional',
  'Encarregado Local',
  'Instrutor',
];

const DEMO_LOG_KEY = '@ensaio/demo_log_v1';

function demoCidades(): string[] {
  return CITY_GROUPS_FIXED.reduce<string[]>((acc, g) => acc.concat(g.items), []);
}

const isGoogleScript = API_URL.includes('script.google.com');

export async function getConfig(): Promise<ConfigData> {
  if (isDemo()) {
    return {
      cidades: demoCidades(),
      instrumentos: DEMO_INSTRUMENTOS,
      ministerios: DEMO_MINISTERIOS,
      cargosMusicais: DEMO_CARGOS,
    };
  }

  if (isGoogleScript) {
    try {
      const resp = await fetch(`${API_URL}?action=config`);
      const data = await resp.json();
      if (data?.sucesso) {
        return {
          cidades: data.cidades?.length ? data.cidades : demoCidades(),
          instrumentos: data.instrumentos || DEMO_INSTRUMENTOS,
          ministerios: data.ministerios?.length ? data.ministerios : DEMO_MINISTERIOS,
          cargosMusicais: data.cargosMusicais?.length ? data.cargosMusicais : DEMO_CARGOS,
        };
      }
    } catch (err) {
      console.warn('Falha ao carregar config da planilha via Apps Script, usando local:', err);
    }
    return {
      cidades: demoCidades(),
      instrumentos: DEMO_INSTRUMENTOS,
      ministerios: DEMO_MINISTERIOS,
      cargosMusicais: DEMO_CARGOS,
    };
  }

  const res = await api.get('/config');
  return res.data;
}

function gerarId(): string {
  const now = new Date();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `ENS-${now.getFullYear()}-${seq}`;
}

export async function enviarRegistro(
  payload: RegistroPayload
): Promise<{ idGerado: string; comprovante: Comprovante | null }> {
  if (isDemo()) {
    const id = gerarId();
    const comprovante: Comprovante = {
      id,
      horario: formatDeviceTimestamp(),
      cidade: payload.cidade,
      instrumento: payload.instrumento || '-',
      ministerio: payload.ministerio || '-',
      musica: payload.musicaCargo || '-',
      auditoria: `Lançado por ${payload.nomeLancador} (modo demo)`,
    };

    // Grava localmente (modo demonstração)
    try {
      const raw = await AsyncStorage.getItem(DEMO_LOG_KEY);
      const log: DemoLogEntry[] = raw ? JSON.parse(raw) : [];
      log.unshift({ ...comprovante, tipo: payload.tipo, categoria: payload.categoria });
      await AsyncStorage.setItem(DEMO_LOG_KEY, JSON.stringify(log.slice(0, 50)));
    } catch {
      // ignora falha de persistência local
    }

    return { idGerado: id, comprovante };
  }

  if (isGoogleScript) {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'registro', ...payload }),
    });
    const data = await resp.json();
    if (!data?.sucesso) {
      throw new Error(data?.erro || 'Falha ao gravar na planilha Google');
    }
    return {
      idGerado: data.idGerado,
      comprovante: data.comprovante || null,
    };
  }

  const res = await api.post('/registros', payload);
  return { idGerado: res.data?.idGerado || 'SUCESSO', comprovante: res.data?.comprovante || null };
}

export async function enviarAlerta(params: {
  id: string;
  aviso: string;
  nomeLancador: string;
}): Promise<void> {
  if (isDemo()) {
    try {
      const raw = await AsyncStorage.getItem(DEMO_LOG_KEY);
      const log: DemoLogEntry[] = raw ? JSON.parse(raw) : [];
      const idx = log.findIndex((r) => r.id === params.id);
      if (idx >= 0) {
        log[idx].alerta = params.aviso;
        await AsyncStorage.setItem(DEMO_LOG_KEY, JSON.stringify(log));
      }
    } catch {
      // ignora falha de persistência local
    }
    return;
  }

  if (isGoogleScript) {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'alerta', ...params }),
    });
    const data = await resp.json();
    if (!data?.sucesso) {
      throw new Error(data?.erro || 'Falha ao adicionar alerta');
    }
    return;
  }

  await api.post('/registros/alerta', params);
}
