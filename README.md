# LançaEnsaio - Aplicativo Unificado

Sistema unificado para lançamento de ensaios de Irmãos e Irmãs.

## Arquitetura

- **Backend**: Supabase Edge Function (sem autenticação complexa)
- **Mobile**: Expo/React Native (único app para ambos os fluxos)
- **Planilha**: Google Sheets (Base Geral + Dados Geral)

## Características

- ✅ Sem login tradicional (identificação por nome)
- ✅ Sem sistema de locks (append simples)
- ✅ Suporte para IRMAOS e IRMAS no mesmo app
- ✅ Escolha de tipo na tela inicial
- ✅ Metadado unificado: `META APP=UNIFICADO TIPO={tipo} USER={nome}`

## Deploy

### Backend (Supabase Edge Function)

1. Configurar secrets no Supabase:
```bash
supabase secrets set \
  ORQUESTRA_SHEET_ID="SEU_SHEET_ID" \
  GOOGLE_SERVICE_ACCOUNT_B64="SEU_BASE64"
```

2. Deploy da function:
```bash
supabase functions deploy api --no-verify-jwt
```

3. Testar:
```bash
curl https://SEU_PROJECT_REF.supabase.co/functions/v1/api/health
```

### Mobile (Expo)

1. Instalar dependências:
```bash
cd mobile
npm install
```

2. Configurar `.env`:
```env
EXPO_PUBLIC_API_URL=https://SEU_PROJECT_REF.supabase.co/functions/v1/api
```

3. Rodar localmente:
```bash
npx expo start
```

4. Build APK (EAS):
```bash
eas build -p android --profile production
```

## Endpoints da API

- `GET /health` - Status da API
- `GET /config` - Configurações da planilha (instrumentos, cidades, etc)
- `POST /registros` - Criar novo registro
- `POST /registros/alerta` - Adicionar alerta a um registro existente

## Fluxo do App

1. **Setup Inicial**: Usuário escolhe tipo (IRMAOS/IRMAS) e informa nome
2. **Lançar**: Formulário de lançamento com campos dinâmicos
3. **Alerta**: Adicionar avisos a registros existentes
4. **Configurações**: Editar nome, trocar tipo, limpar preferências

## Projeto Supabase

- **Project Ref**: jzkozhnuyewnjwfgjhaa
- **URL**: https://jzkozhnuyewnjwfgjhaa.supabase.co

## Planilha Google Sheets

### Abas Necessárias

- **Base Geral**: Configurações (instrumentos, cidades, ministérios, cargos)
- **Dados Geral**: Registros de lançamentos (colunas A-H)

### Formato da Coluna H (Auditoria)

```
META APP=UNIFICADO TIPO=IRMAOS USER=NomeDoLancador
```

ou com erro de auditoria:

```
ERRO 01: 🏙️ Falta Cidade | META APP=UNIFICADO TIPO=IRMAS USER=NomeDoLancador
```

## Validação

- ✅ Lint: `npm run lint` (mobile)
- ✅ TypeScript: `npx tsc --noEmit` (mobile)
- ✅ Backend deployado e testado
- ✅ Endpoints funcionais sem autenticação

## Segurança

⚠️ **IMPORTANTE**: Se a service_role_key foi exposta, rotacione imediatamente no Dashboard do Supabase (Settings → API → Roll Key).

## Baseline Confirmada

Ver `BASELINE_CONFIRMADA.md` para detalhes da investigação técnica e evidências de funcionamento.
