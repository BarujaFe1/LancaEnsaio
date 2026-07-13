# Handoff — portfolio quality pass (LançaEnsaio)

**Branch:** `chore/portfolio-quality-pass`  
**Data:** 2026-07-13  
**Autor da revisão:** Cursor agent (pedido de revisão profunda)

## O que foi encontrado

- App Expo real com Edge Function + Sheets; demo web já existia.
- Lint/typecheck ok; **zero testes** e **sem CI**.
- Bugs: pull-to-refresh, demo data desalinhada, health da API preso a secrets.
- Código morto/parcial: `form-storage`, NetInfo sem UX.
- Docs operacionais com project ref da API em texto público.
- README longo, mas pouco orientado a recrutador (faltavam seções pedidas).

## O que foi corrigido

- Refresh control (`setRefreshing(true)`).
- Demo: categorias Cordas/Metais/Madeiras/Teclas + cargos coerentes.
- Edge Function: OPTIONS/health sem `mustEnv()`; auditoria modularizada.
- Validação client-side via domínio `auditoria`.
- Offline banner + bloqueio de envio fora do demo.
- Draft do formulário + trava de cidade ligados à UI.
- Persistência do último comprovante.
- Sanitização de project refs em docs públicas.
- `.gitignore` não engole mais `.env.example`.

## O que foi melhorado

- Testes Jest (16) para auditoria e form-state.
- Scripts `typecheck`, `export:web`, `ci`.
- GitHub Actions CI.
- Docs: AUDIT, ARCHITECTURE, TECHNICAL_DECISIONS, TESTING, DEPLOYMENT, HANDOFF.
- README reescrito como peça de portfólio.
- `SECURITY_NOTES.md` com riscos e hardening sugerido.
- Acessibilidade básica (labels/roles) e empty/error states na tela de lançamento.

## Comandos rodados

```bash
cd mobile
npm install
npm run lint        # ok
npm run typecheck   # ok
npm test            # 16 passed
```

## Testes executados

- `auditoria.test.ts` — IRMAS/IRMAOS, IDs, validação
- `form-state.test.ts` — trava cidade

## O que ainda falta

- Screenshots reais em `docs/screenshots/`
- Auth na Edge Function (breaking change consciente)
- Fila offline completa
- Remover restos de template Expo (`components/hello-wave`, etc.) se desejado
- `npm audit` ainda lista vulnerabilidades transitivas (não forçado `--force`)

## Riscos restantes

- API sem JWT de usuário (documentado).
- Dois arquivos de auditoria (mobile ↔ Deno) podem divergir.
- Volume/concurrência Sheets.

## Próximos passos

1. Merge desta branch após review.
2. Redeploy Edge Function (`auditoria.ts` + health).
3. Capturar screenshots e linkar no README.
4. Planejar token/JWT na API sem quebrar o APK em campo.

## Sugestões para o portfólio

- Abrir a web demo no início da conversa.
- Mostrar um teste de auditoria falhando/passando.
- Contar o trade-off Sheets vs banco + o plano de segurança.

## Mensagem de commit sugerida

```text
chore: improve portfolio quality, docs, tests and stability
```
