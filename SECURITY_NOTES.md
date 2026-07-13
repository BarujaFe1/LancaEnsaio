# Security notes — LançaEnsaio
# Do not paste real secrets into this file.

## Findings (portfolio quality pass — 2026-07-13)

### Exposed project reference (not a private key)
Several operational docs historically listed the production Supabase Functions URL
(project ref visible in the hostname). A project ref + public Edge Function URL
is not a Google service-account key, but it is an attack surface for unauthenticated
API abuse (spam writes to the linked Google Sheet).

**Action taken:** public getting-started docs now use placeholders
(`SEU_PROJECT_REF`). Keep the real URL in EAS secrets / local `.env` only.

### Edge Function authentication
`POST /registros` and `POST /registros/alerta` do not require a user JWT.
The function relies on Supabase deployment secrets for Google Sheets access and
identifies the launcher via `nomeLancador` in the body.

**Risk:** anyone who knows the Functions URL can append rows / alerts.

**Recommended hardening (not implemented in this pass to avoid breaking the APK):**
1. Require `Authorization: Bearer <SUPABASE_ANON_OR_SERVICE>` and validate JWT, or
2. Use a shared app token in a custom header stored as EAS secret, or
3. Enable Supabase Functions JWT verification + app login.

### Google credentials
Service account JSON is expected as base64 in Supabase secret
`GOOGLE_SERVICE_ACCOUNT_B64`. It must never be committed. Backup file
`index-backup.ts` only contains parsing code, not credentials.

### Client env
Only `EXPO_PUBLIC_*` values ship in the client bundle. Never put private keys
in Expo public env vars.

### `.gitignore`
Root ignore rules now keep `.env*` out of git while allowing `.env.example`.

## Incident response
If a service account key was ever committed historically: rotate the Google key,
revoke the old one, rotate Supabase secrets, and redeploy the Edge Function.
