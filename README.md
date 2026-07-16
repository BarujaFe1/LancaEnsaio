<div align="center">
  <img src="./icon.png" alt="LançaEnsaio Logo" width="120" height="120" />

  <h1>LançaEnsaio</h1>

  <p><strong>Lançamento padronizado de ensaios da orquestra com auditoria e fila offline.</strong></p>
  <p><strong>Standardized orchestra rehearsal attendance with audit trail and offline queue.</strong></p>

  <p>
    <a href="#pt-br">PT-BR</a>
     · 
    <a href="#english">English</a>
     · 
    <a href="#live-demo">Live Demo</a>
     · 
    <a href="#stack">Stack</a>
     · 
    <a href="#architecture">Architecture</a>
     · 
    <a href="#quick-start">Quick Start</a>
     · 
    <a href="#author">Author</a>
  </p>

  <p>
    <img alt="Expo-54" src="https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white" />
    <img alt="React%20Native" src="https://img.shields.io/badge/React%20Native-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
    <img alt="Status-Deployed" src="https://img.shields.io/badge/Status-Deployed-22C55E?style=for-the-badge" />
  </p>

  <p>
    <a href="https://lancaensaio.vercel.app"><strong>Live Demo</strong></a>
     · 
    <a href="https://github.com/BarujaFe1/LancaEnsaio"><strong>Repo</strong></a>
     · 
    <a href="https://barujafe.vercel.app/"><strong>Portfolio</strong></a>
     · 
    <a href="https://www.linkedin.com/in/barujafe/"><strong>LinkedIn</strong></a>
  </p>
</div>


> **Product note:** mobile-first Expo app for orchestra rehearsal launch/attendance. The Vercel surface is a **web demo** with known limitations vs the native app (see scope).

---

## PT-BR

### Visão geral
O **LançaEnsaio** unifica o lançamento de ensaios (Irmãos / Irmãs) com formulário padronizado, auditoria, fila offline e integração **Supabase Edge Function → Google Sheets**.

### Problema
Controle de ensaio em planilhas soltas e aparelhos diferentes gera inconsistência, retrabalho e falta de rastreio quando a rede falha.

### Para quem
Equipes de orquestra / ensaio que precisam registrar presença de forma padronizada no celular, com modo offline.

### Funcionalidades
- Modo unificado de lançamento (fluxos Irmãos / Irmãs)
- Fila offline e sincronização quando a rede volta (`@react-native-community/netinfo`)
- Persistência local (AsyncStorage / Secure Store conforme fluxo)
- Backend Supabase (Edge Functions) com destino Google Sheets
- Web demo para testar no navegador (Vercel)

### Escopo e limites (honestos)
- Web demo **não** substitui 100% o app nativo (APIs de device / offline)
- Depende de projeto Supabase + secrets configurados
- Google Sheets é o destino operacional documentado — não é um ERP coral completo

---

## English

### Overview
**LançaEnsaio** standardizes rehearsal attendance (Brothers / Sisters flows) with auditability, an offline queue and **Supabase Edge Function → Google Sheets** integration.

### Problem
Spreadsheet-only attendance across devices creates inconsistency, rework and lost records when connectivity drops.

### Who it is for
Orchestra / rehearsal teams that need phone-first standardized attendance with offline support.

### Features
- Unified launch flows (Brothers / Sisters)
- Offline queue + sync when connectivity returns
- Local persistence (AsyncStorage / Secure Store as designed)
- Supabase Edge Functions targeting Google Sheets
- Browser web demo on Vercel

### Scope and honest limits
- Web demo does **not** fully replace the native app
- Requires configured Supabase project + secrets
- Google Sheets is the documented sink — not a full choir ERP

---

## Live Demo

| Surface | URL |
|---|---|
| **Public lab** | [https://lancaensaio.vercel.app](https://lancaensaio.vercel.app) |
| **GitHub** | see Repo badge above |

**How to try:** open the web demo → walk through a rehearsal launch form → note offline/native differences vs Expo Go / APK.



## Stack

| Layer | Technology |
|---|---|
| Mobile | Expo 54, React Native, TypeScript, Expo Router, Zustand |
| Backend | Supabase (Edge Functions, config in `supabase/`) |
| Demo | Vercel web export of the Expo app |

---

## Architecture

```txt
mobile/          Expo app (UI, offline queue, forms)
supabase/        Edge functions + config
docs/            runbooks / redesign notes
vercel.json      web demo deploy
```

Flow: form → local queue → sync → Edge Function → Google Sheets (+ audit fields).

---

## Quick Start

**Prerequisites:** Node.js 20+, Expo Go (or Android build toolchain), Supabase project.

```bash
cd mobile
npm install
cp .env.example .env   # if present — fill Supabase keys
npx expo start
```

APK / EAS notes: see `COMO_GERAR_APK.md` and `DEPLOY_INSTRUCTIONS.md` in the repo root.

---

## Technical decisions

- **Offline-first queue** so weak venue Wi-Fi does not block attendance
- **Supabase Edge Function** as a controlled write path to Sheets
- **Web demo on Vercel** for portfolio review without installing APK

---

## Roadmap

- Harden web/native parity for demo reviewers
- Stronger conflict handling on sync
- Operational dashboards on top of Sheets / Supabase

---

## Author

**Felipe Alirio Baruja** — data / product / full-stack portfolio.

- Portfolio: [https://barujafe.vercel.app/](https://barujafe.vercel.app/)
- GitHub: [https://github.com/BarujaFe1](https://github.com/BarujaFe1)
- LinkedIn: [https://www.linkedin.com/in/barujafe/](https://www.linkedin.com/in/barujafe/)


## License

License to be defined — no `LICENSE` file in this repository yet.
