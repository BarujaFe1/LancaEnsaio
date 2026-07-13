/**
 * Domínio da fila offline (puro) — testável sem AsyncStorage.
 */

export type QueueItemKind = 'registro' | 'alerta';

export type QueuedRegistro = {
  kind: 'registro';
  idempotencyKey: string;
  createdAt: string;
  payload: {
    tipo: 'IRMAOS' | 'IRMAS';
    nomeLancador: string;
    cidade: string;
    categoria: string;
    instrumento: string;
    ministerio: string;
    musicaCargo: string;
  };
  attempts: number;
  lastError?: string;
};

export type QueuedAlerta = {
  kind: 'alerta';
  idempotencyKey: string;
  createdAt: string;
  payload: {
    id: string;
    aviso: string;
    nomeLancador: string;
  };
  attempts: number;
  lastError?: string;
};

export type QueueItem = QueuedRegistro | QueuedAlerta;

export function createIdempotencyKey(randomPart?: string): string {
  const part =
    randomPart ||
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `k-${Date.now()}-${Math.floor(Math.random() * 1e9)}`);
  return part;
}

export function enqueueItem(queue: QueueItem[], item: QueueItem, max = 100): QueueItem[] {
  const withoutDup = queue.filter((q) => q.idempotencyKey !== item.idempotencyKey);
  return [item, ...withoutDup].slice(0, max);
}

export function removeByKey(queue: QueueItem[], key: string): QueueItem[] {
  return queue.filter((q) => q.idempotencyKey !== key);
}

export function markAttempt(queue: QueueItem[], key: string, error: string): QueueItem[] {
  return queue.map((q) =>
    q.idempotencyKey === key
      ? { ...q, attempts: q.attempts + 1, lastError: error }
      : q
  );
}

export function pendingCount(queue: QueueItem[]): number {
  return queue.length;
}
