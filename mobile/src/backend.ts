// mobile/src/backend.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { api } from './api';
import { CITY_GROUPS_FIXED } from './constants/cidades';
import { auditarRegistro, gerarIdRegistro } from './domain/auditoria';
import { createIdempotencyKey } from './domain/offline-queue';
import {
  bumpAttempt,
  dropFromQueue,
  enqueueAlerta,
  enqueueRegistro,
  loadQueue,
} from './storage/offline-queue-store';
import { formatDeviceTimestamp } from './utils/date';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim();
const DEMO_FLAG = (process.env.EXPO_PUBLIC_DEMO || '').trim().toLowerCase() === 'true';

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
  idempotencyKey?: string;
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
  pendingSync?: boolean;
};

type DemoLogEntry = Comprovante & {
  tipo: RegistroPayload['tipo'];
  categoria: string;
};

const DEMO_INSTRUMENTOS: Record<string, string[]> = {
  Cordas: ['Violão', 'Viola', 'Cavaquinho', 'Contrabaixo', 'Violino'],
  Metais: ['Trompete', 'Trombone', 'Trompa', 'Tuba', 'Eufônio'],
  Madeiras: ['Flauta', 'Clarinete', 'Oboé', 'Saxofone Alto', 'Saxofone Tenor'],
  Teclas: ['Órgão', 'Teclado', 'Piano'],
};

const DEMO_MINISTERIOS = [
  'Ancião',
  'Diácono',
  'Cooperador',
  'Encarregado Local',
  'Encarregado Regional',
];

const DEMO_CARGOS = [
  'Organista',
  'Instrutora',
  'Examinadora',
  'Encarregado Local',
  'Encarregado Regional',
];

const DEMO_LOG_KEY = '@ensaio/demo_log_v1';
const LAST_COMPROVANTE_KEY = '@ensaio/last_comprovante_v1';

function demoCidades(): string[] {
  return CITY_GROUPS_FIXED.reduce<string[]>((acc, g) => acc.concat(g.items), []);
}

async function isOnlineNow(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

function isNetworkError(err: unknown): boolean {
  const e = err as { code?: string; message?: string; response?: unknown };
  if (e?.response) return false;
  const msg = String(e?.message || e || '').toLowerCase();
  return (
    e?.code === 'ERR_NETWORK' ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('offline')
  );
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

async function persistComprovante(comprovante: Comprovante | null) {
  if (!comprovante) return;
  try {
    await AsyncStorage.setItem(LAST_COMPROVANTE_KEY, JSON.stringify(comprovante));
  } catch {
    // ignore
  }
}

function localPendingComprovante(
  payload: RegistroPayload & { tipo: 'IRMAOS' | 'IRMAS' },
  idempotencyKey: string
): Comprovante {
  const audit = auditarRegistro({
    tipo: payload.tipo,
    categoria: payload.categoria,
    instrumento: payload.instrumento,
    cidade: payload.cidade,
    ministerio: payload.ministerio,
    musicaCargo: payload.musicaCargo,
  });

  return {
    id: `PEND-${idempotencyKey.slice(0, 8)}`,
    horario: formatDeviceTimestamp(),
    cidade: payload.cidade,
    instrumento: payload.instrumento || '-',
    ministerio: payload.ministerio || '-',
    musica: audit.cargoFinal,
    auditoria: `PENDENTE DE SYNC | IDEM=${idempotencyKey}`,
    pendingSync: true,
  };
}

export async function enviarRegistro(
  payload: RegistroPayload
): Promise<{ idGerado: string; comprovante: Comprovante | null; queued?: boolean }> {
  if (!payload.tipo) {
    throw new Error('Tipo de lançamento não definido.');
  }

  const idempotencyKey = payload.idempotencyKey || createIdempotencyKey();

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
      ? `${audit.statusAuditoria} | META APP=DEMO TIPO=${payload.tipo} USER=${payload.nomeLancador} IDEM=${idempotencyKey}`
      : `META APP=DEMO TIPO=${payload.tipo} USER=${payload.nomeLancador} IDEM=${idempotencyKey}`;

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
      await persistComprovante(comprovante);
    } catch {
      // ignore
    }

    return { idGerado: id, comprovante };
  }

  const body = { ...payload, tipo: payload.tipo, idempotencyKey };

  const online = await isOnlineNow();
  if (!online) {
    await enqueueRegistro({
      kind: 'registro',
      idempotencyKey,
      createdAt: new Date().toISOString(),
      payload: {
        tipo: payload.tipo,
        nomeLancador: payload.nomeLancador,
        cidade: payload.cidade,
        categoria: payload.categoria,
        instrumento: payload.instrumento,
        ministerio: payload.ministerio,
        musicaCargo: payload.musicaCargo,
      },
      attempts: 0,
    });
    const pending = localPendingComprovante(
      { ...payload, tipo: payload.tipo },
      idempotencyKey
    );
    await persistComprovante(pending);
    return { idGerado: pending.id, comprovante: pending, queued: true };
  }

  try {
    const res = await api.post('/registros', body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    const comprovante: Comprovante | null = res.data?.comprovante || null;
    await persistComprovante(comprovante);
    return { idGerado: res.data?.idGerado || 'SUCESSO', comprovante };
  } catch (err) {
    if (isNetworkError(err)) {
      await enqueueRegistro({
        kind: 'registro',
        idempotencyKey,
        createdAt: new Date().toISOString(),
        payload: {
          tipo: payload.tipo,
          nomeLancador: payload.nomeLancador,
          cidade: payload.cidade,
          categoria: payload.categoria,
          instrumento: payload.instrumento,
          ministerio: payload.ministerio,
          musicaCargo: payload.musicaCargo,
        },
        attempts: 0,
        lastError: String((err as Error)?.message || err),
      });
      const pending = localPendingComprovante(
        { ...payload, tipo: payload.tipo },
        idempotencyKey
      );
      await persistComprovante(pending);
      return { idGerado: pending.id, comprovante: pending, queued: true };
    }
    throw err;
  }
}

export async function enviarAlerta(params: {
  id: string;
  aviso: string;
  nomeLancador: string;
  idempotencyKey?: string;
}): Promise<{ queued?: boolean }> {
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
      // ignore
    }
    return {};
  }

  const idempotencyKey = params.idempotencyKey || createIdempotencyKey();
  const online = await isOnlineNow();
  if (!online) {
    await enqueueAlerta({
      kind: 'alerta',
      idempotencyKey,
      createdAt: new Date().toISOString(),
      payload: {
        id: params.id,
        aviso: params.aviso,
        nomeLancador: params.nomeLancador,
      },
      attempts: 0,
    });
    return { queued: true };
  }

  try {
    await api.post('/registros/alerta', {
      id: params.id,
      aviso: params.aviso,
      nomeLancador: params.nomeLancador,
    });
    return {};
  } catch (err) {
    if (isNetworkError(err)) {
      await enqueueAlerta({
        kind: 'alerta',
        idempotencyKey,
        createdAt: new Date().toISOString(),
        payload: {
          id: params.id,
          aviso: params.aviso,
          nomeLancador: params.nomeLancador,
        },
        attempts: 0,
        lastError: String((err as Error)?.message || err),
      });
      return { queued: true };
    }
    throw err;
  }
}

export async function flushOfflineQueue(): Promise<{
  flushed: number;
  remaining: number;
  errors: string[];
}> {
  if (isDemo()) return { flushed: 0, remaining: 0, errors: [] };

  const online = await isOnlineNow();
  if (!online) {
    const q = await loadQueue();
    return { flushed: 0, remaining: q.length, errors: ['offline'] };
  }

  let flushed = 0;
  const errors: string[] = [];
  const queue = await loadQueue();

  // Process oldest first (queue stores newest first)
  for (const item of [...queue].reverse()) {
    try {
      if (item.kind === 'registro') {
        await api.post(
          '/registros',
          { ...item.payload, idempotencyKey: item.idempotencyKey },
          { headers: { 'Idempotency-Key': item.idempotencyKey } }
        );
      } else {
        await api.post('/registros/alerta', item.payload);
      }
      await dropFromQueue(item.idempotencyKey);
      flushed += 1;
    } catch (err) {
      const msg = String((err as Error)?.message || err);
      errors.push(`${item.idempotencyKey}: ${msg}`);
      await bumpAttempt(item.idempotencyKey, msg);
    }
  }

  const remaining = (await loadQueue()).length;
  return { flushed, remaining, errors };
}

export async function getPendingQueueCount(): Promise<number> {
  return (await loadQueue()).length;
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
