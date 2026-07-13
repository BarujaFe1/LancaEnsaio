# Audit Report — LançaEnsaio

**Data:** 2026-07-13  
**Branch:** `chore/portfolio-quality-pass`  
**Avaliador:** portfolio quality pass (arquitetura, QA, segurança, DX, recrutamento)

## Resumo executivo

LançaEnsaio é um app Expo/React Native (TypeScript) em uso real para lançamento padronizado de ensaios (Irmãos/Irmãs), com backend Supabase Edge Function gravando em Google Sheets. Há demo web na Vercel sem backend. O produto tem proposta clara e fluxo curto, mas faltavam testes, CI, domínio de auditoria compartilhado, tratamento offline e documentação de operação/portfólio alinhada.

**Nota atual (antes deste pass):** **6.5 / 10**  
**Nota alvo após este pass:** **8.0–8.5 / 10** (ainda limitado por API sem auth forte e ausência de screenshots reais)

## Stack real

| Camada | Tecnologia |
|--------|------------|
| App | Expo 54, React Native 0.81, Expo Router, TypeScript |
| Estado local | AsyncStorage (+ draft de formulário) |
| Backend | Supabase Edge Functions (Deno) |
| Persistência | Google Sheets API v4 (service account) |
| Demo web | `expo export --platform web` + Vercel |
| Build mobile | EAS (`eas.json` preview/production APK) |

## Principais riscos

1. **API pública sem autenticação de usuário** — quem conhece a URL pode gravar/alertar.
2. **Project ref da API aparecia em docs públicas** — superfície de abuso (mitigado com placeholders).
3. **Sem testes automatizados** (antes) — regressão fácil nas regras de auditoria.
4. **Sem CI** (antes) — qualidade dependia de disciplina manual.
5. **Demo data desalinhada da produção** — categorias Sopros/Percussão vs Cordas/Metais/Madeiras/Teclas.
6. **Pull-to-refresh quebrado** — `refreshing` nunca ia para `true`.
7. **Health da Edge Function dependia de secrets** — monitoramento falhava sem Sheets configurado.
8. **Dependências instaladas e ociosas** — NetInfo, form-storage, zustand quase/não usados.

## Quick wins (executados)

- Extrair e testar regras de auditoria.
- Corrigir refresh, demo data, health endpoint, banners demo/offline.
- Validação client-side antes do POST.
- Persistência do último comprovante + trava de cidade.
- Scripts `typecheck` / `ci` + Jest + GitHub Actions.
- Docs de arquitetura, deploy, testes, handoff e README de portfólio.
- `.gitignore` seguro + `SECURITY_NOTES.md`.

## Melhorias estruturais

- Separar domínio (`src/domain`) de UI e de I/O (`backend`, `storage`).
- Manter espelho `supabase/functions/api/auditoria.ts` sincronizado com o mobile.
- Tratar demo como first-class (`isDemo()` + banner).
- CI mínima e estável no `mobile/`.

## Bugs encontrados

| Bug | Severidade | Status |
|-----|------------|--------|
| Pull-to-refresh sem `setRefreshing(true)` | Média | Corrigido |
| Demo com categorias erradas | Alta (demo) | Corrigido |
| Cargos demo irreais para Irmãs | Média | Corrigido |
| `mustEnv()` bloqueava OPTIONS/health | Média | Corrigido |
| Draft/`travaCidade` implementados e não ligados | Média | Corrigido |
| NetInfo instalado sem uso / sem UX offline | Média | Corrigido |
| Zero testes apesar de Jest no package | Alta (qualidade) | Corrigido |
| `.gitignore` com `.env*` engolindo `.env.example` | Baixa | Corrigido |
| Docs com URL real de Functions | Média (segurança) | Mitigado |

## Plano de execução

1. Diagnóstico + branch  
2. Install / lint / typecheck / test  
3. Correções de bugs + domínio + testes  
4. UX de confiabilidade (offline, empty, a11y básica)  
5. Docs + CI + README  
6. Handoff + commit/push  

## Checklist final

- [x] Instala (`npm install` / `npm ci`)
- [x] Lint passa
- [x] Typecheck passa
- [x] Testes essenciais passam
- [x] Demo web documentada / build exportável
- [x] README de portfólio
- [x] Docs ARCHITECTURE / TECHNICAL_DECISIONS / TESTING / DEPLOYMENT / HANDOFF
- [x] CI GitHub Actions
- [x] `.env.example` + `.gitignore`
- [x] SECURITY_NOTES sem republicar segredos
- [ ] Screenshots reais em `docs/screenshots/` (placeholder documentado)
- [ ] Auth na Edge Function (próximo passo operacional)
