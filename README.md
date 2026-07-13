<div align="center">
  <img src="./icon.png" alt="LançaEnsaio" width="120" height="120" />

  <h1>LançaEnsaio</h1>
  <p><strong>Registro rápido e auditável de ensaios de orquestra — do celular à planilha, sem planilha aberta na mão.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg?logo=react&logoColor=white" alt="React Native" />
    <img src="https://img.shields.io/badge/Expo-54-000020.svg?logo=expo&logoColor=white" alt="Expo" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Supabase-Edge%20Functions-3ECF8E.svg?logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Google%20Sheets-API%20v4-34A853.svg?logo=googlesheets&logoColor=white" alt="Sheets" />
    <img src="https://img.shields.io/badge/CI-GitHub%20Actions-2088FF.svg?logo=githubactions&logoColor=white" alt="CI" />
  </p>

  <p>
    <a href="https://lancaensaio.vercel.app"><strong>🌐 Web Demo</strong></a> ·
    <a href="https://github.com/BarujaFe1/LancaEnsaio/releases/latest"><strong>⬇️ APK</strong></a> ·
    <a href="https://barujafe.vercel.app/"><strong>Portfólio</strong></a> ·
    <a href="./docs/ARCHITECTURE.md"><strong>Arquitetura</strong></a>
  </p>
</div>

---

## Screenshot / placeholder

> Substitua pelos arquivos em `docs/screenshots/` quando disponíveis.

```text
┌─────────────────────────────┐
│  LançaEnsaio                │
│  Setup → Lançar → Recibo    │
│  [Irmãos] [Irmãs]           │
│  Cidade · Instrumento       │
│  [ Lançar Agora ]           │
│  ID + auditoria automática  │
└─────────────────────────────┘
```

Demo ao vivo: **https://lancaensaio.vercel.app**

---

## Problema real

Em ensaios regionais, o registro de presença/função costuma viver em papel ou planilha editada no celular. Isso gera:

- preenchimento inconsistente (cidade, categoria, instrumento, cargo);
- pouca rastreabilidade de quem lançou;
- correções manuais sem histórico;
- atrito alto no momento do ensaio.

## Solução

App mobile (Expo) com fluxo guiado de **menos de um minuto**: identificar o lançador, escolher modo Irmãos/Irmãs, preencher campos contextuais e gravar com **ID + auditoria automática** em Google Sheets via Supabase Edge Function. Correções posteriores viram **alerta** anexado ao mesmo registro.

---

## Principais funcionalidades

- Setup inicial (nome + modo) com persistência local
- Fluxos distintos **Irmãos** / **Irmãs**
- Catálogo dinâmico (cidades, instrumentos, ministérios, cargos) via API
- Regras de auditoria (Cantor/Cantora padrão, erros 01–05/11)
- Comprovante do último lançamento + alerta de correção
- Trava de cidade para sequência no mesmo local
- Draft local do formulário
- Banner de **demo** e de **offline**
- Web demo sem backend (modo mock) para recrutadores

---

## Arquitetura

```text
App Expo (Android/Web)
    │  axios  ou  demo local
    ▼
Supabase Edge Function `api`
    │  service account
    ▼
Google Sheets (Base Geral / Dados Geral)
```

Detalhes: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Mobile / Web | Expo 54, React Native, Expo Router, TypeScript |
| HTTP | Axios |
| Local | AsyncStorage, NetInfo |
| Backend | Supabase Edge Functions (Deno) |
| Dados | Google Sheets API v4 |
| Qualidade | ESLint, `tsc`, Jest, GitHub Actions |
| Deploy | EAS (APK), Vercel (web demo) |

---

## Demo local

### Web demo (sem secrets)

```bash
git clone https://github.com/BarujaFe1/LancaEnsaio.git
cd LancaEnsaio/mobile
npm ci
npm run web
```

Sem `EXPO_PUBLIC_API_URL`, o app entra em **modo demonstração**.

### App com API real

```bash
cd mobile
cp .env.example .env
# edite EXPO_PUBLIC_API_URL
npm ci
npm start
```

### Comandos úteis

```bash
npm run lint
npm run typecheck
npm test
npm run ci
npm run export:web
```

---

## Variáveis de ambiente

Ver `mobile/.env.example` e [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

| Variável | Onde | Uso |
|----------|------|-----|
| `EXPO_PUBLIC_API_URL` | App / EAS | Base da Edge Function |
| `EXPO_PUBLIC_DEMO` | App (opcional) | Força modo demo |
| `ORQUESTRA_SHEET_ID` | Supabase secret | Planilha |
| `GOOGLE_SERVICE_ACCOUNT_B64` | Supabase secret | Credencial Sheets |

---

## Testes

```bash
cd mobile && npm test
```

Cobertura atual: regras de auditoria + limpeza de formulário.  
Guia: [`docs/TESTING.md`](./docs/TESTING.md)

---

## Decisões técnicas e trade-offs

Resumo em [`docs/TECHNICAL_DECISIONS.md`](./docs/TECHNICAL_DECISIONS.md):

- Sheets como sistema operacional (familiaridade > modelo relacional)
- Identificação por nome (baixa fricção > auth forte)
- Demo mode automático para portfólio web
- Domínio de auditoria testável no cliente e no servidor

**Trade-off consciente:** a API ainda não exige JWT de usuário. Isso é documentado em [`SECURITY_NOTES.md`](./SECURITY_NOTES.md) com caminho de hardening.

---

## Roadmap

- [ ] Auth / token compartilhado na Edge Function
- [ ] Fila offline com retry
- [ ] Screenshots reais no README
- [ ] Unificar módulo de auditoria mobile ↔ Deno (pacote shared)
- [ ] Observabilidade (logs estruturados / alertas de falha Sheets)

## Status atual

**Produção real (APK) + demo web pública.**  
Quality pass 2026-07: testes, CI, docs, UX de confiabilidade e sanitização de docs sensíveis.

---

## O que este projeto demonstra

- Produto mobile usado em contexto real (não só tutorial)
- Integração serverless (Supabase) + Google APIs
- Modelagem de regras de negócio testáveis
- UX para operação em campo (fluxo curto, comprovante, alerta)
- Capacidade de empacotar o mesmo app como demo web de portfólio
- Disciplina de engenharia: CI, typecheck, security notes, handoff

---

## Como eu apresentaria em entrevista

1. **Contexto:** “Substitui lançamento manual inconsistente em ensaio regional.”  
2. **Fluxo:** abrir → setup → lançar → ID + auditoria na planilha.  
3. **Decisão dura:** Sheets como sink operacional; Edge Function como gate de regras.  
4. **Qualidade:** mostro os testes de auditoria e o CI.  
5. **Honestidade:** API ainda sem auth de usuário — trade-off de fricção vs risco, com plano de harden.  
6. **Demo:** abro https://lancaensaio.vercel.app e faço um lançamento ao vivo.

---

## Documentação

- [`docs/AUDIT_REPORT.md`](./docs/AUDIT_REPORT.md)
- [`docs/HANDOFF.md`](./docs/HANDOFF.md)
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)
- [`COMECE_AQUI.md`](./COMECE_AQUI.md) · [`COMO_GERAR_APK.md`](./COMO_GERAR_APK.md)

---

## Autor

**Felipe Alirio Baruja** · [Portfólio](https://barujafe.vercel.app/) · [GitHub](https://github.com/BarujaFe1)
