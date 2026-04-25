# Instruções de Deploy

## Status Atual

✅ Secrets configurados no Supabase:
- `ORQUESTRA_SHEET_ID` = `1GJobCp4fIBOysVTvNWULcVeRUQYXVrY8gkQgBkUcHsc`
- `GOOGLE_SERVICE_ACCOUNT_B64` = (configurado)

✅ Arquivo `.env` criado em `mobile/.env`:
- `EXPO_PUBLIC_API_URL=https://jzkozhnuyewnjwfgjhaa.supabase.co/functions/v1/api`

✅ Planilha compartilhada com: `backend-orquestra@app-orquestra.iam.gserviceaccount.com`

## Próximo Passo: Deploy da Função

A função Edge precisa ser deployada. Você tem 2 opções:

### Opção 1: Via Dashboard (Mais Fácil)

1. Acesse: https://supabase.com/dashboard/project/jzkozhnuyewnjwfgjhaa/functions
2. Clique na função "api"
3. Clique em "Deploy new version"
4. Faça upload do arquivo: `C:\dev\LancaEnsaio\supabase\functions\api\index.ts`
5. Clique em "Deploy"

### Opção 2: Via CLI (Recomendado)

Instale o Supabase CLI via Scoop ou Chocolatey:

```powershell
# Via Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Ou via Chocolatey
choco install supabase
```

Depois faça login e deploy:

```powershell
cd C:\dev\LancaEnsaio
supabase login
supabase link --project-ref jzkozhnuyewnjwfgjhaa
supabase functions deploy api --no-verify-jwt
```

## Testar o App

Depois do deploy:

```powershell
cd C:\dev\LancaEnsaio\mobile
npx expo start
```

Abra o Expo Go no celular e escaneie o QR Code.
