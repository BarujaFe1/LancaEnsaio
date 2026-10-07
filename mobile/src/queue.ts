// mobile/src/queue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  enviarRegistro,
  toAsciiJson,
  getApiUrl,
  type RegistroPayload,
} from './backend';

const QUEUE_STORAGE_KEY = '@ensaio/offline_queue_v2';
const API_URL = getApiUrl();
const isGoogleScript = API_URL.includes('script.google.com');

export type QueueItem = {
  id: string;
  payload: RegistroPayload;
  timestamp: number;
  tentativas: number;
};

export type QueueStatus = {
  pendentes: number;
  sincronizando: boolean;
  ultimoErro?: string;
};

type QueueListener = (status: QueueStatus) => void;

let memoryQueue: QueueItem[] = [];
let isProcessing = false;
let ultimoErroGlobal: string | undefined = undefined;
const listeners = new Set<QueueListener>();

function notifyListeners(ultimoErro?: string) {
  if (ultimoErro !== undefined) {
    ultimoErroGlobal = ultimoErro;
  }
  const status: QueueStatus = {
    pendentes: memoryQueue.length,
    sincronizando: isProcessing,
    ultimoErro: memoryQueue.length === 0 ? undefined : ultimoErroGlobal,
  };
  for (const fn of listeners) {
    try {
      fn(status);
    } catch {}
  }
}

export function subscribeQueue(listener: QueueListener): () => void {
  listeners.add(listener);
  listener({
    pendentes: memoryQueue.length,
    sincronizando: isProcessing,
    ultimoErro: memoryQueue.length === 0 ? undefined : ultimoErroGlobal,
  });
  return () => {
    listeners.delete(listener);
  };
}

export async function carregarFilaInicial(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (raw) {
      memoryQueue = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Erro ao carregar fila do armazenamento:', err);
  }
  notifyListeners();
  if (memoryQueue.length > 0) {
    processarFila();
  }
}

async function persistirFila(): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(memoryQueue));
  } catch (err) {
    console.error('Erro ao persistir fila:', err);
  }
  notifyListeners();
}

/**
 * Enfileira um novo lançamento de forma imediata e garantida.
 */
export async function enfileirarLancamento(
  id: string,
  payload: RegistroPayload
): Promise<void> {
  const item: QueueItem = {
    id,
    payload: { ...payload, id },
    timestamp: Date.now(),
    tentativas: 0,
  };

  memoryQueue.push(item);
  await persistirFila();

  // Dispara o processador em background
  processarFila();
}

/**
 * Processador resiliente com suporte a lote (batch) e retry automático.
 */
export async function processarFila(): Promise<void> {
  if (isProcessing || memoryQueue.length === 0) return;
  isProcessing = true;
  notifyListeners();

  try {
    while (memoryQueue.length > 0) {
      const currentUrl = getApiUrl();
      const isGAS = currentUrl.includes('script.google.com');

      // Se houver múltiplos itens e estiver conectado ao Google Apps Script, envia em lote
      if (isGAS && memoryQueue.length > 1) {
        const batchSize = Math.min(memoryQueue.length, 25);
        const lote = memoryQueue.slice(0, batchSize);

        try {
          const bodyAscii = toAsciiJson({
            action: 'lote',
            itens: lote.map((item) => ({ ...item.payload, id: item.id })),
          });

          const resp = await fetch(currentUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: bodyAscii,
          });

          const resData = await resp.json();
          if (resData?.sucesso) {
            memoryQueue.splice(0, batchSize);
            await persistirFila();
            continue;
          }
        } catch (loteErr) {
          console.warn('Falha no lote, tentando unitário:', loteErr);
        }
      }

      // Processamento unitário
      const item = memoryQueue[0];
      try {
        await enviarRegistro(item.payload);
        memoryQueue.shift();
        await persistirFila();
      } catch (err: unknown) {
        item.tentativas += 1;
        const msg = (err as Error)?.message || 'Erro de conexão';
        console.warn(`Tentativa ${item.tentativas} falhou para ${item.id}:`, msg);

        if (item.tentativas >= 5) {
          notifyListeners(`Conexão instável. ${memoryQueue.length} aguardando reconexão.`);
          break;
        }

        await new Promise((r) => setTimeout(r, 2000));
        break;
      }
    }
  } finally {
    isProcessing = false;
    notifyListeners();
  }
}

export function getQuantidadePendentes(): number {
  return memoryQueue.length;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Fila] Conexão online restabelecida, descarregando...');
    processarFila();
  });
}
