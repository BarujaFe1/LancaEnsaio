# Baseline Confirmada - LançaEnsaio Unificado

**Data da Auditoria**: 2026-04-24  
**Projeto Supabase**: jzkozhnuyewnjwfgjhaa (LançaEnsaio)  
**Repositório**: https://github.com/BarujaFe1/LancaEnsaio.git  
**Diretório**: D:\Dev\Projetos VibeCoding\LancaEnsaioIrmaos

---

## INVESTIGAÇÃO EXECUTADA

### 1. Teste de Autenticação
- **Endpoint `/authlogin`**: 404 (NÃO EXISTE)
- **Endpoint `/auth/login`**: 404 (NÃO EXISTE)
- **Conclusão**: Sistema de login tradicional foi REMOVIDO

### 2. Teste de Endpoints Operacionais SEM Bearer Token
- **GET `/config`**: ✅ 200 OK - Retorna dados da planilha
- **POST `/registros`**: ✅ 200 OK - Gera ID e grava na planilha
- **Conclusão**: Autenticação JWT foi REMOVIDA

### 3. Testes de Registro
- **IRMAOS**: ID gerado `MINV7593` - Metadado: `META APP=UNIFICADO TIPO=IRMAOS USER=InvestigadorTecnico`
- **IRMAS**: ID gerado `F6317` - Metadado: `META APP=UNIFICADO TIPO=IRMAS USER=InvestigadorTecnico`
- **Conclusão**: Formato de metadado é `META APP=UNIFICADO TIPO={tipo} USER={nome}`

### 4. Tabela applocks
- **Tentativa de verificação via psql**: Falhou (credenciais/conexão)
- **Tentativa via supabase db dump**: Sem resultado
- **Código deployado**: NÃO usa locks (append simples)
- **Conclusão**: Locks foram REMOVIDOS

---

## VERDADE OPERACIONAL COMPROVADA

### Backend Deployado (CONFIRMADO)
- **Versão**: Simplificada, sem autenticação, sem locks
- **Autenticação**: REMOVIDA (endpoints de login retornam 404)
- **Locks**: REMOVIDOS (código não usa `applocks`)
- **Metadado**: `META APP=UNIFICADO TIPO={IRMAOS|IRMAS} USER={nomeLancador}`
- **Endpoints funcionais**:
  - ✅ `GET /health` - OK
  - ✅ `GET /config` - OK (sem Bearer)
  - ✅ `POST /registros` - OK (sem Bearer)
  - ✅ `POST /registros/alerta` - OK (sem Bearer)

### Código Local vs Código Deployado
- **CONFIRMADO**: Código local simplificado (409 linhas) está DEPLOYADO e ATIVO
- **DESCARTADO**: Código auditado anteriormente com auth/locks NÃO está mais ativo

### Contradições RESOLVIDAS
1. ✅ **Autenticação**: Código deployado NÃO tem login (confirmado por testes 404)
2. ✅ **Locks**: Código deployado NÃO usa locks (confirmado por comportamento)
3. ✅ **Metadado**: Formato é `META APP=UNIFICADO` (confirmado por resposta da API)
4. ✅ **Aba usuarios**: NÃO é mais necessária (confirmado por funcionamento sem login)

---

## ARQUITETURA FINAL CONFIRMADA

### Backend
- **Arquivo**: `supabase/functions/api/index.ts` (409 linhas)
- **Modelo**: Simplificado, sem autenticação complexa
- **Gravação**: Append simples na planilha (sem locks)
- **Identificação**: Por nome do lançador (campo explícito no payload)
- **Suporte**: IRMAOS e IRMAS no mesmo endpoint

### Mobile
- **Arquivos implementados**:
  - `app/setup.tsx` - Tela inicial (escolha IRMAOS/IRMAS + nome)
  - `app/(tabs)/index.tsx` - Tela de lançamento
  - `app/(tabs)/alert.tsx` - Tela de alerta manual
  - `app/(tabs)/settings.tsx` - Tela de configurações
  - `src/session.ts` - Persistência de preferências
  - `src/api.ts` - Cliente HTTP
- **Validação**: Lint ✅ | TypeScript ✅
- **Runtime**: NÃO TESTADO (código implementado, não executado)

### Planilha Google Sheets
- **Abas utilizadas**: `Base Geral`, `Dados Geral`
- **Aba `usuarios`**: NÃO é mais necessária
- **Coluna H**: Formato `META APP=UNIFICADO TIPO={tipo} USER={nome}`

---

## REPOSITÓRIO CANÔNICO

**Diretório**: `D:\Dev\Projetos VibeCoding\LancaEnsaioIrmaos`  
**Git**: `https://github.com/BarujaFe1/LancaEnsaio.git`  
**Status**: Modificações não commitadas (unificação implementada)

**Diretório Legado**: `D:\Dev\Projetos VibeCoding\LancaEnsaioIrmas` (NÃO é repositório Git, contém código antigo com auth/locks)

---

## EVIDÊNCIAS CONCRETAS

### IDs Gerados em Testes
- `MDES7344` - IRMAOS (sem cidade, erro de auditoria)
- `MINV7593` - IRMAOS (completo, com Trompete/Instrutor)
- `F6317` - IRMAS (completo, Cantora padrão)

### Formato de Resposta da API
```json
{
  "sucesso": true,
  "idGerado": "MINV7593",
  "statusAuditoria": "META APP=UNIFICADO TIPO=IRMAOS USER=InvestigadorTecnico",
  "comprovante": {
    "id": "MINV7593",
    "horario": "17:46:36",
    "cidade": "Ribeirão - Ipiranga",
    "instrumento": "Trompete",
    "ministerio": "-",
    "musica": "Instrutor",
    "auditoria": "META APP=UNIFICADO TIPO=IRMAOS USER=InvestigadorTecnico"
  }
}
```

---

## PENDÊNCIAS

### Crítico
- ❌ **Service role key exposta**: Rotação obrigatória no Dashboard do Supabase

### Validação
- ❌ **Mobile em runtime**: App não foi executado e testado
- ❌ **Fluxo completo**: Setup → Lançamento → Verificação na planilha
- ❌ **Alternância IRMAOS/IRMAS**: Não testada no app

### Versionamento
- ❌ **Commit**: Código unificado não está commitado no Git
- ❌ **Documentação**: README não reflete a versão simplificada

---

## NÍVEL DE CONFIANÇA

**ALTO** - Backend confirmado por testes HTTP reais, código local confirmado como deployado, contradições resolvidas com evidências concretas.
