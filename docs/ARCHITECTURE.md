# Architecture — LançaEnsaio

## Visão geral

```
┌──────────────────────────────┐
│  Expo App (Android / Web)    │
│  Expo Router + TypeScript    │
│  session / form draft / UX   │
└──────────────┬───────────────┘
               │ HTTP (axios)  — ou DEMO local
               ▼
┌──────────────────────────────┐
│  Supabase Edge Function api  │
│  Deno — auditoria + IDs      │
└──────────────┬───────────────┘
               │ Sheets API v4
               ▼
┌──────────────────────────────┐
│  Google Spreadsheet          │
│  Base Geral + Dados Geral    │
└──────────────────────────────┘
```

## Pastas

| Path | Responsabilidade |
|------|------------------|
| `mobile/app/` | Rotas (setup, tabs lançar/config) |
| `mobile/src/domain/` | Regras de auditoria e IDs (testáveis) |
| `mobile/src/backend.ts` | Adapter demo vs API real |
| `mobile/src/storage/` | Draft do formulário / trava cidade |
| `mobile/src/session.ts` | Preferências do lançador |
| `supabase/functions/api/` | Edge Function de produção |

## Fluxos

1. **Setup** — nome + modo (Irmãos/Irmãs) → AsyncStorage  
2. **Lançar** — valida domínio → POST `/registros` (ou demo) → comprovante  
3. **Alerta** — POST `/registros/alerta` anexa texto na coluna de auditoria  
4. **Config** — GET `/config` lê catálogos da planilha  

## Demo mode

Ativo quando `EXPO_PUBLIC_API_URL` está vazio ou `EXPO_PUBLIC_DEMO=true`.  
Usado no deploy Vercel: sem secrets, histórico local, banner explícito.

## Fronteiras importantes

- A “fonte da verdade” de produção é a planilha, não um Postgres RLS.  
- Supabase aqui é runtime serverless + secrets, não o modelo de dados principal.  
- Regras de auditoria existem no cliente (feedback) e no servidor (autoridade).
