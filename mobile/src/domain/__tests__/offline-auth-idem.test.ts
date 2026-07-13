import {
  createIdempotencyKey,
  enqueueItem,
  markAttempt,
  pendingCount,
  removeByKey,
  type QueueItem,
} from '../offline-queue';
import {
  appendIdemToMetadado,
  extractIdemFromMetadado,
  findRowByIdempotencyKey,
  normalizeIdempotencyKey,
} from '../idempotency';
import { authorizeAppToken, timingSafeEqualString } from '../app-auth';

describe('offline-queue domain', () => {
  const base: QueueItem = {
    kind: 'registro',
    idempotencyKey: 'abc-12345',
    createdAt: '2026-01-01T00:00:00.000Z',
    attempts: 0,
    payload: {
      tipo: 'IRMAOS',
      nomeLancador: 'Felipe',
      cidade: 'Sertãozinho',
      categoria: '',
      instrumento: '',
      ministerio: '',
      musicaCargo: '',
    },
  };

  it('createIdempotencyKey retorna string não vazia', () => {
    expect(createIdempotencyKey('fixed-uuid-0001').length).toBeGreaterThan(7);
  });

  it('enqueue deduplica pela chave', () => {
    const q1 = enqueueItem([], base);
    const q2 = enqueueItem(q1, { ...base, attempts: 1 });
    expect(pendingCount(q2)).toBe(1);
    expect(q2[0].attempts).toBe(1);
  });

  it('remove e markAttempt', () => {
    const q = enqueueItem([], base);
    const marked = markAttempt(q, base.idempotencyKey, 'timeout');
    expect(marked[0].attempts).toBe(1);
    expect(marked[0].lastError).toBe('timeout');
    expect(removeByKey(marked, base.idempotencyKey)).toEqual([]);
  });
});

describe('idempotency', () => {
  it('normaliza e rejeita chaves inválidas', () => {
    expect(normalizeIdempotencyKey('short')).toBeNull();
    expect(normalizeIdempotencyKey('valid-key-01')).toBe('valid-key-01');
    expect(normalizeIdempotencyKey('bad key!!')).toBeNull();
  });

  it('extrai IDEM do metadado e faz replay lookup', () => {
    const meta = 'META APP=UNIFICADO TIPO=IRMAOS USER=X IDEM=valid-key-01';
    expect(extractIdemFromMetadado(meta)).toBe('valid-key-01');
    const rows = [
      ['10:00', 'MID1234', '-', '-', 'Cidade', '-', 'Cantor', meta],
    ];
    const hit = findRowByIdempotencyKey(rows, 'valid-key-01');
    expect(hit?.id).toBe('MID1234');
    expect(appendIdemToMetadado('META', 'valid-key-01')).toContain('IDEM=valid-key-01');
  });
});

describe('app-auth', () => {
  it('compat aberto sem token esperado', () => {
    expect(authorizeAppToken('', null).ok).toBe(true);
  });

  it('exige bearer quando token configurado', () => {
    const r = authorizeAppToken('secret-token', null);
    expect(r.ok).toBe(false);
  });

  it('aceita bearer correto', () => {
    const r = authorizeAppToken('secret-token', 'Bearer secret-token');
    expect(r).toEqual({ ok: true, mode: 'enforced' });
  });

  it('timingSafeEqualString distingue valores', () => {
    expect(timingSafeEqualString('abc', 'abc')).toBe(true);
    expect(timingSafeEqualString('abc', 'abd')).toBe(false);
  });
});
