# LançaEnsaio - Versão Unificada

Este projeto unifica os fluxos de lançamento de ensaios para **Irmãos** e **Irmãs** em um único aplicativo móvel e um único backend Supabase Edge Function.

## 🚀 Arquitetura Simplificada

- **App Mobile**: Expo / React Native (Expo Router).
- **Backend**: Supabase Edge Function (Deno).
- **Planilha**: Google Sheets (Aba "Base Geral" para config e "Dados Geral" para registros).

## 🛠️ Principais Mudanças

1. **Sem Login Tradicional**: O app identifica o lançador pelo nome informado no setup inicial.
2. **Setup Inicial**: Na primeira abertura, o usuário escolhe o modo (Irmãos/Irmãs) e informa seu nome.
3. **Abas no App**:
   - **Lançar**: Formulário dinâmico baseado no modo selecionado.
   - **Alerta**: Envio de avisos manuais para registros já feitos.
   - **Ajustes**: Troca de modo, edição de nome e limpeza de cache.
4. **Backend Unificado**: A Edge Function `/api` processa ambos os fluxos e grava metadados de auditoria.
5. **Auditoria**: Registra `META APP=UNIFICADO TIPO={TIPO} USER={NOME}` na coluna H.

## 📦 Como Rodar (Mobile)

1. Instale as dependências:
   ```bash
   cd mobile
   npm install
   ```

2. Configure o `.env` com a URL da API:
   ```env
   EXPO_PUBLIC_API_URL=https://SUA-URL-SUPABASE.supabase.co/functions/v1/api
   ```

3. Inicie o app:
   ```bash
   npx expo start
   ```

## ☁️ Backend (Supabase)

O código da Edge Function está em `supabase/functions/api/index.ts`.
Para deploy, utilize a CLI do Supabase:
```bash
supabase functions deploy api
```

Certifique-se de configurar os segredos no Supabase:
- `ORQUESTRA_SHEET_ID`: ID da planilha Google.
- `GOOGLE_SERVICE_ACCOUNT_B64`: JSON da Service Account em Base64.
