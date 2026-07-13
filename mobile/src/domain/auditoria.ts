/**
 * Regras de auditoria do lançamento (espelhadas na Edge Function).
 * Mantém validação previsível no cliente e no servidor.
 */

export type TipoLancamento = 'IRMAOS' | 'IRMAS';

export type DadosAuditoria = {
  tipo: TipoLancamento;
  categoria?: string;
  instrumento?: string;
  cidade?: string;
  ministerio?: string;
  musicaCargo?: string;
};

export type ResultadoAuditoria = {
  cargoFinal: string;
  statusAuditoria: string;
  ok: boolean;
};

function nonempty(v?: string): string {
  const s = (v ?? '').trim();
  return !s || s === '-' ? '' : s;
}

/**
 * Aplica as regras de negócio usadas em produção ao gravar no Sheets.
 */
export function auditarRegistro(dados: DadosAuditoria): ResultadoAuditoria {
  const cat = nonempty(dados.categoria);
  const inst = nonempty(dados.instrumento);
  const min = nonempty(dados.ministerio);
  const mus = nonempty(dados.musicaCargo);
  const cid = nonempty(dados.cidade);

  if (dados.tipo === 'IRMAS') {
    if (!cid) {
      return { cargoFinal: '-', statusAuditoria: 'ERRO 01: Falta Cidade', ok: false };
    }
    if (!mus) {
      return { cargoFinal: 'Cantora', statusAuditoria: '', ok: true };
    }
    return { cargoFinal: mus, statusAuditoria: '', ok: true };
  }

  const isVazio = !cat && !inst && !min && !mus;

  if (isVazio) {
    if (cid) return { cargoFinal: 'Cantor', statusAuditoria: '', ok: true };
    return { cargoFinal: '-', statusAuditoria: 'ERRO 01: Falta Cidade', ok: false };
  }

  if (!cid) {
    return { cargoFinal: mus || '-', statusAuditoria: 'ERRO 01: Falta Cidade', ok: false };
  }
  if (inst && !cat) {
    return { cargoFinal: mus || '-', statusAuditoria: 'ERRO 02: Instr sem Cat', ok: false };
  }
  if (cat && !inst && !mus) {
    return { cargoFinal: mus || '-', statusAuditoria: 'ERRO 03: Cat sem Instr', ok: false };
  }
  if (mus && !inst && mus !== 'Cantor') {
    return { cargoFinal: mus || '-', statusAuditoria: 'ERRO 04: Cargo sem Instr', ok: false };
  }
  if (mus && min) {
    return { cargoFinal: mus || '-', statusAuditoria: 'ERRO 05: Conflito Cargos', ok: false };
  }

  const erros: string[] = [];
  if (min && inst) erros.push('ERRO 11: Min Tocando');

  return {
    cargoFinal: mus || '-',
    statusAuditoria: erros.length ? erros.join(' | ') : '',
    ok: erros.length === 0,
  };
}

export function stripAccents(str: string): string {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function buildMaleUserPrefix(nome: string): string {
  const palavras = stripAccents(nome || '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const partes = palavras.map((p) => p.slice(0, 3)).join('');
  return `M${partes || 'USR'}`;
}

export function gerarIdRegistro(
  tipo: TipoLancamento,
  nomeUsuario: string,
  random4: () => string = () => String(Math.floor(Math.random() * 9000 + 1000))
): string {
  if (tipo === 'IRMAS') return `F${random4()}`;
  const prefixo = buildMaleUserPrefix(nomeUsuario || 'Anonimo');
  return `${prefixo}${random4()}`;
}

/** Validação mínima antes do POST — evita round-trip óbvio. */
export function validarAntesDeEnviar(dados: DadosAuditoria): string | null {
  if (!nonempty(dados.cidade)) return 'Selecione a cidade.';
  if (!dados.tipo) return 'Selecione o modo (Irmãos ou Irmãs).';

  const resultado = auditarRegistro(dados);
  if (!resultado.ok && resultado.statusAuditoria.startsWith('ERRO 0')) {
    return resultado.statusAuditoria;
  }
  return null;
}
