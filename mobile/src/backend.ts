// mobile/src/backend.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { CITY_GROUPS_FIXED } from './constants/cidades';
import { auditarRegistro, gerarIdRegistro } from './domain/auditoria';
import { formatDeviceTimestamp } from './utils/date';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim();
const DEMO_FLAG = (process.env.EXPO_PUBLIC_DEMO || '').trim().toLowerCase() === 'true';

// Modo demo ativo quando não há backend configurado (ex.: Vercel) ou flag explícita.
export const isDemo = (): boolean => !API_URL || DEMO_FLAG;

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

/** Categorias alinhadas à planilha de produção / Edge Function. */
const DEMO_INSTRUMENTOS: Record<string, string[]> = {
  Cordas: ['Violão', 'Viola', 'Cavaquinho', 'Contrabaixo', 'Violino'],
  Metais: ['Trompete', 'Trombone', 'Trompa', 'Tuba', 'Eufônio'],
  Madeiras: ['Flauta', 'Clarinete', 'Oboé', 'Saxofone Alto', 'Saxofone Tenor'],
  Teclas: ['Órgão', 'Teclado', 'Piano'],
};

const DEMO_MINISTERIOS = ['Ancião', 'Diácono', 'Cooperador', 'Encarregado Local', 'Encarregado Regional'];

/** Cargos usados no fluxo de Irmãs (e também listados para Irmãos quando aplicável). */
const DEMO_CARGOS = ['Organista', 'Instrutora', 'Examinadora', 'Encarregado Local', 'Encarregado Regional'];

const DEMO_LOG_KEY = '@ensaio/demo_log_v1';
const LAST_COMPROVANTE_KEY = '@ensaio/last_comprovante_v1';

function demoCidades(): string[] {
  return CITY_GROUPS_FIXED.reduce<string[]>((acc, g) => acc.concat(g.items), []);
}

export async function getConfig(): Promise<ConfigData> {
  if (isDemo()) {
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

export async function enviarRegistro(
  payload: RegistroPayload
): Promise<{ idGerado: string; comprovante: Comprovante | null }> {
  if (!payload.tipo) {
    throw new Error('Tipo de lançamento não definido.');
  }

  if (isDemo()) {
    const audit = auditarRegistro({
      tipo: payload.tipo,
      categoria: payload.categoria,
      instrumento: payload.instrumento,
      cidade: payload.cidade,
      ministerio: payload.ministerio,
      musicaCargo: payload.musicaCargo,
    });

    const id = gerarIdRegistro(payload.tipo, payload.nomeLancador);
    const metadado = audit.statusAuditoria
      ? `${audit.statusAuditoria} | META APP=DEMO TIPO=${payload.tipo} USER=${payload.nomeLancador}`
      : `META APP=DEMO TIPO=${payload.tipo} USER=${payload.nomeLancador}`;

    const comprovante: Comprovante = {
      id,
      horario: formatDeviceTimestamp(),
      cidade: payload.cidade,
      instrumento: payload.instrumento || '-',
      ministerio: payload.ministerio || '-',
      musica: audit.cargoFinal,
      auditoria: metadado,
    };

    try {
      const raw = await AsyncStorage.getItem(DEMO_LOG_KEY);
      const log: DemoLogEntry[] = raw ? JSON.parse(raw) : [];
      log.unshift({ ...comprovante, tipo: payload.tipo, categoria: payload.categoria });
      await AsyncStorage.setItem(DEMO_LOG_KEY, JSON.stringify(log.slice(0, 50)));
      await AsyncStorage.setItem(LAST_COMPROVANTE_KEY, JSON.stringify(comprovante));
    } catch {
      // ignora falha de persistência local
    }

    return { idGerado: id, comprovante };
  }

  const res = await api.post('/registros', payload);
  const comprovante: Comprovante | null = res.data?.comprovante || null;
  if (comprovante) {
    try {
      await AsyncStorage.setItem(LAST_COMPROVANTE_KEY, JSON.stringify(comprovante));
    } catch {
      // ignore
    }
  }
  return { idGerado: res.data?.idGerado || 'SUCESSO', comprovante };
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
      const lastRaw = await AsyncStorage.getItem(LAST_COMPROVANTE_KEY);
      if (lastRaw) {
        const last = JSON.parse(lastRaw) as Comprovante;
        if (last.id === params.id) {
          last.alerta = params.aviso;
          await AsyncStorage.setItem(LAST_COMPROVANTE_KEY, JSON.stringify(last));
        }
      }
    } catch {
      // ignora falha de persistência local
    }
    return;
  }

  await api.post('/registros/alerta', params);
}

export async function loadLastComprovante(): Promise<Comprovante | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_COMPROVANTE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Comprovante;
  } catch {
    return null;
  }
}
