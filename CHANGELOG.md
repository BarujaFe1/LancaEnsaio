# Changelog — LançaEnsaio

## [Unreleased] — branch `chore/portfolio-quality-pass` (2026-07-13)

### Added
- Autenticação por **app token** na Edge Function (`APP_API_TOKEN` + Bearer / `x-app-token`).
- **Idempotência** em `POST /registros` (`Idempotency-Key` / `idempotencyKey` → `IDEM=` no metadado).
- **Fila offline** no mobile com flush automático no refresh e manual em Configurações.
- Testes de domínio para auth, idempotência e fila (total **25**).
- Docs: `CASE_STUDY.md`, `DEMO_SCRIPT.md`, `PORTFOLIO_HANDOFF.md`, screenshots sem PII.
- Health expõe `authEnforced` e `sheetsConfigured`.

### Changed
- README orientado a portfólio / entrevista (claims honestos).
- `.env.example` inclui `EXPO_PUBLIC_APP_API_TOKEN`.
- Banner offline passa a informar enfileiramento (não bloqueio total).

### Removed
- Dependência não usada `zustand`.
- Componentes template Expo ociosos (`hello-wave`, `parallax-scroll-view`).

### Security
- Atualizado `SECURITY_NOTES.md` com modelo de token de app e limitações.

### Deploy note
- A web pública `lancaensaio.vercel.app` pode ainda servir build anterior até novo deploy Vercel desta branch.
- A Edge Function precisa de redeploy + secret `APP_API_TOKEN` para auth enforced.
