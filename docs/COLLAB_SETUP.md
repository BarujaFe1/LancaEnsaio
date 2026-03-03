# Maestro — Uso Coletivo (Tudo Compartilhado)

Este patch transforma o Maestro em sistema colaborativo:
- Quando um instrutor cria aluno/método/professor/lançamento, aparece para TODOS os instrutores.

## Passo 1 — Rode o SQL no Supabase
Supabase Dashboard → SQL Editor → Run:
- supabase/gem_collab_org.sql

Ele cria:
- organizations
- organization_members
- org_id em todas as tabelas
- policies RLS por organização
- org padrão GEM + backfill dos dados existentes (para ficar coletivo imediatamente)

## Passo 2 — Atualize o app (copiar arquivos)
- src/context/AuthContext.js
- src/services/org.js
- src/screens/SettingsScreen.js

## Passo 3 — Rodar e publicar
- npx expo start -c
- gere novo APK/AAB

## Código da equipe
Padrão: GEMVGS-2026
Você pode trocar no SQL e no AuthContext.
