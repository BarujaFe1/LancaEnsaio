import crypto from 'crypto';
import Fastify, { FastifyInstance } from 'fastify';
import { config } from './config';
import type { SheetClient } from './services/GoogleSheetsService';
import { GoogleSheetsService } from './services/GoogleSheetsService';
import { formatTimestampBR } from './utils/time';

type UserRow = {
  rowNumber: number;
  ativo: boolean;
  usuario: string;
  nome: string;
  senha: string; // suporta texto puro ou "sha256:<hash>"
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
  deviceId?: string;
  exp: number;
};

type RegistroPayload = {
  tipo?: 'IRMAOS' | 'IRMAS';
  apontamento?: string; // agora recebe timestamp (HH:mm - dd/MM/yyyy)
  categoria?: string;
  instrumento?: string;
  cidade?: string;
  ministerio?: string;
  musicaCargo?: string;
};

type BuildOptions = {
  sheetClient?: SheetClient;
  logger?: boolean;
};

declare module 'fastify' {
  interface FastifyRequest {
    userSession?: SessionPayload;
  }
}

function stripAccents(str: string) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeKey(str: string) {
  return stripAccents((str || '').trim().toLowerCase());
}

function limparArray(arr: string[] = []) {
  return Array.from(
    new Set(arr.map((v) => (v ?? '').toString().trim()).filter((v) => v && v !== '-'))
  );
}

function safeString(v: unknown) {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return '-';
}

function isTrueCell(v: unknown) {
  const s = String(v ?? '').trim().toLowerCase();
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

function formatCategoriaLabel(cat: string) {
  const lower = (cat || '').toLowerCase().trim();
  if (!lower) return '';
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function sha256(text: string) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function passwordMatches(stored: string, plainInput: string) {
  const raw = (stored || '').trim();

  if (raw.startsWith('sha256:')) {
    const expected = raw.slice('sha256:'.length);
    const received = sha256(plainInput);
    const a = Buffer.from(expected);
    const b = Buffer.from(received);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  // compatibilidade com planilha antiga (texto puro)
  return raw === plainInput;
}

function random4() {
  return Math.floor(Math.random() * 9000 + 1000).toString();
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

function gerarIdRegistro(tipo: 'IRMAOS' | 'IRMAS', nomeUsuario: string) {
  if (tipo === 'IRMAS') return `F${random4()}`;
  return `${buildMaleUserPrefix(nomeUsuario)}${random4()}`;
}

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

function auditarRegistro(dados: any) {
  const cat = dados.categoria && dados.categoria !== '-' ? dados.categoria : '';
  const inst = dados.instrumento && dados.instrumento !== '-' ? dados.instrumento : '';
  const min = dados.ministerio && dados.ministerio !== '-' ? dados.ministerio : '';
  const mus = dados.musicaCargo && dados.musicaCargo !== '-' ? dados.musicaCargo : '';
  const cid = dados.cidade && dados.cidade !== '-' ? dados.cidade : '';

  if (dados.tipo === 'IRMAS') {
    if (!cid) return { cargoFinal: '-', statusAuditoria: 'ERRO 01: Falta Cidade' };
    if (!mus) return { cargoFinal: 'Cantora', statusAuditoria: '' };
    return { cargoFinal: mus, statusAuditoria: '' };
  }

  const isVazio = !cat && !inst && !min && !mus;
  if (isVazio) {
    if (cid) return { cargoFinal: 'Cantor', statusAuditoria: '' };
    return { cargoFinal: '-', statusAuditoria: 'ERRO 01: Falta Cidade' };
  }

  if (!cid) return { cargoFinal: mus || '-', statusAuditoria: 'ERRO 01: Falta Cidade' };
  if (inst && !cat) return { cargoFinal: mus || '-', statusAuditoria: 'ERRO 02: Instrumento sem Categoria' };
  if (cat && !inst) return { cargoFinal: mus || '-', statusAuditoria: 'ERRO 03: Categoria sem Instrumento' };
  if (mus && !inst && mus !== 'Cantor') return { cargoFinal: mus || '-', statusAuditoria: 'ERRO 04: Cargo musical sem Instrumento' };
  if (mus && min) return { cargoFinal: mus || '-', statusAuditoria: 'ERRO 05: Conflito de cargos' };

  const erros: string[] = [];
  if (min && inst) erros.push('ERRO 11: Ministério e Instrumento ao mesmo tempo');

  return {
    cargoFinal: mus || '-',
    statusAuditoria: erros.length ? erros.join(' | ') : ''
  };
}

function buildRanges() {
  const usuariosRange = `'${config.sheetUsuariosTab}'!A2:I500`;
  const baseGeralRange = `'${config.sheetBaseGeralTab}'!A2:H1000`;
  const dadosGeralAppendRange = `'${config.sheetDadosGeralTab}'!A:J`;
  const dadosGeralReadRange = `'${config.sheetDadosGeralTab}'!A2:J20000`;
  return { usuariosRange, baseGeralRange, dadosGeralAppendRange, dadosGeralReadRange };
}

export function buildApp(options: BuildOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? true });
  const sheet = options.sheetClient || new GoogleSheetsService();

  const sessions = new Map<string, SessionPayload>();
  const loginFailures = new Map<string, { count: number; blockedUntil?: number }>();

  let usersCache: { data: UserRow[]; expiresAt: number } | null = null;
  let configCache: { data: any; expiresAt: number } | null = null;

  const { usuariosRange, baseGeralRange, dadosGeralAppendRange, dadosGeralReadRange } = buildRanges();

  setInterval(() => {
    const now = Date.now();
    for (const [token, sess] of sessions.entries()) {
      if (sess.exp <= now) sessions.delete(token);
    }
  }, 60_000).unref();

  function invalidarUsersCache() {
    usersCache = null;
  }

  function invalidarConfigCache() {
    configCache = null;
  }

  async function carregarUsuariosPlanilha(): Promise<UserRow[]> {
    const linhas = await sheet.read(usuariosRange);
    const usuarios: UserRow[] = [];

    linhas.forEach((linha, idx) => {
      const rowNumber = idx + 2;
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
        observacoes
      });
    });

    return usuarios;
  }

  async function carregarUsuariosCached() {
    const now = Date.now();
    if (usersCache && usersCache.expiresAt > now) return usersCache.data;

    const data = await carregarUsuariosPlanilha();
    usersCache = { data, expiresAt: now + config.usersCacheTtlMs };
    return data;
  }

  async function atualizarMetaUsuario(rowNumber: number, deviceIds: string[]) {
    const range = `'${config.sheetUsuariosTab}'!G${rowNumber}:H${rowNumber}`;
    const values = [[deviceIds.join(' | '), formatTimestampBR()]];
    await sheet.update(range, values);
    invalidarUsersCache();
  }

  function registerLoginFailure(key: string) {
    const prev = loginFailures.get(key) || { count: 0 };
    const count = prev.count + 1;
    const payload = { count } as { count: number; blockedUntil?: number };

    if (count >= config.loginMaxAttempts) {
      payload.blockedUntil = Date.now() + config.loginBlockMinutes * 60 * 1000;
      payload.count = 0; // reseta após bloquear
    }

    loginFailures.set(key, payload);
  }

  function clearLoginFailure(key: string) {
    loginFailures.delete(key);
  }

  function isBlockedLogin(key: string) {
    const data = loginFailures.get(key);
    if (!data?.blockedUntil) return false;

    if (data.blockedUntil <= Date.now()) {
      loginFailures.delete(key);
      return false;
    }
    return true;
  }

  app.addHook('preHandler', async (request, reply) => {
    const url = request.url;

    if (
      url === '/' ||
      url.startsWith('/health') ||
      url.startsWith('/auth/login')
    ) {
      return;
    }

    const token = parseBearerToken(request.headers.authorization);
    if (!token) {
      return reply.status(401).send({ erro: 'Sessão expirada. Faça login novamente.' });
    }

    const sess = sessions.get(token);
    if (!sess || sess.exp < Date.now()) {
      if (sess) sessions.delete(token);
      return reply.status(401).send({ erro: 'Sessão expirada. Faça login novamente.' });
    }

    request.userSession = sess;
  });

  app.get('/', async () => {
    return {
      ok: true,
      service: 'Ensaio Regional Backend',
      now: new Date().toISOString()
    };
  });

  app.get('/health', async () => ({ ok: true }));

  app.post('/auth/login', async (request, reply) => {
    try {
      const body = (request.body || {}) as { usuario?: string; senha?: string; deviceId?: string };
      const usuarioInput = String(body.usuario ?? '').trim();
      const senhaInput = String(body.senha ?? '').trim();
      const deviceIdInput = String(body.deviceId ?? '').trim();

      if (!usuarioInput || !senhaInput) {
        return reply.status(400).send({ erro: 'Informe usuário e senha.' });
      }

      const throttleKey = normalizeKey(usuarioInput);
      if (isBlockedLogin(throttleKey)) {
        return reply.status(429).send({
          erro: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.'
        });
      }

      const usuarios = await carregarUsuariosCached();
      const user = usuarios.find((u) => normalizeKey(u.usuario) === normalizeKey(usuarioInput));

      if (!user) {
        registerLoginFailure(throttleKey);
        return reply.status(401).send({ erro: 'Usuário ou senha inválidos.' });
      }

      if (!user.ativo) {
        return reply.status(403).send({ erro: 'Usuário inativo. Procure o administrador.' });
      }

      if (!passwordMatches(user.senha, senhaInput)) {
        registerLoginFailure(throttleKey);
        return reply.status(401).send({ erro: 'Usuário ou senha inválidos.' });
      }

      clearLoginFailure(throttleKey);

      const novosDeviceIds = [...user.deviceIds];
      let aviso = '';

      if (deviceIdInput && !novosDeviceIds.includes(deviceIdInput)) {
        if (novosDeviceIds.length >= config.maxDevicesPerUser) {
          return reply.status(403).send({
            erro: `Limite de ${config.maxDevicesPerUser} dispositivos atingido.`
          });
        }
        novosDeviceIds.push(deviceIdInput);
        if (novosDeviceIds.length > 1) {
          aviso = `Este usuário está em mais de um aparelho (${novosDeviceIds.length}/${config.maxDevicesPerUser}).`;
        }
      }

      const token = gerarToken();
      const exp = Date.now() + config.sessionTtlHours * 60 * 60 * 1000;

      const sessao: SessionPayload = {
        token,
        usuario: user.usuario,
        nome: user.nome || user.usuario,
        perfil: user.perfil || 'APONTADOR_IRMAOS',
        modulos: user.modulos.length ? user.modulos : ['IRMAOS'],
        deviceId: deviceIdInput || undefined,
        exp
      };

      sessions.set(token, sessao);

      void atualizarMetaUsuario(user.rowNumber, novosDeviceIds).catch((err) => {
        app.log.error({ err }, 'Falha ao atualizar meta do usuário');
      });

      return reply.send({
        sucesso: true,
        token,
        exp,
        aviso,
        usuario: {
          usuario: sessao.usuario,
          nome: sessao.nome,
          perfil: sessao.perfil,
          modulos: sessao.modulos
        }
      });
    } catch (err) {
      app.log.error({ err }, 'Erro no /auth/login');
      return reply.status(500).send({ erro: 'Não foi possível entrar agora. Tente novamente.' });
    }
  });

  app.post('/auth/refresh', async (request, reply) => {
    const token = parseBearerToken(request.headers.authorization);
    if (!token) {
      return reply.status(401).send({ erro: 'Sessão expirada. Faça login novamente.' });
    }

    const sess = sessions.get(token);
    if (!sess || sess.exp < Date.now()) {
      if (sess) sessions.delete(token);
      return reply.status(401).send({ erro: 'Sessão expirada. Faça login novamente.' });
    }

    const newToken = gerarToken();
    const exp = Date.now() + config.sessionTtlHours * 60 * 60 * 1000;
    const updated: SessionPayload = { ...sess, token: newToken, exp };

    sessions.delete(token);
    sessions.set(newToken, updated);

    return reply.send({
      sucesso: true,
      token: newToken,
      exp,
      usuario: {
        usuario: updated.usuario,
        nome: updated.nome,
        perfil: updated.perfil,
        modulos: updated.modulos
      }
    });
  });

  app.post('/auth/logout', async (request, reply) => {
    const token = parseBearerToken(request.headers.authorization);
    if (token) sessions.delete(token);
    return reply.send({ sucesso: true });
  });

  app.get('/config', async (request, reply) => {
    try {
      const sess = request.userSession!;
      if (!sess.modulos.includes('IRMAOS')) {
        return reply.status(403).send({ erro: 'Seu usuário não tem acesso a este módulo.' });
      }

      const now = Date.now();
      if (configCache && configCache.expiresAt > now) {
        return reply.send({
          ...configCache.data,
          usuario: {
            nome: sess.nome,
            perfil: sess.perfil,
            modulos: sess.modulos
          }
        });
      }

      const linhas = await sheet.read(baseGeralRange);

      const cordas: string[] = [];
      const metais: string[] = [];
      const madeiras: string[] = [];
      const teclas: string[] = [];
      const cidadesSemAcento: string[] = [];
      const ministerios: string[] = [];
      const cargosMusicais: string[] = [];
      const cidadesComAcento: string[] = [];

      for (const linha of linhas) {
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
          Teclas: limparArray(teclas)
        },
        cidadesSemAcento: limparArray(cidadesSemAcento),
        cidades: limparArray(cidadesComAcento.length ? cidadesComAcento : cidadesSemAcento),
        ministerios: limparArray(ministerios),
        cargosMusicais: limparArray(cargosMusicais)
      };

      configCache = { data: payloadConfig, expiresAt: now + config.configCacheTtlMs };

      return reply.send({
        ...payloadConfig,
        usuario: {
          nome: sess.nome,
          perfil: sess.perfil,
          modulos: sess.modulos
        }
      });
    } catch (err) {
      app.log.error({ err }, 'Falha em /config');
      return reply.status(500).send({
        erro: 'Não foi possível carregar os dados agora. Verifique a conexão e tente novamente.'
      });
    }
  });

  app.post('/registros', async (request, reply) => {
    try {
      const sess = request.userSession!;
      const dados = (request.body || {}) as RegistroPayload;
      const tipo = (dados.tipo || 'IRMAOS') as 'IRMAOS' | 'IRMAS';

      if (tipo === 'IRMAOS' && !sess.modulos.includes('IRMAOS')) {
        return reply.status(403).send({ erro: 'Seu usuário não tem acesso a este módulo.' });
      }

      const idGerado = gerarIdRegistro(tipo, sess.nome);

      const dadosParaAuditoria = {
        tipo,
        categoria: safeString(dados.categoria),
        instrumento: safeString(dados.instrumento),
        cidade: safeString(dados.cidade),
        ministerio: safeString(dados.ministerio),
        musicaCargo: safeString(dados.musicaCargo)
      };

      const { cargoFinal, statusAuditoria } = auditarRegistro(dadosParaAuditoria);

      // Campo A passa a ser timestamp amigável (ex: 14:08 - 25/02/2026)
      const apontamentoTimestamp = (dados.apontamento || '').trim() || formatTimestampBR();

      // Colunas: A..J
      // A timestamp | B id | C categoria | D instrumento | E cidade | F ministerio | G cargoFinal | H auditoria | I alerta_ts | J userId
      const linha = [
        apontamentoTimestamp,
        idGerado,
        dadosParaAuditoria.categoria,
        dadosParaAuditoria.instrumento,
        dadosParaAuditoria.cidade,
        dadosParaAuditoria.ministerio,
        cargoFinal,
        statusAuditoria || '',
        '',
        sess.usuario
      ];

      await sheet.append(dadosGeralAppendRange, [linha]);
      invalidarConfigCache();

      return reply.send({
        sucesso: true,
        idGerado,
        statusAuditoria,
        comprovante: {
          id: idGerado,
          horario: apontamentoTimestamp,
          cidade: dadosParaAuditoria.cidade,
          instrumento: dadosParaAuditoria.instrumento,
          ministerio: dadosParaAuditoria.ministerio,
          musica: cargoFinal,
          auditoria: statusAuditoria || '',
          userId: sess.usuario
        }
      });
    } catch (err) {
      app.log.error({ err }, 'Erro no /registros');
      return reply.status(500).send({
        erro: 'Erro ao salvar. Verifique a conexão e tente novamente.'
      });
    }
  });

  app.post('/alertas/manual', async (request, reply) => {
    try {
      const sess = request.userSession!;
      const linhas = await sheet.read(dadosGeralReadRange);

      if (!linhas.length) {
        return reply.status(404).send({ erro: 'Nenhum lançamento encontrado para correção.' });
      }

      // Encontrar última linha realmente preenchida
      let lastIndex = -1;
      for (let i = linhas.length - 1; i >= 0; i--) {
        const row = linhas[i] || [];
        const hasSomeData = row.some((c) => String(c ?? '').trim() !== '');
        if (hasSomeData) {
          lastIndex = i;
          break;
        }
      }

      if (lastIndex < 0) {
        return reply.status(404).send({ erro: 'Nenhum lançamento encontrado para correção.' });
      }

      const row = linhas[lastIndex];
      const rowNumber = lastIndex + 2; // começa em A2
      const colB_id = String(row[1] ?? '').trim();
      const colH_status = String(row[7] ?? '').trim();
      const colJ_userId = String(row[9] ?? '').trim();

      if (!colJ_userId) {
        return reply.status(409).send({
          erro: 'Este lançamento não possui identificação do usuário. Procure o administrador.'
        });
      }

      if (colJ_userId !== sess.usuario) {
        return reply.status(403).send({
          erro: 'Você só pode solicitar correção do seu último lançamento.'
        });
      }

      if (colH_status === 'ALERTA_MANUAL') {
        return reply.status(409).send({
          erro: 'A correção deste lançamento já foi solicitada.'
        });
      }

      const tsAlerta = formatTimestampBR();

      // H = ALERTA_MANUAL, I = timestamp alerta, J = userId (reforça)
      const range = `'${config.sheetDadosGeralTab}'!H${rowNumber}:J${rowNumber}`;
      await sheet.update(range, [['ALERTA_MANUAL', tsAlerta, sess.usuario]]);

      return reply.send({
        sucesso: true,
        mensagem: 'Pedido de correção enviado. Aguarde o administrador apagar a linha.',
        rowNumber,
        idRegistro: colB_id,
        alertaEm: tsAlerta
      });
    } catch (err) {
      app.log.error({ err }, 'Erro em /alertas/manual');
      return reply.status(500).send({
        erro: 'Não foi possível solicitar correção agora. Tente novamente.'
      });
    }
  });

  return app;
}
