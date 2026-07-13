/**
 * Autenticação da Edge Function via app token compartilhado.
 *
 * Não é login de usuário: é um segredo de aplicativo comparado com
 * timing-safe equality. Health permanece público.
 */

export function extractBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (match?.[1]) return match[1].trim();

  const headerToken = req.headers.get("x-app-token");
  if (headerToken?.trim()) return headerToken.trim();

  return null;
}

/** Comparação em tempo constante (UTF-8 bytes). */
export function timingSafeEqualString(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  if (ba.length !== bb.length) {
    // Ainda percorre para não short-circuitar por tamanho em cenários triviais.
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

export type AuthResult =
  | { ok: true; mode: "enforced" | "compat_open" }
  | { ok: false; status: number; erro: string };

/**
 * Se APP_API_TOKEN estiver definido, exige Bearer/x-app-token correspondente.
 * Se não estiver definido, opera em modo compat (aberto) — útil até o secret ser configurado.
 */
export function authorizeRequest(req: Request, expectedToken: string): AuthResult {
  const expected = (expectedToken || "").trim();
  if (!expected) {
    return { ok: true, mode: "compat_open" };
  }

  const provided = extractBearerToken(req);
  if (!provided) {
    return {
      ok: false,
      status: 401,
      erro: "Não autorizado: envie Authorization: Bearer <APP_API_TOKEN>",
    };
  }

  if (!timingSafeEqualString(provided, expected)) {
    return { ok: false, status: 401, erro: "Não autorizado: token inválido" };
  }

  return { ok: true, mode: "enforced" };
}
