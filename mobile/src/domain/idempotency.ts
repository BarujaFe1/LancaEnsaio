/**
 * Espelho client-side das regras de idempotência da Edge Function.
 * Mantém validação local alinhada ao servidor.
 */

export function normalizeIdempotencyKey(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const key = raw.trim();
  if (!key) return null;
  if (key.length < 8 || key.length > 128) return null;
  if (!/^[A-Za-z0-9._:-]+$/.test(key)) return null;
  return key;
}

export function extractIdemFromMetadado(metadado: string): string | null {
  const m = String(metadado || '').match(/\bIDEM=([A-Za-z0-9._:-]+)/);
  return m?.[1] || null;
}

export function findRowByIdempotencyKey(
  rows: string[][],
  idemKey: string
): {
  rowNumber: number;
  id: string;
  cidade: string;
  instrumento: string;
  ministerio: string;
  musica: string;
  metadado: string;
  horario: string;
} | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const metadado = String(row[7] ?? '');
    if (extractIdemFromMetadado(metadado) === idemKey) {
      return {
        rowNumber: i + 2,
        horario: String(row[0] ?? ''),
        id: String(row[1] ?? ''),
        cidade: String(row[4] ?? '-'),
        instrumento: String(row[3] ?? '-'),
        ministerio: String(row[5] ?? '-'),
        musica: String(row[6] ?? '-'),
        metadado,
      };
    }
  }
  return null;
}

export function appendIdemToMetadado(metadado: string, idemKey: string | null): string {
  if (!idemKey) return metadado;
  if (metadado.includes(`IDEM=${idemKey}`)) return metadado;
  return `${metadado} IDEM=${idemKey}`;
}
