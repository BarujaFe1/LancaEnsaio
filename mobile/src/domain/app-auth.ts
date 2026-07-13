/** Espelho testável da auth por app token (Edge Function). */

export function extractBearerTokenFromHeader(authorization: string | null, xAppToken?: string | null): string | null {
  const auth = authorization || '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (match?.[1]) return match[1].trim();
  if (xAppToken?.trim()) return xAppToken.trim();
  return null;
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  if (ba.length !== bb.length) {
    let acc = ba.length ^ bb.length;
    const n = Math.max(ba.length, bb.length);
    for (let i = 0; i < n; i++) {
      acc |= (ba[i % ba.length] ?? 0) ^ (bb[i % bb.length] ?? 0);
    }
    return acc === 0 && ba.length === bb.length;
  }
  let out = 0;
  for (let i = 0; i < ba.length; i++) out |= ba[i] ^ bb[i];
  return out === 0;
}

export function authorizeAppToken(
  expectedToken: string,
  authorization: string | null,
  xAppToken?: string | null
): { ok: true; mode: 'enforced' | 'compat_open' } | { ok: false; status: number; erro: string } {
  const expected = (expectedToken || '').trim();
  if (!expected) return { ok: true, mode: 'compat_open' };

  const provided = extractBearerTokenFromHeader(authorization, xAppToken);
  if (!provided) {
    return {
      ok: false,
      status: 401,
      erro: 'Não autorizado: envie Authorization: Bearer <APP_API_TOKEN>',
    };
  }
  if (!timingSafeEqualString(provided, expected)) {
    return { ok: false, status: 401, erro: 'Não autorizado: token inválido' };
  }
  return { ok: true, mode: 'enforced' };
}
