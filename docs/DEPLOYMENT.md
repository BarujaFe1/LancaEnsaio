# Deployment — LançaEnsaio

## Variáveis

### Mobile / EAS / local

```env
EXPO_PUBLIC_API_URL=https://SEU_PROJECT_REF.supabase.co/functions/v1/api
EXPO_PUBLIC_APP_API_TOKEN=troque-por-um-token-longo-e-aleatorio
# EXPO_PUBLIC_DEMO=true
```

Copie de `mobile/.env.example`.

### Supabase Edge Function secrets

```bash
supabase secrets set \
  APP_API_TOKEN=... \
  ORQUESTRA_SHEET_ID=... \
  GOOGLE_SERVICE_ACCOUNT_B64=...
```

Nunca commitar esses valores. Ver `SECURITY_NOTES.md`.

## Deploy da API

```bash
cd supabase
supabase functions deploy api
```

Health (não exige Sheets configurado):

```bash
curl https://SEU_PROJECT_REF.supabase.co/functions/v1/api/health
```

## APK (EAS)

```bash
cd mobile
eas build --platform android --profile preview
```

Detalhes: `COMO_GERAR_APK.md`.

## Web demo (Vercel)

`vercel.json` na raiz:

- build: `cd mobile && npm install && npx expo export --platform web`
- output: `mobile/dist`
- SPA rewrite para `index.html`

Local:

```bash
cd mobile
npm run export:web
npx serve dist
```

Sem `EXPO_PUBLIC_API_URL`, a demo sobe em modo mock automaticamente.

## Produção atual (referência)

- Web: https://lancaensaio.vercel.app  
- APK: releases do GitHub  
- Portfólio: https://barujafe.vercel.app/
