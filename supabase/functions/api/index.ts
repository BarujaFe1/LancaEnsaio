// supabase/functions/api/index.ts
// Edge Function "api" UNIFICADA (Irmãos e Irmãs)
// Sem autenticação complexa, identifica o lançador explicitamente.

type RegistroPayload = {
  nomeLancador?: string;
  tipo?: "IRMAOS" | "IRMAS";
  cidade?: string;
  categoria?: string;
  instrumento?: string;
  ministerio?: string;
  musicaCargo?: string;
};

const ORQUESTRA_SHEET_ID = Deno.env.get("ORQUESTRA_SHEET_ID") || "";
const GOOGLE_SERVICE_ACCOUNT_B64 = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_B64") || "";

const SHEET_CONFIG_RANGE = "'Base Geral'!A2:H500";
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
  return (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function limparArray(arr: string[] = []) {
  return Array.from(new Set(arr.map((v) => (v ?? "").toString().trim()).filter((v) => v && v !== "-")));
}

function safeString(v: any) {
  if (typeof v === "string" && v.trim()) return v.trim();
  return "-";
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
  const prefixo = buildMaleUserPrefix(nomeUsuario || "Anonimo");
  return `${prefixo}${random4()}`;
}

function auditarRegistro(dados: any) {
  const cat = dados.categoria && dados.categoria !== "-" ? dados.categoria : "";
  const inst = dados.instrumento && dados.instrumento !== "-" ? dados.instrumento : "";
  const min = dados.ministerio && dados.ministerio !== "-" ? dados.ministerio : "";
  const mus = dados.musicaCargo && dados.musicaCargo !== "-" ? dados.musicaCargo : "";
  const cid = dados.cidade && dados.cidade !== "-" ? dados.cidade : "";

  // IRMÃS - sem ministério, apenas música/cargo (Organista, Instrutora, Examinadora)
  if (dados.tipo === "IRMAS") {
    if (!cid) return { cargoFinal: "-", statusAuditoria: "ERRO 01: 🏙️ Falta Cidade" };
    // Se não selecionou cargo, é Cantora
    if (!mus) return { cargoFinal: "Cantora", statusAuditoria: "" };
    return { cargoFinal: mus, statusAuditoria: "" };
  }

  // IRMÃOS
  const isVazio = !cat && !inst && !min && !mus;

  // Se não selecionou nada (sem instrumento e sem cargo), é Cantor
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

Deno.serve(async (req: Request) => {
  try {
    mustEnv();

    if (req.method === "OPTIONS") {
      return json({ ok: true }, 200);
    }

    const url = new URL(req.url);
    const pathname = url.pathname;

    // Simplificação radical do roteamento para suportar múltiplos formatos de URL do Supabase
    let path = pathname.replace(/\/+$/g, "");
    if (path.includes("/functions/v1/api")) {
      path = path.split("/functions/v1/api")[1] || "/";
    } else if (path.includes("/functions/v1/")) {
      const parts = path.split("/");
      // Assume que a parte após /v1/ é o nome da function, e o que segue é o path da API
      path = "/" + parts.slice(4).join("/");
    }

    if (path.startsWith("/api")) {
      path = path.slice(4) || "/";
    }

    if (path === "" || path === "/") path = "/";

    // GET /health
    if (req.method === "GET" && (path === "/" || path === "/health")) {
      return json({ ok: true, service: "LançaEnsaio API Unificada", now: new Date().toISOString() });
    }

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

      // Metadado Unificado conforme solicitado: META APP=UNIFICADO TIPO={tipo} USER={nome}
      let metadado = `META APP=UNIFICADO TIPO=${tipo} USER=${nomeLancador}`;
      if (statusAuditoria) metadado = `${statusAuditoria} | ${metadado}`;

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
        statusAuditoria: metadado,
        comprovante: {
          id: idGerado,
          horario: new Date().toLocaleTimeString("pt-BR"),
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
      const body = (await req.json().catch(() => ({}))) as { id?: string; aviso?: string; nomeLancador?: string };
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

    return json({ erro: "Rota não encontrada", debug: { method: req.method, pathname, path } }, 404);
  } catch (err: any) {
    return json({ erro: "Erro interno", detalhe: String(err?.message || err) }, 500);
  }
});
