<div align="center">
  <img src="./icon.png" alt="LançaEnsaio Logo" width="120" height="120" />

  <h1>LançaEnsaio</h1>

  <p><strong>Sistema unificado para lançamento de ensaios de Irmãos e Irmãs da Orquestra</strong></p>
  <p><strong>Unified mobile system for orchestra rehearsal attendance registration</strong></p>

  <p>
    <a href="#pt-br">PT-BR</a> •
    <a href="#en">English</a> •
    <a href="#stack--tecnologias">Stack</a> •
    <a href="#quick-start--início-rápido">Quick Start</a> •
    <a href="#api">API</a> •
    <a href="#autor--author">Autor</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg?logo=react&logoColor=white" alt="React Native 0.81" />
    <img src="https://img.shields.io/badge/Expo-54-000020.svg?logo=expo&logoColor=white" alt="Expo 54" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript&logoColor=white" alt="TypeScript 5.9" />
    <img src="https://img.shields.io/badge/Supabase-Edge%20Functions-3ECF8E.svg?logo=supabase&logoColor=white" alt="Supabase Edge Functions" />
    <img src="https://img.shields.io/badge/Google%20Sheets-API%20v4-34A853.svg?logo=googlesheets&logoColor=white" alt="Google Sheets API v4" />
    <img src="https://img.shields.io/badge/Vercel-Deploy-000000.svg?logo=vercel&logoColor=white" alt="Vercel Deploy" />
  </p>

  <p>
    <a href="https://github.com/BarujaFe1/LancaEnsaio"><strong>📦 Repositório</strong></a> •
    <a href="https://github.com/BarujaFe1/LancaEnsaio/releases/latest"><strong>⬇️ Download APK</strong></a> •
    <a href="https://lancaensaio.vercel.app"><strong>🌐 Web Demo</strong></a> •
    <a href="https://barujafe.vercel.app/"><strong>🌐 Portfólio</strong></a>
  </p>
</div>

---

<a id="pt-br"></a>

## 🇧🇷 PT-BR

## 📱 Visão geral

**LançaEnsaio** é um aplicativo mobile moderno para lançamento de ensaios de **Irmãos e Irmãs da Orquestra**, com fluxo simples, visual premium e integração direta com Google Sheets via backend serverless.

O app foi pensado para substituir registros manuais, reduzir atrito no lançamento de presença e organizar os dados em uma base centralizada, sem exigir login complexo ou operação técnica do usuário final.

A proposta é clara: abrir o app, identificar o lançador, selecionar o modo correto, preencher os dados do ensaio e registrar tudo com rapidez, consistência e rastreabilidade.

> **Objetivo:** tornar o lançamento de ensaios mais rápido, padronizado e confiável para uso prático no dia a dia.

---

## 🎯 Problema que resolve

Registros manuais de ensaio tendem a gerar retrabalho, inconsistência e dificuldade de organização. Em contextos com diferentes categorias, cidades, instrumentos, cargos e modos de lançamento, é comum haver:

- preenchimentos incompletos;
- nomes e categorias com variações;
- dificuldade para consolidar os dados;
- registros duplicados ou confusos;
- pouca rastreabilidade sobre quem lançou;
- dependência de planilhas preenchidas manualmente.

O **LançaEnsaio** resolve esse fluxo com uma interface mobile simples e uma API centralizada que grava os dados diretamente na planilha configurada.

---

## ✨ Funcionalidades principais

### 🔄 Modo unificado

O app suporta dois fluxos dentro da mesma experiência:

- **Irmãos**
- **Irmãs**

Cada modo adapta campos, padrões e comportamento do lançamento conforme a necessidade.

---

### 👨‍🎼 Para Irmãos

- Seleção de categoria:
  - Cordas
  - Metais
  - Madeiras
  - Teclas
- Escolha de instrumento específico.
- Registro de ministério e cargo musical.
- Lançamento com ID único.
- Padrão **Cantor** quando não há instrumento/cargo selecionado.
- Fluxo completo para registros mais detalhados.

---

### 👩‍🎼 Para Irmãs

- Registro simplificado.
- Fluxo sem ministério.
- Seleção de cargo musical:
  - Organista
  - Instrutora
  - Examinadora
- Lançamento com ID único.
- Padrão **Cantora** quando não há cargo selecionado.
- Experiência adaptada ao modo selecionado.

---

### 🌐 Web Demo — Testar no navegador

O LançaEnsaio também está disponível como **site web estático** (Expo Web) para teste imediato, sem instalar nada:

**[https://lancaensaio.vercel.app](https://lancaensaio.vercel.app)**

- Modo demonstração com dados mockados (cidades, instrumentos, ministérios, cargos musicais).
- Fluxo completo: setup → lançamento → comprovante → alerta.
- Persistência local (AsyncStorage) — histórico sobrevive a recargas.
- Header profissional com badges (React Native, Expo, Supabase, TypeScript) e links para portfólio/GitHub.
- Build estático na Vercel com `expo export --platform web` e SPA rewrite.
- Nenhum backend real necessário — ideal para recrutadores e avaliadores.

**Limitações conhecidas da Web Demo**
- Bundle único (~1.6 MB) gerado por `expo export --platform web` (sem code-splitting de rotas).
- Pickers usam `<select>` HTML no web; o tema dark é forçado via CSS, mas o dropdown nativo do SO ainda pode variar entre navegadores.
- `Alert` nativo do React Native é substituído por `window.alert`/`confirm` no web.
- Preferências e log demo ficam em `localStorage` (podem ser limpos pelo usuário).

```txt
portfolio-project-handoff.md  →  Documentação completa de handoff do deploy web
```

---

### 📲 Recursos gerais

- Troca rápida entre modos.
- Seleção de cidade/congregação.
- Persistência local de preferências.
- Sistema de alertas para registros existentes.
- Comprovante visual do último lançamento.
- Interface escura moderna e adaptativa.
- Fluxo otimizado para uso mobile em campo.
- APK instalável sem necessidade de Expo Go.

---

## 🖼️ Screenshots

Adicione os arquivos em `docs/screenshots/` para exibir as telas no README:

```md
<p align="center">
  <img src="docs/screenshots/irmaos.png" alt="Modo Irmãos" width="250"/>
  <img src="docs/screenshots/irmas.png" alt="Modo Irmãs" width="250"/>
  <img src="docs/screenshots/lancamento.png" alt="Lançamento Realizado" width="250"/>
</p>

<p align="center">
  <img src="docs/screenshots/setup.png" alt="Tela de Setup" width="250"/>
  <img src="docs/screenshots/configuracoes.png" alt="Configurações" width="250"/>
</p>
```

---

<a id="en"></a>

## 🇺🇸 English

## 📱 Overview

**LançaEnsaio** is a modern mobile application for registering rehearsal attendance for **orchestra brothers and sisters**, with a simple workflow, premium interface and direct Google Sheets integration through a serverless backend.

The app was designed to replace manual registration, reduce friction in attendance logging and organize records in a centralized base, without requiring complex login or technical operation from the end user.

The proposal is straightforward: open the app, identify the user, select the correct mode, fill in the rehearsal data and register everything quickly, consistently and traceably.

> **Goal:** make rehearsal registration faster, more standardized and more reliable for practical daily use.

---

## 🎯 Problem solved

Manual rehearsal records tend to create rework, inconsistency and organizational problems. In contexts with different categories, cities, instruments, roles and registration modes, it is common to face:

- incomplete records;
- inconsistent names and categories;
- difficulty consolidating data;
- duplicate or confusing entries;
- little traceability about who registered the entry;
- dependence on manually edited spreadsheets.

**LançaEnsaio** solves this workflow with a simple mobile interface and a centralized API that writes data directly to the configured spreadsheet.

---

## ✨ Key features

### 🔄 Unified mode

The app supports two workflows inside the same experience:

- **Brothers**
- **Sisters**

Each mode adapts fields, defaults and behavior according to the registration need.

---

### 👨‍🎼 For Brothers

- Category selection:
  - Strings
  - Brass
  - Woodwinds
  - Keys
- Specific instrument selection.
- Ministry and musical role registration.
- Unique ID generation.
- Default **Singer** when no instrument/role is selected.
- Complete flow for more detailed records.

---

### 👩‍🎼 For Sisters

- Simplified registration.
- Flow without ministry.
- Musical role selection:
  - Organist
  - Instructor
  - Examiner
- Unique ID generation.
- Default **Singer** when no role is selected.
- Experience adapted to the selected mode.

---

### 🌐 Web Demo — Test in browser

LançaEnsaio is also available as a **static web site** (Expo Web) for immediate testing, no installation required:

**[https://lancaensaio.vercel.app](https://lancaensaio.vercel.app)**

- Demo mode with mock data (cities, instruments, ministries, musical roles).
- Complete flow: setup → registration → receipt → alert.
- Local persistence (AsyncStorage) — history survives page reloads.
- Professional header with badges (React Native, Expo, Supabase, TypeScript) and portfolio/GitHub links.
- Static build on Vercel with `expo export --platform web` and SPA rewrite.
- No real backend needed — ideal for recruiters and evaluators.

**Known Web Demo limitations**
- Single JS bundle (~1.6 MB) from `expo export --platform web` (no route-level code splitting).
- Pickers render as HTML `<select>` on web; dark theme is forced via CSS, but the OS dropdown may still vary by browser.
- React Native `Alert` is replaced by `window.alert`/`confirm` on web.
- Preferences and demo log live in `localStorage` (can be cleared by the user).

```txt
portfolio-project-handoff.md  →  Complete handoff documentation for the web deploy
```

---

### 📲 General resources

- Quick mode switching.
- City/congregation selection.
- Local preference persistence.
- Alert system for existing records.
- Visual receipt for the last registration.
- Modern adaptive dark interface.
- Mobile-first workflow for field use.
- Installable APK without requiring Expo Go.

---

## 🖼️ Screenshots

Add files to `docs/screenshots/` to display the screens in the README:

```md
<p align="center">
  <img src="docs/screenshots/irmaos.png" alt="Brothers Mode" width="250"/>
  <img src="docs/screenshots/irmas.png" alt="Sisters Mode" width="250"/>
  <img src="docs/screenshots/lancamento.png" alt="Registration Completed" width="250"/>
</p>

<p align="center">
  <img src="docs/screenshots/setup.png" alt="Setup Screen" width="250"/>
  <img src="docs/screenshots/configuracoes.png" alt="Settings" width="250"/>
</p>
```

---

<a id="stack--tecnologias"></a>

## 🛠️ Stack / Tecnologias

### Mobile

- **React Native 0.81**
- **Expo 54**
- **TypeScript 5.9**
- **Expo Router**
- **React Native Web** (export web)
- **AsyncStorage**
- **Zustand**

### Backend

- **Supabase Edge Functions**
- **Deno Runtime**
- **TypeScript**
- **Google Sheets API v4**
- **Service Account Auth**

### Infraestrutura

- **Supabase**
- **Google Cloud**
- **Vercel** (web static deploy + SPA rewrite)
- **GitHub**
- **EAS Build**

---

## 🏗️ Arquitetura / Architecture

```txt
┌─────────────────┐     ┌───────────────────────┐
│   Mobile App    │     │   Web Demo (Static)    │
│ React Native    │     │   Expo Web + Vercel    │
│ Expo + TS       │     │   modo demo local      │
└────────┬────────┘     └───────────────────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│ Supabase Edge   │
│ Functions       │
│ Deno + TS       │
└────────┬────────┘
         │
         │ Google Sheets API v4
         ▼
┌─────────────────┐
│ Google Sheets   │
│ Base Geral      │
│ Dados Geral     │
└─────────────────┘
```

### Fluxo de dados / Data flow

```txt
Usuário
  ↓
App Mobile
  ↓
API Supabase Edge Function
  ↓
Validação e normalização
  ↓
Google Sheets API v4
  ↓
Planilha central
  ↓
Comprovante visual no app
```

---

## 📁 Estrutura do projeto / Project structure

```txt
LancaEnsaio/
├── mobile/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx
│   │   │   └── settings.tsx
│   │   ├── setup.tsx
│   │   └── _layout.tsx
│   ├── src/
│   │   ├── api.ts
│   │   ├── backend.ts        ← Modo demo / abstração de backend
│   │   ├── session.ts
│   │   ├── components/
│   │   │   └── WebSiteHeader.tsx  ← Header web com badges e links
│   │   └── constants/
│   ├── assets/
│   ├── .env
│   ├── app.json
│   └── package.json
├── supabase/
│   ├── functions/
│   │   └── api/
│   └── config.toml
├── docs/
│   └── screenshots/
├── vercel.json               ← Config de build e deploy Vercel
├── COMECE_AQUI.md
├── portfolio-project-handoff.md  ← Documentação de handoff do deploy web
└── README.md
```

---

<a id="quick-start--início-rápido"></a>

## 🚀 Quick Start / Início rápido

### Opção 1 — Download direto do APK

A forma mais simples de usar o app é instalar o APK no Android:

[⬇️ Download APK v1.0.0](https://github.com/BarujaFe1/LancaEnsaio/releases/latest)

1. Baixe o APK no link acima.
2. No Android, habilite instalação de fontes desconhecidas, se necessário.
3. Instale o arquivo.
4. Abra o app.
5. Faça o setup inicial.
6. Comece a lançar ensaios.

---

### Opção 2 — Desenvolvimento com Expo Go

#### Pré-requisitos

- Node.js 18+
- Expo Go no celular
- Celular e computador na mesma rede Wi-Fi

#### Instalação

```bash
# Clone the repository
git clone https://github.com/BarujaFe1/LancaEnsaio.git

# Enter mobile app
cd LancaEnsaio/mobile

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start Expo
npx expo start
```

#### Primeiro uso / First use

1. Install Expo Go on the phone.
2. Run `npx expo start`.
3. Scan the QR Code.
4. On setup:
   - enter your name;
   - choose mode: Irmãos or Irmãs;
   - tap **Salvar e Continuar**.
5. Start registering rehearsals.

---

## ⚙️ Configuração / Configuration

### Variáveis de ambiente / Environment variables

Create `mobile/.env` based on `.env.example`:

```env
EXPO_PUBLIC_API_URL=https://SEU_PROJECT_REF.supabase.co/functions/v1/api
```

### Supabase secrets

```bash
supabase secrets set \
  ORQUESTRA_SHEET_ID="ID_DA_PLANILHA" \
  GOOGLE_SERVICE_ACCOUNT_B64="BASE64_DA_CREDENCIAL"
```

### Backend deploy

```bash
cd supabase
supabase functions deploy api --no-verify-jwt
```

---

## 📱 Gerar APK / Generate APK

### Cloud build, recommended

```bash
cd mobile
npx eas build --platform android --profile preview
```

### Local build

```bash
cd mobile
npx eas build --platform android --profile preview --local
```

See also:

```txt
COMO_GERAR_APK.md
```

---

## 🧪 Testes / Testing

### Teste manual / Manual test

```bash
cd mobile
npx expo start
```

Follow the manual testing guide:

```txt
TESTE_MANUAL_ATUALIZADO.md
```

### Code validation

```bash
npx tsc --noEmit
npm run lint
```

---

<a id="api"></a>

## 🔗 API

### GET `/health`

```bash
curl https://PROJECT_REF.supabase.co/functions/v1/api/health
```

### GET `/config`

```bash
curl https://PROJECT_REF.supabase.co/functions/v1/api/config
```

### POST `/registros`

```bash
curl -X POST https://PROJECT_REF.supabase.co/functions/v1/api/registros \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "IRMAOS",
    "nomeLancador": "João Silva",
    "cidade": "Ribeirão - Ipiranga",
    "categoria": "Metais",
    "instrumento": "Trompete",
    "ministerio": "",
    "musicaCargo": "Instrutor"
  }'
```

### POST `/registros/alerta`

```bash
curl -X POST https://PROJECT_REF.supabase.co/functions/v1/api/registros/alerta \
  -H "Content-Type: application/json" \
  -d '{
    "id": "MINV1234",
    "aviso": "Texto do alerta",
    "nomeLancador": "João Silva"
  }'
```

---

## 🗂️ Formato da planilha / Spreadsheet format

### Aba `Base Geral`

Configurações do sistema:

- instrumentos;
- cidades;
- ministérios;
- cargos.

### Aba `Dados Geral`

Registros de lançamento nas colunas A-H.

| Coluna | Conteúdo | Exemplo |
|---|---|---|
| A | Horário | `18:30 - 24/04/2026` |
| B | ID | `MJOA1234` ou `F1234` |
| C | Categoria | `Metais` ou `-` |
| D | Instrumento | `Trompete` ou `-` |
| E | Cidade | `Ribeirão - Ipiranga` |
| F | Ministério | `Jovens` ou `-` |
| G | Música/Cargo | `Instrutor` |
| H | Auditoria | `META APP=UNIFICADO TIPO=IRMAOS USER=João Silva` |

---

## 🎨 Design System

### Paleta de cores / Color palette

```css
--bg-primary: #0A0B0E;
--bg-card: #1A1D25;
--bg-field: #0F1115;

--primary: #34C759;
--warning: #FF9500;

--text-primary: #FFFFFF;
--text-secondary: #9CA3AF;
--text-label: #E5E7EB;
```

### Tipografia / Typography

- **Nome do usuário / User name:** 28pt, weight 900
- **Títulos de card / Card titles:** 20pt, weight 800
- **Labels:** 13pt, weight 700, uppercase
- **Botões / Buttons:** 17pt, weight 900

---

## 🤝 Contribuição / Contributing

Contribuições são bem-vindas.

```bash
git checkout -b feature/minha-feature
git commit -m "feat: minha feature"
git push origin feature/minha-feature
```

Then open a Pull Request.

### Padrão de commits / Commit pattern

- `feat:` nova funcionalidade / new feature
- `fix:` correção de bug / bug fix
- `docs:` documentação / documentation
- `style:` formatação / formatting
- `refactor:` refatoração / refactor
- `test:` testes / tests
- `chore:` manutenção / maintenance

---

## 📞 Suporte / Support

For questions, improvements or issues:

1. Consulte a documentação em `docs/`.
2. Abra uma issue no repositório.
3. Acompanhe o autor no LinkedIn.
4. Veja outros projetos no GitHub.

---

<a id="autor--author"></a>

## 👤 Autor / Author

Developed by **Felipe Alirio Baruja**.

- **Portfolio:** [https://barujafe.vercel.app/](https://barujafe.vercel.app/)
- **GitHub:** [github.com/BarujaFe1](https://github.com/BarujaFe1)
- **LinkedIn:** [linkedin.com/in/barujafe](https://www.linkedin.com/in/barujafe/)
- **Repository:** [github.com/BarujaFe1/LancaEnsaio](https://github.com/BarujaFe1/LancaEnsaio)

---

## 📝 Licença / License

Este projeto é de uso interno da organização.

This project is intended for internal organizational use.

---

<div align="center">
  <p><strong>LançaEnsaio</strong></p>
  <p>Feito com ❤️ para a Orquestra.</p>
  <p><em>Built with care for orchestra rehearsal workflows.</em></p>
</div>
