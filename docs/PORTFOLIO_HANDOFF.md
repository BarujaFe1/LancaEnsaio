# Portfolio Handoff — LançaEnsaio

**Branch:** `chore/portfolio-quality-pass`  
**Data:** 2026-07-13  
**Recomendação de vitrine:** **destaque** (automação operacional + mobile + integração de dados)

## Resumo

App Expo/React Native para lançamento padronizado de ensaios (Irmãos/Irmãs), com Edge Function Supabase gravando em Google Sheets, demo web sem backend, auth por app token, fila offline com idempotência e domínio de auditoria testado.

## Before / after

| Antes (main pré-pass) | Depois (esta branch) |
|-----------------------|----------------------|
| Sem testes / CI | 25 testes + GitHub Actions |
| API aberta | `APP_API_TOKEN` (compat até secret setado) |
| Offline bloqueava | Fila + flush + IDEM |
| Demo data desalinhada | Categorias/cargos alinhados |
| Docs com project ref | Placeholders + SECURITY_NOTES |
| Poucos screenshots | `docs/screenshots/*.png` (web demo, sem PII) |

## Comandos

```bash
cd mobile
npm ci
npm run ci          # lint + typecheck + test
npm run export:web  # build estático
```

Secrets (não commitados):

```bash
supabase secrets set APP_API_TOKEN=... ORQUESTRA_SHEET_ID=... GOOGLE_SERVICE_ACCOUNT_B64=...
supabase functions deploy api
```

## Evidências

- Screenshots: `docs/screenshots/`
- Case study: `docs/CASE_STUDY.md`
- Demo 3–5 min: `docs/DEMO_SCRIPT.md`
- Web demo pública: https://lancaensaio.vercel.app  
  **Atenção:** pode estar em build anterior até redeploy Vercel desta branch.

## Limitações honestas

1. Token de app é `EXPO_PUBLIC_*` (visível no bundle) — mitiga abuso casual, não substitui login de usuário.
2. Sheets como sink: ótimo operacionalmente, frágil como modelo relacional.
3. Vídeo MP4 não versionado; roteiro pronto em `DEMO_SCRIPT.md`.
4. Auth enforced só após `APP_API_TOKEN` no Supabase + novo APK/EAS com o mesmo token.

## Próximos passos

1. Merge PR + redeploy Edge Function + Vercel.
2. Configurar `APP_API_TOKEN` e rebuild EAS.
3. Gravar vídeo curto seguindo `DEMO_SCRIPT.md`.
4. (Opcional) JWT de usuário / rate limit.

## Links canônicos

- Repo: https://github.com/BarujaFe1/LancaEnsaio
- Demo: https://lancaensaio.vercel.app
- Portfólio: https://barujafe.vercel.app/
- Releases/APK: https://github.com/BarujaFe1/LancaEnsaio/releases/latest
