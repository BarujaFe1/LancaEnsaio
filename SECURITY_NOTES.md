# Security notes — LançaEnsaio

Do not paste real secrets into this file.

## Auth model (2026-07-13)

### App token (implemented)
- Supabase secret: `APP_API_TOKEN`
- Client env: `EXPO_PUBLIC_APP_API_TOKEN`
- Headers: `Authorization: Bearer …` and/or `x-app-token`
- Health (`GET /health`) remains public and reports `authEnforced`.

If `APP_API_TOKEN` is **unset**, the API stays in **compat_open** mode (legacy APK).  
If set, protected routes require a matching token (timing-safe compare).

### Honest limitation
`EXPO_PUBLIC_*` values ship in the client bundle. This stops casual anonymous writes when the URL leaks, but is **not** end-user authentication. Prefer rotating the token if exposed and planning JWT/user auth later.

### Idempotency
`POST /registros` accepts `Idempotency-Key` / `idempotencyKey` and stores `IDEM=<key>` in the sheet metadata column. Replays return the existing row instead of duplicating.

### Google credentials
`GOOGLE_SERVICE_ACCOUNT_B64` and `ORQUESTRA_SHEET_ID` stay server-side only.

### Docs
Public docs use `SEU_PROJECT_REF` placeholders. Never republish live project refs unnecessarily.
