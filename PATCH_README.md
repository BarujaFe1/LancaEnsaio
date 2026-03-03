# Patch ZIP — Maestro (TUDO COLETIVO)

## Objetivo
Tudo no app é compartilhado entre instrutores (mesma equipe):
- Alunos, Métodos, Professores, Lançamentos, Relatórios

## Aplicar (passo a passo)
1) Supabase: execute o SQL
   - arquivo: supabase/gem_collab_org.sql

2) No seu projeto Maestro, copie/cole os arquivos deste ZIP por cima (mantendo os caminhos):
   - src/context/AuthContext.js
   - src/services/org.js
   - src/screens/SettingsScreen.js
   - docs/COLLAB_SETUP.md
   - .env.example

3) Reinicie:
   npx expo start -c

4) Rebuild do APK/AAB (para todos usarem a mesma versão):
   eas build -p android --profile preview

## Como funciona
- Organização GEM com código GEMVGS-2026
- Auto-join: ao entrar no app, o usuário é colocado na organização automaticamente
- Configurações → Equipe mostra a org e permite entrar manualmente (se precisar)
