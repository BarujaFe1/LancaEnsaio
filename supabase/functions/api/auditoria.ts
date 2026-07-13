// Espelho das regras em mobile/src/domain/auditoria.ts — manter sincronizado.

export type TipoLancamento = "IRMAOS" | "IRMAS";

export type DadosAuditoria = {
  tipo: TipoLancamento;
  categoria?: string;
  instrumento?: string;
  cidade?: string;
  ministerio?: string;
  musicaCargo?: string;
};

function nonempty(v?: string): string {
  const s = (v ?? "").trim();
  return !s || s === "-" ? "" : s;
}

export function auditarRegistro(dados: DadosAuditoria) {
  const cat = nonempty(dados.categoria);
  const inst = nonempty(dados.instrumento);
  const min = nonempty(dados.ministerio);
  const mus = nonempty(dados.musicaCargo);
  const cid = nonempty(dados.cidade);

  if (dados.tipo === "IRMAS") {
    if (!cid) return { cargoFinal: "-", statusAuditoria: "ERRO 01: 🏙️ Falta Cidade" };
    if (!mus) return { cargoFinal: "Cantora", statusAuditoria: "" };
    return { cargoFinal: mus, statusAuditoria: "" };
  }

  const isVazio = !cat && !inst && !min && !mus;

  if (isVazio) {
    if (cid) return { cargoFinal: "Cantor", statusAuditoria: "" };
    return { cargoFinal: "-", statusAuditoria: "ERRO 01: 🏙️ Falta Cidade" };
  }

  if (!cid) return { cargoFinal: mus || "-", statusAuditoria: "ERRO 01: 🏙️ Falta Cidade" };
  if (inst && !cat) return { cargoFinal: mus || "-", statusAuditoria: "ERRO 02: 🎻 Instr sem Cat" };
  if (cat && !inst && !mus) return { cargoFinal: mus || "-", statusAuditoria: "ERRO 03: 📂 Cat sem Instr" };
  if (mus && !inst && mus !== "Cantor") {
    return { cargoFinal: mus || "-", statusAuditoria: "ERRO 04: 🎼 Cargo sem Instr" };
  }
  if (mus && min) return { cargoFinal: mus || "-", statusAuditoria: "ERRO 05: 👔 Conflito Cargos" };

  const erros: string[] = [];
  if (min && inst) erros.push("ERRO 11: 👔 Min Tocando");

  return {
    cargoFinal: mus || "-",
    statusAuditoria: erros.length ? erros.join(" | ") : "",
  };
}

export function stripAccents(str: string) {
  return (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function buildMaleUserPrefix(nome: string) {
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

export function gerarIdRegistro(tipo: TipoLancamento, nomeUsuario: string) {
  if (tipo === "IRMAS") return `F${random4()}`;
  const prefixo = buildMaleUserPrefix(nomeUsuario || "Anonimo");
  return `${prefixo}${random4()}`;
}
