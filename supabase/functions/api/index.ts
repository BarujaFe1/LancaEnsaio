// supabase/functions/api/index.ts
// Edge Function "api" (compatível com o app atual: /auth/login, /config, /registros)
// ✅ Hospeda seu backend 24/7 com HTTPS no Supabase, mas mantém:
// - Config em "Base Geral"
// - Registros em "Dados Geral"
// - Usuários em "usuarios"

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type UserRow = {
  rowNumber: number;
  ativo: boolean;
  usuario: string;
  nome: string;
  senha: string;
  perfil: string;
  modulos: string[];
  deviceIds: string[];
  ultimoLogin: string;
  observacoes: string;
};

type SessionPayload = {
  token: string;
  usuario: string;
  nome: string;
  perfil: string;
  modulos: string[];
  exp: number; // ms
};

type RegistroPayload = {
  apontamento?: string;
  tipo?: "IRMAOS" | "IRMAS";
  cidade?: string;
  categoria?: string;
  instrumento?: string;
  ministerio?: string;
  musicaCargo?: string;
};

const ORQUESTRA_SHEET_ID = Deno.env.get("ORQUESTRA_SHEET_ID") || "";
const GOOGLE_SERVICE_ACCOUNT_B64 = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_B64") || "";
const APP_JWT_SECRET = Deno.env.get("APP_JWT_SECRET") || "";

const MAX_DEVICES_PER_USER = Number(Deno.env.get("MAX_DEVICES_PER_USER") || "3");
const SESSION_TTL_MS = Number(Deno.env.get("SESSION_TTL_MS") || String(12 * 60 * 60 * 1000)); // 12h

const SHEET_USUARIOS_RANGE = "'usuarios'!A2:I500";
const SHEET_CONFIG_RANGE = "'Base Geral'!A2:H500"; // A..H conforme seu backend atual
const SHEET_REGISTROS_RANGE = "'Dados Geral'!A:H";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, content-type",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    },
  });
}

function stripAccents(str: string) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeKey(str: string) {
  return stripAccents((str || "").trim().toLowerCase());
}

function limparArray(arr: string[] = []) {
  return Array.from(
    new Set(
      arr
        .map((v) => (v ?? "").toString().trim())
        .filter((v) => v && v !== "-"),
    ),
  );
}

function safeString(v: any) {
  if (typeof v === "string" && v.trim()) return v.trim();
  return "-";
}

function isTrueCell(v: any) {
  const s = String(v ?? "").trim().toLowerCase();
  return ["true", "verdadeiro", "1", "sim", "ativo"].includes(s);
}

function splitModulos(v: string) {
  return (v || "")
    .split(/[;|]/g)
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean);
}

function splitDeviceIds(v: string) {
  return (v || "")
    .split(/[;|]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function formatNowBR() {
  const d = new Date();
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function buildMaleUserPrefix(nome: string) {
  const palavras = stripAccents(nome || "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const partes = palavras.map((p) => p.slice(0, 3)).join("");
  return `M${partes || "USR"}`;
}

function random4() {
  return Math.floor(Math.random() * 9000 + 1000).toString();
}

function gerarIdRegistro(tipo: "IRMAOS" | "IRMAS", nomeUsuario: string) {
  if (tipo === "IRMAS") return `F${random4()}`;
  const prefixo = buildMaleUserPrefix(nomeUsuario);
  return `${prefixo}${random4()}`;
}

function auditarRegistro(dados: any) {
  const cat = dados.categoria && dados.categoria !== "-" ? dados.categoria : "";
  const inst = dados.instrumento && dados.instrumento !== "-" ? dados.instrumento : "";
  const min = dados.ministerio && dados.ministerio !== "-" ? dados.ministerio : "";
  const mus = dados.musicaCargo && dados.musicaCargo !== "-" ? dados.musicaCargo : "";
  const cid = dados.cidade && dados.cidade !== "-" ? dados.cidade : "";

  // IRMÃS
  if (dados.tipo === "IRMAS") {
    if (!cid) return { cargoFinal: "-", statusAuditoria: "ERRO 01: 🏙️ Falta Cidade" };
    if (!mus) return { cargoFinal: "Cantora", statusAuditoria: "" };
    return { cargoFinal: mus, statusAuditoria: "" };
  }

  // IRMÃOS
  const isVazio = !cat && !inst && !min && !mus;

  // regra default (irmão presente sem instrumento / sem cargo)
  if (isVazio) {
    if (cid) return { cargoFinal: "Cantor", statusAuditoria: "" };
    return { cargoFinal: "-", statusAuditoria: "ERRO 01: 🏙️ Falta Cidade" };
  }

  if (!cid) return { cargoFinal: mus || "-", statusAuditoria: "ERRO 01: 🏙️ Falta Cidade" };
  if (inst && !cat) return { cargoFinal: mus || "-", statusAuditoria: "ERRO 02: 🎻 Instr sem Cat" };
  if (cat && !inst && !mus) return { cargoFinal: mus || "-", statusAuditoria: "ERRO 03: 📂 Cat sem Instr" };
  if (mus && !inst && mus !== "Cantor") return { cargoFinal: mus || "-", statusAuditoria: "ERRO 04: 🎼 Cargo sem Instr" };
  if (mus && min) return { cargoFinal: mus || "-", statusAuditoria: "ERRO 05: 👔 Conflito Cargos" };

  const erros: string[] = [];
  if (min && inst) erros.push("ERRO 11: 👔 Min Tocando");

  return {
    cargoFinal: mus || "-",
    statusAuditoria: erros.length ? erros.join(" | ") : "",
  };
}

function parseBearerToken(authHeader?: string | null) {
  if (!authHeader) return "";
  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token) return "";
  if (scheme.toLowerCase() !== "bearer") return "";
  return token.trim();
}

function b64urlEncodeBytes(bytes: Uint8Array) {
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlEncodeString(s: string) {
  return b64urlEncodeBytes(new TextEncoder().encode(s));
}

function b64urlDecodeToString(b64url: string) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
  return new TextDecoder().decode(bytes);
}

async function hmacSign(data: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

async function hmacVerify(data: string, secret: string, sig: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return await crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(data));
}

async function gerarTokenSessao(payload: Omit<SessionPayload, "token">) {
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = b64urlEncodeString(JSON.stringify(header));
  const payloadB64 = b64urlEncodeString(JSON.stringify(payload));
  const toSign = `${headerB64}.${payloadB64}`;
  const sig = await hmacSign(toSign, APP_JWT_SECRET);
  const sigB64 = b64urlEncodeBytes(sig);
  return `${toSign}.${sigB64}`;
}

async function validarTokenSessao(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [h, p, s] = parts;
    const toVerify = `${h}.${p}`;

    const sigBytes = new Uint8Array(
      [...atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4))].map((c) =>
        c.charCodeAt(0)
      ),
    );

    const ok = await hmacVerify(toVerify, APP_JWT_SECRET, sigBytes);
    if (!ok) return null;

    const payload = JSON.parse(b64urlDecodeToString(p));
    if (!payload?.exp || Date.now() > Number(payload.exp)) return null;

    // token fica dentro do payload só para manter compatibilidade com o app
    return { ...(payload as any), token };
  } catch {
    return null;
  }
}

// =======================================================
// Google Sheets (Service Account -> Access Token)
// =======================================================
let cachedGoogleToken = "";
let cachedGoogleTokenExpMs = 0;

function mustEnv() {
  if (!ORQUESTRA_SHEET_ID) throw new Error("ORQUESTRA_SHEET_ID não definido");
  if (!GOOGLE_SERVICE_ACCOUNT_B64) throw new Error("GOOGLE_SERVICE_ACCOUNT_B64 não definido");
  if (!APP_JWT_SECRET) throw new Error("APP_JWT_SECRET não definido");
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
  cachedGoogleTokenExpMs = now + (Number(data.expires_in || 3600) * 1000);
  return cachedGoogleToken;
}

async function sheetsGet(range: string) {
  const access = await getGoogleAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(ORQUESTRA_SHEET_ID)}/values/${encodeURIComponent(range)}`;
  const resp = await fetch(url, {
    headers: { authorization: `Bearer ${access}` },
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Sheets GET falhou: ${resp.status} ${t}`);
  }
  const data = await resp.json();
  return (data.values || []) as any[][];
}

async function sheetsAppend(range: string, values: any[][]) {
  const access = await getGoogleAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(ORQUESTRA_SHEET_ID)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
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

async function sheetsUpdate(range: string, values: any[][]) {
  const access = await getGoogleAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(ORQUESTRA_SHEET_ID)}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
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

// =======================================================
// Usuários (lê da aba usuarios)
// =======================================================
async function carregarUsuariosPlanilha(): Promise<UserRow[]> {
  const linhas = await sheetsGet(SHEET_USUARIOS_RANGE);
  const usuarios: UserRow[] = [];

  linhas.forEach((linha, idx) => {
    const rowNumber = idx + 2; // começa em A2
    const ativo = isTrueCell(linha[0]);
    const usuario = String(linha[1] ?? "").trim();
    const nome = String(linha[2] ?? "").trim();
    const senha = String(linha[3] ?? "").trim();
    const perfil = String(linha[4] ?? "").trim().toUpperCase();
    const modulos = splitModulos(String(linha[5] ?? ""));
    const deviceIds = splitDeviceIds(String(linha[6] ?? ""));
    const ultimoLogin = String(linha[7] ?? "").trim();
    const observacoes = String(linha[8] ?? "").trim();

    if (!usuario) return;

    usuarios.push({
      rowNumber,
      ativo,
      usuario,
      nome,
      senha,
      perfil,
      modulos,
      deviceIds,
      ultimoLogin,
      observacoes,
    });
  });

  return usuarios;
}

async function atualizarMetaUsuario(rowNumber: number, deviceIds: string[]) {
  const range = `'usuarios'!G${rowNumber}:H${rowNumber}`;
  const values = [[deviceIds.join(" | "), formatNowBR()]];
  await sheetsUpdate(range, values);
}

function randomHex(bytes = 24) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function requireSession(req: Request): Promise<SessionPayload | null> {
  const token = parseBearerToken(req.headers.get("authorization"));
  if (!token) return null;
  return await validarTokenSessao(token);
}

// =======================================================
// Router
// =======================================================
serve(async (req: Request) => {
  try {
    mustEnv();

    if (req.method === "OPTIONS") {
      return json({ ok: true }, 200);
    }

    const url = new URL(req.url);
    const pathname = url.pathname;

// ✅ Normalização ultra-robusta de rota (Supabase pode entregar pathname em formatos diferentes)
// Exemplos possíveis:
// - /health
// - /api/health
// - /functions/v1/api/health
// - /functions/v1/<funcName>/health
let path = pathname;

// remove barras finais
path = path.replace(/\/+$/g, "");

// caso venha como /functions/v1/<funcName>/...
const m = path.match(/^\/functions\/v1\/([^\/]+)(\/.*)?$/);
if (m) {
  path = m[2] || "";
}

// caso venha como /api/... (func name explícito)
if (path === "/api") path = "";
if (path.startsWith("/api/")) path = path.slice("/api".length);

// garante que começa com "/"
if (!path.startsWith("/")) path = "/" + path;

// vazio vira "/"
if (path === "" || path === "/") path = "/";

// health
    if (req.method === "GET" && (path === "/" || path === "/health")) {
      return json({ ok: true, service: "LançaEnsaio API (Supabase Edge)", now: new Date().toISOString() });
    }

    // LOGIN
    if (req.method === "POST" && path === "/auth/login") {
      const body = (await req.json().catch(() => ({}))) as { usuario?: string; senha?: string; deviceId?: string };

      const usuarioInput = String(body.usuario ?? "").trim();
      const senhaInput = String(body.senha ?? "").trim();
      const deviceIdInput = String(body.deviceId ?? "").trim();

      if (!usuarioInput || !senhaInput) {
        return json({ erro: "Usuário e senha são obrigatórios" }, 400);
      }

      const usuarios = await carregarUsuariosPlanilha();
      const user = usuarios.find((u) => normalizeKey(u.usuario) === normalizeKey(usuarioInput));

      if (!user || user.senha !== senhaInput) return json({ erro: "Usuário ou senha inválidos" }, 401);
      if (!user.ativo) return json({ erro: "Usuário inativo" }, 403);

      let aviso = "";
      const novosDeviceIds = [...(user.deviceIds || [])];

      if (deviceIdInput && !novosDeviceIds.includes(deviceIdInput)) {
        if (novosDeviceIds.length >= MAX_DEVICES_PER_USER) {
          return json({ erro: `Limite de ${MAX_DEVICES_PER_USER} dispositivos atingido para este usuário` }, 403);
        }
        novosDeviceIds.push(deviceIdInput);

        aviso =
          novosDeviceIds.length > 1
            ? `Atenção: este usuário está sendo usado em outro celular (${novosDeviceIds.length}/${MAX_DEVICES_PER_USER}).`
            : "";
      }

      const exp = Date.now() + SESSION_TTL_MS;
      const payloadNoToken = {
        usuario: user.usuario,
        nome: user.nome || user.usuario,
        perfil: user.perfil || "APONTADOR_IRMAOS",
        modulos: user.modulos.length ? user.modulos : ["IRMAOS"],
        exp,
      };

      const token = await gerarTokenSessao(payloadNoToken as any);

      // atualiza meta no Sheets SEM travar login (mais rápido)
      if (deviceIdInput && novosDeviceIds.join("|") !== (user.deviceIds || []).join("|")) {
        atualizarMetaUsuario(user.rowNumber, novosDeviceIds).catch(() => {});
      }

      return json({
        sucesso: true,
        token,
        aviso,
        usuario: {
          usuario: payloadNoToken.usuario,
          nome: payloadNoToken.nome,
          perfil: payloadNoToken.perfil,
          modulos: payloadNoToken.modulos,
        },
      });
    }

    // LOGOUT (stateless -> só resposta ok; no app isso serve para “limpar” local)
    if (req.method === "POST" && path === "/auth/logout") {
      return json({ sucesso: true });
    }

    // CONFIG
    if (req.method === "GET" && path === "/config") {
      const sess = await requireSession(req);
      if (!sess) return json({ erro: "Sessão inválida" }, 401);
      if (!sess.modulos.includes("IRMAOS")) return json({ erro: "Usuário sem permissão para módulo IRMÃOS" }, 403);

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
        // Base Geral: A=cordas B=metais C=madeiras D=teclas E=sem acento F=min G=música H=com acento
        cordas.push(String(linha[0] ?? "").trim());
        metais.push(String(linha[1] ?? "").trim());
        madeiras.push(String(linha[2] ?? "").trim());
        teclas.push(String(linha[3] ?? "").trim());
        cidadesSemAcento.push(String(linha[4] ?? "").trim());
        ministerios.push(String(linha[5] ?? "").trim());
        cargosMusicais.push(String(linha[6] ?? "").trim());
        cidadesComAcento.push(String(linha[7] ?? "").trim());
      }

      const payloadConfig = {
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
      };

      return json({
        ...payloadConfig,
        usuario: { nome: sess.nome, perfil: sess.perfil, modulos: sess.modulos },
      });
    }

    // REGISTROS
    if (req.method === "POST" && path === "/registros") {
      const sess = await requireSession(req);
      if (!sess) return json({ erro: "Sessão inválida" }, 401);

      const dados = (await req.json().catch(() => ({}))) as RegistroPayload;
      const tipo = (dados.tipo || "IRMAOS") as "IRMAOS" | "IRMAS";

      if (tipo === "IRMAOS" && !sess.modulos.includes("IRMAOS")) {
        return json({ erro: "Usuário sem permissão para módulo IRMÃOS" }, 403);
      }

      const idGerado = gerarIdRegistro(tipo, sess.nome);

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

      const linha = [
        horarioLancamento, // A (horário do lançamento)
        idGerado,                                       // B
        dadosParaAuditoria.categoria,                   // C
        dadosParaAuditoria.instrumento,                 // D
        dadosParaAuditoria.cidade,                      // E
        dadosParaAuditoria.ministerio,                  // F
        cargoFinal,                                     // G
        statusAuditoria || "",                          // H
      ];

      await sheetsAppend(SHEET_REGISTROS_RANGE, [linha]);

      return json({
        sucesso: true,
        idGerado,
        statusAuditoria,
        comprovante: {
          id: idGerado,
          horario: new Date().toLocaleTimeString("pt-BR"),
          cidade: dadosParaAuditoria.cidade,
          instrumento: dadosParaAuditoria.instrumento,
          ministerio: dadosParaAuditoria.ministerio,
          musica: cargoFinal,
          auditoria: statusAuditoria || "",
        },
      });
    }

    // ALERTA MANUAL (atualiza coluna H do registro já lançado)
if (req.method === "POST" && path === "/registros/alerta") {
  const sess = await requireSession(req);
  if (!sess) return json({ erro: "Sessão inválida" }, 401);

  const body = (await req.json().catch(() => ({}))) as { id?: string; aviso?: string };
  const id = String(body.id || "").trim();
  const aviso = String(body.aviso || "").trim();

  if (!id || !aviso) return json({ erro: "id e aviso são obrigatórios" }, 400);

  // busca o id na coluna B (B2:B5000)
  const ids = await sheetsGet("'Dados Geral'!B2:B5000");
  let rowNumber = -1;
  for (let i = 0; i < ids.length; i++) {
    const cell = String((ids[i] || [])[0] || "").trim();
    if (cell === id) {
      rowNumber = i + 2; // começa em B2
      break;
    }
  }

  if (rowNumber === -1) return json({ erro: "Registro não encontrado para este id" }, 404);

  // lê o H atual e anexa
  const cellRange = `'Dados Geral'!H${rowNumber}:H${rowNumber}`;
  const atualArr = await sheetsGet(cellRange);
  const atual = String(((atualArr[0] || [])[0] || "")).trim();

  const stamp = formatNowBR();
  const novoAviso = `ALERTA (${stamp}): ${aviso}`;
  const novoValor = atual ? `${atual} | ${novoAviso}` : novoAviso;

  await sheetsUpdate(cellRange, [[novoValor]]);

  return json({ sucesso: true, id, rowNumber, aviso: novoAviso });
}

return json({ erro: "Rota não encontrada", debug: { method: req.method, pathname, path } }, 404);
  } catch (err: any) {
    return json({ erro: "Erro interno", detalhe: String(err?.message || err) }, 500);
  }
});
