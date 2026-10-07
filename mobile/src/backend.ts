// mobile/src/backend.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { CITY_GROUPS_FIXED } from './constants/cidades';
import { formatDeviceTimestamp } from './utils/date';
import { getCustomCities } from './session';

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
  id?: string;
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

// Cache local em memória do catálogo para resposta instantânea (0ms)
let cachedConfig: ConfigData = {
  cidades: demoCidades(),
  instrumentos: DEMO_INSTRUMENTOS,
  ministerios: DEMO_MINISTERIOS,
  cargosMusicais: DEMO_CARGOS,
};

let configFetchPromise: Promise<ConfigData> | null = null;

async function syncConfigFromRemote(): Promise<ConfigData> {
  if (isGoogleScript) {
    try {
      const resp = await fetch(`${API_URL}?action=config`);
      const data = await resp.json();
      if (data?.sucesso) {
        cachedConfig = {
          cidades: data.cidades?.length ? data.cidades : demoCidades(),
          instrumentos: data.instrumentos || DEMO_INSTRUMENTOS,
          ministerios: data.ministerios?.length ? data.ministerios : DEMO_MINISTERIOS,
          cargosMusicais: data.cargosMusicais?.length ? data.cargosMusicais : DEMO_CARGOS,
        };
        return cachedConfig;
      }
    } catch (err) {
      console.warn('Sync background de config falhou:', err);
    }
  } else if (!isDemo()) {
    try {
      const res = await api.get('/config');
      if (res?.data) {
        cachedConfig = res.data;
        return cachedConfig;
      }
    } catch (err) {
      console.warn('Sync background /config falhou:', err);
    }
  }
  return cachedConfig;
}

export function toAsciiJson(obj: unknown): string {
  return JSON.stringify(obj).replace(/[\u007F-\uFFFF]/g, (chr) =>
    '\\u' + chr.charCodeAt(0).toString(16).padStart(4, '0')
  );
}

export async function getConfig(forceRefresh = false): Promise<ConfigData> {
  let base: ConfigData;
  // Retorna instantâneo do cache para o usuário nunca esperar tela em branco
  if (!forceRefresh) {
    // Dispara sincronização silenciosa em background sem travar UI
    if (!configFetchPromise) {
      configFetchPromise = syncConfigFromRemote().finally(() => {
        configFetchPromise = null;
      });
    }
    base = cachedConfig;
  } else {
    base = await syncConfigFromRemote();
  }

  // Mescla cidades personalizadas cadastradas pelo usuário
  try {
    const custom = await getCustomCities();
    if (custom && custom.length > 0) {
      const allCities = [...custom, ...base.cidades];
      const seen = new Set<string>();
      const deduped: string[] = [];
      for (const c of allCities) {
        const trimmed = (c || '').trim();
        if (trimmed && !seen.has(trimmed.toLowerCase())) {
          seen.add(trimmed.toLowerCase());
          deduped.push(trimmed);
        }
      }
      return {
        ...base,
        cidades: deduped,
      };
    }
  } catch {
    // Fallback para as cidades base
  }

  return base;
}

export function gerarIdRegistro(tipo: 'IRMAOS' | 'IRMAS' | null, nomeLancador: string): string {
  const rand = Math.floor(Math.random() * 9000 + 1000).toString();
  if (tipo === 'IRMAS') return 'F' + rand;
  const palavras = (nomeLancador || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  const partes = palavras.map(p => p.slice(0, 3)).join('');
  return 'M' + (partes || 'USR') + rand;
}

export async function enviarRegistro(
  payload: RegistroPayload
): Promise<{ idGerado: string; comprovante: Comprovante | null }> {
  const idUsado = payload.id || gerarIdRegistro(payload.tipo, payload.nomeLancador);

  if (isDemo()) {
    const comprovante: Comprovante = {
      id: idUsado,
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

    return { idGerado: idUsado, comprovante };
  }

  if (isGoogleScript) {
    const bodyAscii = toAsciiJson({ action: 'registro', ...payload, id: idUsado });
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: bodyAscii,
    });
    const data = await resp.json();
    if (!data?.sucesso) {
      throw new Error(data?.erro || 'Falha ao gravar na planilha Google');
    }
    const comprovante: Comprovante | null = data.comprovante || null;
    // Evita que o comprovante retorne com caracteres de substituição corrompidos
    if (comprovante && payload.cidade && comprovante.cidade && comprovante.cidade.includes('\uFFFD')) {
      comprovante.cidade = payload.cidade;
    }
    return {
      idGerado: data.idGerado || idUsado,
      comprovante,
    };
  }

  const res = await api.post('/registros', { ...payload, id: idUsado });
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
    const bodyAscii = toAsciiJson({ action: 'alerta', ...params });
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: bodyAscii,
    });
    const data = await resp.json();
    if (!data?.sucesso) {
      throw new Error(data?.erro || 'Falha ao adicionar alerta');
    }
    return;
  }

  await api.post('/registros/alerta', params);
}

export async function registrarNovaCidade(novaCidade: string): Promise<void> {
  const limpa = (novaCidade || '').trim();
  if (!limpa) return;
  if (isGoogleScript) {
    try {
      const bodyAscii = toAsciiJson({ action: 'adicionarCidade', cidade: limpa });
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: bodyAscii,
      });
    } catch {
      // Silencioso se o script não suportar a ação; o registro local já funcionará perfeitamente
    }
  }
}
