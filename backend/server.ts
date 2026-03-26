// backend/server.ts

import Fastify from 'fastify';
import crypto from 'crypto';
import * as SheetsService from './src/services/GoogleSheetsService';

const { readFromSheet, appendToSheet, updateSheetRange } = SheetsService as any;

// =======================================================
// CONFIG GERAL
// =======================================================
const PORT = 3000;
const HOST = '0.0.0.0';

const SHEET_CONFIG_RANGE = "'Base Geral'!A2:H1000";   // <- CONFIG (instrumentos/cidades/etc)
const SHEET_REGISTROS_RANGE = "'Dados Geral'!A:H";   // <- REGISTROS do app
const SHEET_USUARIOS_RANGE = "'usuarios'!A2:I500";   // <- CONTROLE DE USUÁRIOS

const USERS_CACHE_TTL_MS = 30_000;    // 30s
const CONFIG_CACHE_TTL_MS = 120_000;  // 2 min
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12h
const MAX_DEVICES_PER_USER = 3;

const app = Fastify({ logger: true });

// =======================================================
// TIPOS
// =======================================================
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
  exp: number;
};

type RegistroPayload = {
  tipo?: 'IRMAOS' | 'IRMAS';
  apontamento?: string;
  categoria?: string;
  instrumento?: string;
  cidade?: string;
  ministerio?: string;
  musicaCargo?: string;
};

// =======================================================
// CACHE / SESSÕES
// =======================================================
let usersCache: { data: UserRow[]; expiresAt: number } | null = null;
let configCache: { data: any; expiresAt: number } | null = null;

const sessions = new Map<string, SessionPayload>();

// limpeza periódica de sessão
setInterval(() => {
  const now = Date.now();
  for (const [token, sess] of sessions.entries()) {
    if (sess.exp <= now) sessions.delete(token);
  }
}, 60_000).unref();

// =======================================================
// HELPERS
// =======================================================
const asAny = (v: any) => v as any;

function stripAccents(str: string) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeKey(str: string) {
  return stripAccents((str || '').trim().toLowerCase());
}

function limparArray(arr: string[] = []) {
  return Array.from(
    new Set(
      arr
        .map((v) => (v ?? '').toString().trim())
        .filter((v) => v && v !== '-')
    )
  );
}

function safeString(v: any) {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return '-';
}

function isTrueCell(v: any) {
  const s = String(v ?? '')
    .trim()
    .toLowerCase();
  return ['true', 'verdadeiro', '1', 'sim', 'ativo'].includes(s);
}

function splitModulos(v: string) {
  return (v || '')
    .split(/[;,|]/g)
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean);
}

function splitDeviceIds(v: string) {
  return (v || '')
    .split(/[;,|]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function formatNowBR() {
  const d = new Date();
  return d.toLocaleString('pt-BR');
}

function buildMaleUserPrefix(nome: string) {
  const palavras = stripAccents(nome || '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const partes = palavras.map((p) => p.slice(0, 3)).join('');
  return `M${partes || 'USR'}`;
}

function random4() {
  return Math.floor(Math.random() * 9000 + 1000).toString();
}

function gerarIdRegistro(tipo: 'IRMAOS' | 'IRMAS', nomeUsuario: string) {
  if (tipo === 'IRMAS') {
    return `F${random4()}`;
  }
  const prefixo = buildMaleUserPrefix(nomeUsuario);
  return `${prefixo}${random4()}`;
}

// =======================================================
// LEITURA / USUÁRIOS (com cache)
// =======================================================
async function carregarUsuariosPlanilha(): Promise<UserRow[]> {
  const linhas = await readFromSheet(SHEET_USUARIOS_RANGE);

  const usuarios: UserRow[] = [];

  linhas.forEach((linha, idx) => {
    const rowNumber = idx + 2; // começa em A2
    const ativo = isTrueCell(linha[0]);
    const usuario = String(linha[1] ?? '').trim();
    const nome = String(linha[2] ?? '').trim();
    const senha = String(linha[3] ?? '').trim();
    const perfil = String(linha[4] ?? '').trim().toUpperCase();
    const modulos = splitModulos(String(linha[5] ?? ''));
    const deviceIds = splitDeviceIds(String(linha[6] ?? ''));
    const ultimoLogin = String(linha[7] ?? '').trim();
    const observacoes = String(linha[8] ?? '').trim();

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

async function carregarUsuariosCached() {
  const now = Date.now();
  if (usersCache && usersCache.expiresAt > now) {
    return usersCache.data;
  }

  const data = await carregarUsuariosPlanilha();
  usersCache = {
    data,
    expiresAt: now + USERS_CACHE_TTL_MS,
  };
  return data;
}

function invalidarUsersCache() {
  usersCache = null;
}

function invalidarConfigCache() {
  configCache = null;
}

async function atualizarMetaUsuario(rowNumber: number, deviceIds: string[]) {
  const range = `'usuarios'!G${rowNumber}:H${rowNumber}`;
  const values = [[deviceIds.join(' | '), formatNowBR()]];
  await updateSheetRange(range, values);
  invalidarUsersCache();
}

// =======================================================
// AUTENTICAÇÃO (sessão simples em memória)
// =======================================================
function gerarToken() {
  return crypto.randomBytes(24).toString('hex');
}

function parseBearerToken(authHeader?: string) {
  if (!authHeader) return '';
  const [scheme, token] = authHeader.split(' ');
  if (!scheme || !token) return '';
  if (scheme.toLowerCase() !== 'bearer') return '';
  return token.trim();
}

app.addHook('preHandler', async (request, reply) => {
  const url = request.url;

  // rotas públicas
  if (
    url === '/' ||
    url.startsWith('/auth/login')
  ) {
    return;
  }

  const token = parseBearerToken(request.headers.authorization);
  if (!token) {
    return reply.status(401).send({ erro: 'Sessão inválida' });
  }

  const sess = sessions.get(token);
  if (!sess || sess.exp < Date.now()) {
    if (sess) sessions.delete(token);
    return reply.status(401).send({ erro: 'Sessão inválida' });
  }

  asAny(request).userSession = sess;
});

// =======================================================
// AUDITORIA (regras)
// =======================================================
function auditarRegistro(dados: any) {
  const cat = dados.categoria && dados.categoria !== '-' ? dados.categoria : '';
  const inst = dados.instrumento && dados.instrumento !== '-' ? dados.instrumento : '';
  const min = dados.ministerio && dados.ministerio !== '-' ? dados.ministerio : '';
  const mus = dados.musicaCargo && dados.musicaCargo !== '-' ? dados.musicaCargo : '';
  const cid = dados.cidade && dados.cidade !== '-' ? dados.cidade : '';

  // IRMÃS
  if (dados.tipo === 'IRMAS') {
    if (!cid) return { cargoFinal: '-', statusAuditoria: 'ERRO 01: 🏙️ Falta Cidade' };
    if (!mus) return { cargoFinal: 'Cantora', statusAuditoria: '' };
    return { cargoFinal: mus, statusAuditoria: '' };
  }

  // IRMÃOS
  const isVazio = !cat && !inst && !min && !mus;

  // regra default (irmão presente sem instrumento / sem cargo)
  if (isVazio) {
    if (cid) return { cargoFinal: 'Cantor', statusAuditoria: '' };
    return { cargoFinal: '-', statusAuditoria: 'ERRO 01: 🏙️ Falta Cidade' };
  }

  if (!cid) return { cargoFinal: mus || '-', statusAuditoria: 'ERRO 01: 🏙️ Falta Cidade' };
  if (inst && !cat) return { cargoFinal: mus || '-', statusAuditoria: 'ERRO 02: 🎻 Instr sem Categoria' };
  if (cat && !inst) return { cargoFinal: mus || '-', statusAuditoria: 'ERRO 03: 📂 Cat sem Instr' };
  if (mus && !inst && mus !== 'Cantor') return { cargoFinal: mus || '-', statusAuditoria: 'ERRO 04: 🎼 Cargo sem Instr' };
  if (mus && min) return { cargoFinal: mus || '-', statusAuditoria: 'ERRO 05: 👔 Conflito Cargos' };

  const erros: string[] = [];
  if (min && inst) erros.push('ERRO 11: 👔 Min Tocando');

  return {
    cargoFinal: mus || '-',
    statusAuditoria: erros.length ? erros.join(' | ') : '',
  };
}

// =======================================================
// ROTAS
// =======================================================
app.get('/', async () => {
  return {
    ok: true,
    service: 'App Orquestra Backend',
    now: new Date().toISOString(),
  };
});

app.post('/auth/login', async (request, reply) => {
  try {
    const body = (request.body || {}) as {
      usuario?: string;
      senha?: string;
      deviceId?: string;
    };

    const usuarioInput = String(body.usuario ?? '').trim();
    const senhaInput = String(body.senha ?? '').trim();
    const deviceIdInput = String(body.deviceId ?? '').trim();

    if (!usuarioInput || !senhaInput) {
      return reply.status(400).send({ erro: 'Usuário e senha são obrigatórios' });
    }

    const usuarios = await carregarUsuariosCached();

    const user = usuarios.find(
      (u) => normalizeKey(u.usuario) === normalizeKey(usuarioInput)
    );

    if (!user) {
      return reply.status(401).send({ erro: 'Usuário ou senha inválidos' });
    }

    if (!user.ativo) {
      return reply.status(403).send({ erro: 'Usuário inativo' });
    }

    if (user.senha !== senhaInput) {
      return reply.status(401).send({ erro: 'Usuário ou senha inválidos' });
    }

    let aviso = '';

    const novosDeviceIds = [...user.deviceIds];

    if (deviceIdInput && !novosDeviceIds.includes(deviceIdInput)) {
      if (novosDeviceIds.length >= MAX_DEVICES_PER_USER) {
        return reply.status(403).send({
          erro: `Limite de ${MAX_DEVICES_PER_USER} dispositivos atingido para este usuário`,
        });
      }
      novosDeviceIds.push(deviceIdInput);

      aviso =
        novosDeviceIds.length > 1
          ? `Atenção: este usuário está sendo usado em outro celular (${novosDeviceIds.length}/${MAX_DEVICES_PER_USER}).`
          : '';
    }

    const token = gerarToken();
    const sessao: SessionPayload = {
      token,
      usuario: user.usuario,
      nome: user.nome || user.usuario,
      perfil: user.perfil || 'APONTADOR_IRMAOS',
      modulos: user.modulos.length ? user.modulos : ['IRMAOS'],
      exp: Date.now() + SESSION_TTL_MS,
    };

    sessions.set(token, sessao);

    // Atualiza planilha SEM travar a resposta (mais rápido)
    void atualizarMetaUsuario(user.rowNumber, novosDeviceIds).catch((err) => {
      app.log.error({ err }, 'Falha ao atualizar meta do usuário');
    });

    return reply.send({
      sucesso: true,
      token,
      aviso,
      usuario: {
        usuario: sessao.usuario,
        nome: sessao.nome,
        perfil: sessao.perfil,
        modulos: sessao.modulos,
      },
    });
  } catch (err) {
    app.log.error({ err }, 'Erro no /auth/login');
    return reply.status(500).send({ erro: 'Falha no login' });
  }
});

app.post('/auth/logout', async (request, reply) => {
  const token = parseBearerToken(request.headers.authorization);
  if (token) sessions.delete(token);
  return reply.send({ sucesso: true });
});

app.get('/config', async (request, reply) => {
  try {
    const sess = asAny(request).userSession as SessionPayload | undefined;
    if (!sess) {
      return reply.status(401).send({ erro: 'Sessão inválida' });
    }

    if (!sess.modulos.includes('IRMAOS')) {
      return reply.status(403).send({ erro: 'Usuário sem permissão para módulo IRMÃOS' });
    }

    const now = Date.now();
    if (configCache && configCache.expiresAt > now) {
      return reply.send({
        ...configCache.data,
        usuario: {
          nome: sess.nome,
          perfil: sess.perfil,
          modulos: sess.modulos,
        },
      });
    }

    // Lê a aba correta (BASE GERAL)
    const linhas = await readFromSheet(SHEET_CONFIG_RANGE);

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
      cordas.push(String(linha[0] ?? '').trim());
      metais.push(String(linha[1] ?? '').trim());
      madeiras.push(String(linha[2] ?? '').trim());
      teclas.push(String(linha[3] ?? '').trim());
      cidadesSemAcento.push(String(linha[4] ?? '').trim());
      ministerios.push(String(linha[5] ?? '').trim());
      cargosMusicais.push(String(linha[6] ?? '').trim());
      cidadesComAcento.push(String(linha[7] ?? '').trim());
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

    configCache = {
      data: payloadConfig,
      expiresAt: Date.now() + CONFIG_CACHE_TTL_MS,
    };

    return reply.send({
      ...payloadConfig,
      usuario: {
        nome: sess.nome,
        perfil: sess.perfil,
        modulos: sess.modulos,
      },
    });
  } catch (err: any) {
    // LOGA O ERRO REAL (isso aqui é ouro pra depurar)
    app.log.error({ err }, 'Falha em /config');
    return reply.status(500).send({
      erro: 'Falha ao carregar o Cérebro',
      detalhe: process.env.NODE_ENV !== 'production' ? String(err?.message || err) : undefined,
    });
  }
});

app.post('/registros', async (request, reply) => {
  try {
    const sess = asAny(request).userSession as SessionPayload | undefined;
    if (!sess) {
      return reply.status(401).send({ erro: 'Sessão inválida' });
    }

    const dados = (request.body || {}) as RegistroPayload;
    const tipo = (dados.tipo || 'IRMAOS') as 'IRMAOS' | 'IRMAS';

    if (tipo === 'IRMAOS' && !sess.modulos.includes('IRMAOS')) {
      return reply.status(403).send({ erro: 'Usuário sem permissão para módulo IRMÃOS' });
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

    const linha = [
      dados.apontamento || sess.nome || 'App Mobile', // A
      idGerado,                                       // B
      dadosParaAuditoria.categoria,                   // C
      dadosParaAuditoria.instrumento,                 // D
      dadosParaAuditoria.cidade,                      // E
      dadosParaAuditoria.ministerio,                  // F
      cargoFinal,                                     // G
      statusAuditoria || '',                          // H
    ];

    await appendToSheet(SHEET_REGISTROS_RANGE, [linha]);

    return reply.send({
      sucesso: true,
      idGerado,
      statusAuditoria,
      comprovante: {
        id: idGerado,
        horario: new Date().toLocaleTimeString('pt-BR'),
        cidade: dadosParaAuditoria.cidade,
        instrumento: dadosParaAuditoria.instrumento,
        ministerio: dadosParaAuditoria.ministerio,
        musica: cargoFinal,
        auditoria: statusAuditoria || '',
      },
    });
  } catch (err) {
    app.log.error({ err }, 'Erro no /registros');
    return reply.status(500).send({ erro: 'Falha ao salvar registro' });
  }
});

// =======================================================
// START
// =======================================================
const start = async () => {
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log('🚀 Servidor rodando na rede local em http://SEU-IP-LOCAL:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
