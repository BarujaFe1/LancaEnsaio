// supabase/functions/api/index.ts
// Edge Function "api" UNIFICADA (Irmãos e Irmãs)
// Auth: APP_API_TOKEN (Bearer / x-app-token). Health público.

import { auditarRegistro, gerarIdRegistro } from "./auditoria.ts";
import { authorizeRequest } from "./auth.ts";
import {
  appendIdemToMetadado,
  findRowByIdempotencyKey,
  normalizeIdempotencyKey,
} from "./idempotency.ts";

type RegistroPayload = {
  nomeLancador?: string;
  tipo?: "IRMAOS" | "IRMAS";
  cidade?: string;
  categoria?: string;
  instrumento?: string;
  ministerio?: string;
  musicaCargo?: string;
  idempotencyKey?: string;
};

const ORQUESTRA_SHEET_ID = Deno.env.get("ORQUESTRA_SHEET_ID") || "";
const GOOGLE_SERVICE_ACCOUNT_B64 = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_B64") || "";
const APP_API_TOKEN = Deno.env.get("APP_API_TOKEN") || "";

const SHEET_CONFIG_RANGE = "'Base Geral'!A2:H500";
const SHEET_REGISTROS_RANGE = "'Dados Geral'!A:H";
const SHEET_REGISTROS_TABLE = "'Dados Geral'!A2:H5000";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers":
        "authorization, content-type, x-app-token, idempotency-key",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    },
  });
}

function limparArray(arr: string[] = []) {
  return Array.from(
    new Set(arr.map((v) => (v ?? "").toString().trim()).filter((v) => v && v !== "-")),
  );
}

function safeString(v: unknown) {
  if (typeof v === "string" && v.trim()) return v.trim();
  return "-";
}

function formatNowBR() {
  const d = new Date();
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function b64urlEncodeBytes(bytes: Uint8Array) {
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlEncodeString(s: string) {
  return b64urlEncodeBytes(new TextEncoder().encode(s));
}

let cachedGoogleToken = "";
let cachedGoogleTokenExpMs = 0;

function mustEnv() {
  if (!ORQUESTRA_SHEET_ID) throw new Error("ORQUESTRA_SHEET_ID não definido");
  if (!GOOGLE_SERVICE_ACCOUNT_B64) throw new Error("GOOGLE_SERVICE_ACCOUNT_B64 não definido");
}

async function importPkcs8(privateKeyPem: string) {
  const pem = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");

  const raw = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "pkcs8",
    raw.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function b64url(obj: unknown) {
  return b64urlEncodeString(JSON.stringify(obj));
}

async function getGoogleAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedGoogleToken && cachedGoogleTokenExpMs > now + 60_000) return cachedGoogleToken;

  const saJson = JSON.parse(atob(GOOGLE_SERVICE_ACCOUNT_B64));
  const clientEmail = saJson.client_email;
  const privateKey = saJson.private_key;

  const iat = Math.floor(now / 1000);
  const exp = iat + 3600;

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat,
    exp,
  };

  const unsigned = `${b64url(header)}.${b64url(payload)}`;
  const key = await importPkcs8(privateKey);
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${b64urlEncodeBytes(new Uint8Array(sig))}`;

  const body = new URLSearchParams();
  body.set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  body.set("assertion", jwt);

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Falha ao obter token Google: ${resp.status} ${t}`);
  }

  const data = await resp.json();
  cachedGoogleToken = data.access_token;
  cachedGoogleTokenExpMs = now + Number(data.expires_in || 3600) * 1000;
  return cachedGoogleToken;
}

async function sheetsGet(range: string) {
  const access = await getGoogleAccessToken();
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(ORQUESTRA_SHEET_ID)}/values/${encodeURIComponent(range)}`;
  const resp = await fetch(url, {
    headers: { authorization: `Bearer ${access}` },
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Sheets GET falhou: ${resp.status} ${t}`);
  }
  const data = await resp.json();
  return (data.values || []) as string[][];
}

async function sheetsAppend(range: string, values: string[][]) {
  const access = await getGoogleAccessToken();
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(ORQUESTRA_SHEET_ID)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${access}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ values }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Sheets APPEND falhou: ${resp.status} ${t}`);
  }
  return await resp.json();
}

async function sheetsUpdate(range: string, values: string[][]) {
  const access = await getGoogleAccessToken();
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(ORQUESTRA_SHEET_ID)}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${access}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ values }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Sheets UPDATE falhou: ${resp.status} ${t}`);
  }
  return await resp.json();
}

function resolvePath(pathname: string): string {
  let path = pathname.replace(/\/+$/g, "");
  if (path.includes("/functions/v1/api")) {
    path = path.split("/functions/v1/api")[1] || "/";
  } else if (path.includes("/functions/v1/")) {
    const parts = path.split("/");
    path = "/" + parts.slice(4).join("/");
  }
  if (path.startsWith("/api")) path = path.slice(4) || "/";
  if (path === "" || path === "/") path = "/";
  return path;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return json({ ok: true }, 200);
    }

    const path = resolvePath(new URL(req.url).pathname);

    // GET /health — público
    if (req.method === "GET" && (path === "/" || path === "/health")) {
      return json({
        ok: true,
        service: "LançaEnsaio API Unificada",
        now: new Date().toISOString(),
        sheetsConfigured: Boolean(ORQUESTRA_SHEET_ID && GOOGLE_SERVICE_ACCOUNT_B64),
        authEnforced: Boolean(APP_API_TOKEN.trim()),
      });
    }

    const auth = authorizeRequest(req, APP_API_TOKEN);
    if (!auth.ok) {
      return json({ erro: auth.erro }, auth.status);
    }

    mustEnv();

    // GET /config
    if (req.method === "GET" && path === "/config") {
      const linhas = await sheetsGet(SHEET_CONFIG_RANGE);

      const cordas: string[] = [];
      const metais: string[] = [];
      const madeiras: string[] = [];
      const teclas: string[] = [];
      const cidadesSemAcento: string[] = [];
      const ministerios: string[] = [];
      const cargosMusicais: string[] = [];
      const cidadesComAcento: string[] = [];

      for (const linha of linhas) {
        cordas.push(String(linha[0] ?? "").trim());
        metais.push(String(linha[1] ?? "").trim());
        madeiras.push(String(linha[2] ?? "").trim());
        teclas.push(String(linha[3] ?? "").trim());
        cidadesSemAcento.push(String(linha[4] ?? "").trim());
        ministerios.push(String(linha[5] ?? "").trim());
        cargosMusicais.push(String(linha[6] ?? "").trim());
        cidadesComAcento.push(String(linha[7] ?? "").trim());
      }

      return json({
        sucesso: true,
        instrumentos: {
          Cordas: limparArray(cordas),
          Metais: limparArray(metais),
          Madeiras: limparArray(madeiras),
          Teclas: limparArray(teclas),
        },
        cidadesSemAcento: limparArray(cidadesSemAcento),
        cidades: limparArray(cidadesComAcento.length ? cidadesComAcento : cidadesSemAcento),
        ministerios: limparArray(ministerios),
        cargosMusicais: limparArray(cargosMusicais),
      });
    }

    // POST /registros
    if (req.method === "POST" && path === "/registros") {
      const dados = (await req.json().catch(() => ({}))) as RegistroPayload;
      const tipo = (dados.tipo || "IRMAOS") as "IRMAOS" | "IRMAS";
      const nomeLancador = (dados.nomeLancador || "Desconhecido").trim();

      const idemFromHeader = normalizeIdempotencyKey(req.headers.get("idempotency-key"));
      const idemKey = normalizeIdempotencyKey(dados.idempotencyKey) || idemFromHeader;

      if (idemKey) {
        const existingRows = await sheetsGet(SHEET_REGISTROS_TABLE);
        const hit = findRowByIdempotencyKey(existingRows, idemKey);
        if (hit) {
          return json({
            sucesso: true,
            idGerado: hit.id,
            replayed: true,
            statusAuditoria: hit.metadado,
            comprovante: {
              id: hit.id,
              horario: hit.horario,
              cidade: hit.cidade,
              instrumento: hit.instrumento,
              ministerio: hit.ministerio,
              musica: hit.musica,
              auditoria: hit.metadado,
            },
          });
        }
      }

      const idGerado = gerarIdRegistro(tipo, nomeLancador);

      const dadosParaAuditoria = {
        tipo,
        categoria: safeString(dados.categoria),
        instrumento: safeString(dados.instrumento),
        cidade: safeString(dados.cidade),
        ministerio: safeString(dados.ministerio),
        musicaCargo: safeString(dados.musicaCargo),
      };

      const { cargoFinal, statusAuditoria } = auditarRegistro(dadosParaAuditoria);
      const horarioLancamento = formatNowBR();

      let metadado = `META APP=UNIFICADO TIPO=${tipo} USER=${nomeLancador}`;
      if (statusAuditoria) metadado = `${statusAuditoria} | ${metadado}`;
      metadado = appendIdemToMetadado(metadado, idemKey);

      const linha = [
        horarioLancamento,
        idGerado,
        dadosParaAuditoria.categoria,
        dadosParaAuditoria.instrumento,
        dadosParaAuditoria.cidade,
        dadosParaAuditoria.ministerio,
        cargoFinal,
        metadado,
      ];

      await sheetsAppend(SHEET_REGISTROS_RANGE, [linha]);

      return json({
        sucesso: true,
        idGerado,
        replayed: false,
        statusAuditoria: metadado,
        comprovante: {
          id: idGerado,
          horario: new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" }),
          cidade: dadosParaAuditoria.cidade,
          instrumento: dadosParaAuditoria.instrumento,
          ministerio: dadosParaAuditoria.ministerio,
          musica: cargoFinal,
          auditoria: metadado,
        },
      });
    }

    // POST /registros/alerta
    if (req.method === "POST" && path === "/registros/alerta") {
      const body = (await req.json().catch(() => ({}))) as {
        id?: string;
        aviso?: string;
        nomeLancador?: string;
      };
      const id = String(body.id || "").trim();
      const aviso = String(body.aviso || "").trim();
      const nomeLancador = String(body.nomeLancador || "Desconhecido").trim();

      if (!id || !aviso) return json({ erro: "id e aviso são obrigatórios" }, 400);

      const ids = await sheetsGet("'Dados Geral'!B2:B5000");
      let rowNumber = -1;
      for (let i = 0; i < ids.length; i++) {
        const cell = String((ids[i] || [])[0] || "").trim();
        if (cell === id) {
          rowNumber = i + 2;
          break;
        }
      }

      if (rowNumber === -1) return json({ erro: "Registro não encontrado para este id" }, 404);

      const cellRange = `'Dados Geral'!H${rowNumber}:H${rowNumber}`;
      const atualArr = await sheetsGet(cellRange);
      const atual = String(((atualArr[0] || [])[0] || "")).trim();

      const stamp = formatNowBR();
      const novoAviso = `ALERTA (${stamp} - ${nomeLancador}): ${aviso}`;
      const novoValor = atual ? `${atual} | ${novoAviso}` : novoAviso;

      await sheetsUpdate(cellRange, [[novoValor]]);

      return json({ sucesso: true, id, rowNumber, aviso: novoAviso });
    }

    return json({ erro: "Rota não encontrada", debug: { method: req.method, path } }, 404);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ erro: "Erro interno", detalhe: message }, 500);
  }
});
