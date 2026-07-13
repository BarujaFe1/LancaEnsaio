# Technical Decisions — LançaEnsaio

## 1. Google Sheets como banco operacional

**Decisão:** gravar lançamentos diretamente em Sheets via service account.  
**Por quê:** a operação já vivia em planilha; zero migração de processo para encarregados.  
**Trade-off:** sem RLS relacional, concorrência limitada, schema frágil — aceitável para volume de ensaio regional.

## 2. Supabase Edge Functions (sem Auth de usuário)

**Decisão:** API Deno sem login complexo; identificação explícita por `nomeLancador`.  
**Por quê:** reduzir atrito em campo (abrir app → lançar).  
**Trade-off:** URL da function é superfície de abuso. Mitigações futuras em `SECURITY_NOTES.md`.

## 3. Expo + Expo Router

**Decisão:** app mobile com export web para portfólio.  
**Por quê:** um código para APK e demo no navegador.  
**Trade-off:** pickers/alerts no web são adaptações (`AppPicker`, `notify`).

## 4. Demo mode automático

**Decisão:** se não há `EXPO_PUBLIC_API_URL`, o app simula backend.  
**Por quê:** Vercel/recrutadores não precisam de secrets.  
**Trade-off:** dados demo devem espelhar categorias reais (Cordas/Metais/Madeiras/Teclas).

## 5. Domínio de auditoria extraído + testado

**Decisão:** regras em `mobile/src/domain/auditoria.ts` com espelho na Edge Function.  
**Por quê:** regressões em ERRO 01–05/11 quebram confiança operacional.  
**Trade-off:** dois arquivos precisam permanecer sincronizados (documentado).

## 6. Persistência local leve

**Decisão:** AsyncStorage para prefs, draft, trava cidade e último comprovante.  
**Por quê:** uso em campo com interrupções; não exige fila offline completa.  
**Trade-off:** sem sync de fila offline — lançamento real ainda exige rede.
