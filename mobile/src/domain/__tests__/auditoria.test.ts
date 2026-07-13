import {
  auditarRegistro,
  buildMaleUserPrefix,
  gerarIdRegistro,
  validarAntesDeEnviar,
} from '../auditoria';

describe('auditarRegistro — IRMAS', () => {
  it('exige cidade', () => {
    const r = auditarRegistro({ tipo: 'IRMAS' });
    expect(r.ok).toBe(false);
    expect(r.statusAuditoria).toContain('ERRO 01');
  });

  it('padrão Cantora sem cargo', () => {
    const r = auditarRegistro({ tipo: 'IRMAS', cidade: 'Ribeirão - Ipiranga' });
    expect(r).toEqual({ cargoFinal: 'Cantora', statusAuditoria: '', ok: true });
  });

  it('usa cargo musical selecionado', () => {
    const r = auditarRegistro({
      tipo: 'IRMAS',
      cidade: 'Ribeirão - Ipiranga',
      musicaCargo: 'Organista',
    });
    expect(r.cargoFinal).toBe('Organista');
    expect(r.ok).toBe(true);
  });
});

describe('auditarRegistro — IRMAOS', () => {
  it('padrão Cantor quando vazio com cidade', () => {
    const r = auditarRegistro({ tipo: 'IRMAOS', cidade: 'Sertãozinho' });
    expect(r).toEqual({ cargoFinal: 'Cantor', statusAuditoria: '', ok: true });
  });

  it('ERRO 02: instrumento sem categoria', () => {
    const r = auditarRegistro({
      tipo: 'IRMAOS',
      cidade: 'Sertãozinho',
      instrumento: 'Violão',
    });
    expect(r.ok).toBe(false);
    expect(r.statusAuditoria).toContain('ERRO 02');
  });

  it('ERRO 03: categoria sem instrumento', () => {
    const r = auditarRegistro({
      tipo: 'IRMAOS',
      cidade: 'Sertãozinho',
      categoria: 'Cordas',
    });
    expect(r.ok).toBe(false);
    expect(r.statusAuditoria).toContain('ERRO 03');
  });

  it('ERRO 05: conflito ministério + cargo', () => {
    const r = auditarRegistro({
      tipo: 'IRMAOS',
      cidade: 'Sertãozinho',
      categoria: 'Cordas',
      instrumento: 'Violão',
      ministerio: 'Louvor',
      musicaCargo: 'Regente',
    });
    expect(r.ok).toBe(false);
    expect(r.statusAuditoria).toContain('ERRO 05');
  });

  it('ERRO 11: ministério tocando (aviso, ok=false)', () => {
    const r = auditarRegistro({
      tipo: 'IRMAOS',
      cidade: 'Sertãozinho',
      categoria: 'Cordas',
      instrumento: 'Violão',
      ministerio: 'Louvor',
    });
    expect(r.ok).toBe(false);
    expect(r.statusAuditoria).toContain('ERRO 11');
  });

  it('aceita instrumento + categoria sem cargo', () => {
    const r = auditarRegistro({
      tipo: 'IRMAOS',
      cidade: 'Sertãozinho',
      categoria: 'Cordas',
      instrumento: 'Violão',
    });
    expect(r.ok).toBe(true);
    expect(r.cargoFinal).toBe('-');
  });
});

describe('ids e prefixos', () => {
  it('buildMaleUserPrefix usa 3 letras por palavra', () => {
    expect(buildMaleUserPrefix('Felipe Alirio')).toBe('MFELALI');
  });

  it('gerarIdRegistro IRMAS começa com F', () => {
    expect(gerarIdRegistro('IRMAS', 'Ana', () => '1234')).toBe('F1234');
  });

  it('gerarIdRegistro IRMAOS usa prefixo + random', () => {
    expect(gerarIdRegistro('IRMAOS', 'João Silva', () => '5678')).toBe('MJOASIL5678');
  });
});

describe('validarAntesDeEnviar', () => {
  it('bloqueia sem cidade', () => {
    expect(validarAntesDeEnviar({ tipo: 'IRMAOS' })).toMatch(/cidade/i);
  });

  it('permite cantor padrão', () => {
    expect(validarAntesDeEnviar({ tipo: 'IRMAOS', cidade: 'X' })).toBeNull();
  });
});
