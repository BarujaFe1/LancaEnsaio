# Case study — LançaEnsaio (antes / depois)

## Problema

Em ensaios regionais, o registro de presença/função misturava papel, WhatsApp e edição direta de planilha no celular. Resultado típico: campos incompletos, pouca rastreabilidade de quem lançou e correções sem histórico.

## Antes (baseline operacional)

| Dimensão | Situação |
|----------|----------|
| Entrada | Digitação livre / planilha aberta |
| Regras | Mentais / inconsistentes |
| Auditoria | Quase inexistente |
| Offline | Perda ou atraso do lançamento |
| API | Endpoint público sem token de app |
| Evidência de portfólio | README longo, poucos testes, sem CI |

## Depois (estado atual do repositório)

| Dimensão | Situação |
|----------|----------|
| Entrada | Fluxo guiado mobile (Irmãos/Irmãs) |
| Regras | Domínio `auditoria` testado (cliente + servidor) |
| Auditoria | Metadado `META …` + alertas anexados |
| Offline | Fila local com `idempotencyKey` e flush |
| API | `APP_API_TOKEN` (Bearer / x-app-token), health público |
| Evidência | CI, testes de domínio, docs de arquitetura/handoff |

## Fluxo Edge Function → Sheets (sem expor segredos)

```text
App (token Bearer)
   │  POST /registros + Idempotency-Key
   ▼
Supabase Edge Function `api`
   │  valida token (secret APP_API_TOKEN)
   │  aplica auditarRegistro()
   │  obtém access token Google via service account (secret)
   ▼
Google Sheets
   A: horário | B: id | … | H: metadado (+ IDEM=…)
```

Segredos ficam só em Supabase Secrets / EAS — nunca no README.

## Métricas honestas (qualitativas)

- Tempo de lançamento: tipicamente < 1 minuto após setup.
- Replay seguro: mesmo `Idempotency-Key` não duplica linha.
- Demo pública: web sem backend, sem PII operacional.

## O que ainda não é verdade

- Não há login individual com JWT de usuário.
- Token de app ainda é embarcado no cliente (`EXPO_PUBLIC_*`) — reduz abuso casual, não é auth de ponta a ponta.
- Deploy público da web pode estar em build anterior até novo deploy Vercel.
