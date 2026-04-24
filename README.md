# 🎵 LançaEnsaio

> Sistema unificado para lançamento de ensaios de Irmãos e Irmãs da Orquestra

[![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?style=flat&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=flat&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Edge%20Functions-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)

---

## 📱 Sobre o Projeto

**LançaEnsaio** é um aplicativo mobile moderno e elegante para registro de presença em ensaios musicais. Desenvolvido com foco em simplicidade e usabilidade, permite que músicos e cantores registrem sua participação de forma rápida e intuitiva.

### ✨ Características

- 🎨 **Design Premium** - Interface escura moderna com tipografia refinada
- 🔄 **Modo Unificado** - Suporte para Irmãos e Irmãs no mesmo app
- ⚡ **Sem Login** - Identificação simples por nome
- 📊 **Integração Google Sheets** - Dados sincronizados em tempo real
- 🌐 **Backend Serverless** - Supabase Edge Functions
- 📱 **Offline-First** - Funciona sem internet (em breve)

---

## 🎯 Funcionalidades

### Para Irmãos
- ✅ Seleção de categoria (Cordas, Metais, Madeiras, Teclas)
- ✅ Escolha de instrumento específico
- ✅ Registro de ministério e cargo musical
- ✅ Lançamento com ID único (formato: MXXX1234)

### Para Irmãs
- ✅ Registro simplificado (sem instrumento)
- ✅ Seleção de cargo musical (Cantora, Organista, etc)
- ✅ Lançamento com ID único (formato: F1234)

### Recursos Gerais
- ⚠️ Sistema de alertas para registros existentes
- 🔄 Troca rápida entre modos (Irmãos/Irmãs)
- 📍 Seleção de cidade/congregação
- 💾 Persistência de preferências locais
- 🎨 Interface adaptativa por modo

---

## 🚀 Começando

### Pré-requisitos

- Node.js 18+ instalado
- Expo Go no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS](https://apps.apple.com/app/expo-go/id982107779))
- Celular e computador na mesma rede Wi-Fi

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/BarujaFe1/LancaEnsaio.git
cd LancaEnsaio

# 2. Instale as dependências
cd mobile
npm install

# 3. Inicie o app
npx expo start
```

### Primeiro Uso

1. Abra o **Expo Go** no celular
2. Escaneie o QR Code que aparece no terminal
3. Na tela de setup:
   - Digite seu nome
   - Escolha o modo (Irmãos ou Irmãs)
   - Clique em "Salvar e Continuar"
4. Pronto! Comece a lançar ensaios

---

## 📖 Documentação

### Guias Rápidos
- [🚀 Comece Aqui](COMECE_AQUI.md) - Guia de início rápido
- [📱 Teste Manual](TESTE_MANUAL_ATUALIZADO.md) - Roteiro de teste completo
- [📦 Gerar APK](COMO_GERAR_APK.md) - Como gerar APK local
- [🎨 Redesign v2.1](REDESIGN_V2.1.md) - Melhorias visuais

### Documentação Técnica
- [📋 Baseline Confirmada](docs/BASELINE_CONFIRMADA.md) - Evidências técnicas
- [📊 Relatório de Execução](docs/RELATORIO_FINAL_EXECUCAO.md) - Relatório completo
- [🔧 Correções v2.0](docs/RESUMO_CORRECOES_V2.md) - Histórico de correções

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│   Mobile App    │  React Native + Expo
│  (React Native) │  TypeScript
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│ Supabase Edge   │  Deno Runtime
│   Functions     │  TypeScript
└────────┬────────┘
         │
         │ Google Sheets API
         ▼
┌─────────────────┐
│ Google Sheets   │  Base Geral + Dados Geral
│   (Database)    │  Configurações + Registros
└─────────────────┘
```

### Stack Tecnológica

**Frontend**
- React Native 0.76
- Expo 54
- TypeScript 5.3
- Expo Router (navegação)
- AsyncStorage (persistência)

**Backend**
- Supabase Edge Functions
- Deno Runtime
- Google Sheets API v4
- Service Account Auth

**Infraestrutura**
- Supabase (hosting + functions)
- Google Cloud (Sheets API)
- GitHub (versionamento)

---

## 🎨 Design System

### Paleta de Cores

```css
/* Background */
--bg-primary: #0A0B0E;    /* Preto azulado profundo */
--bg-card: #1A1D25;       /* Cinza escuro */
--bg-field: #0F1115;      /* Preto mais escuro */

/* Ações */
--primary: #34C759;       /* Verde vibrante */
--warning: #FF9500;       /* Laranja */

/* Texto */
--text-primary: #FFFFFF;  /* Branco */
--text-secondary: #9CA3AF;/* Cinza */
--text-label: #E5E7EB;    /* Cinza claro */
```

### Tipografia

- **Nome do usuário**: 28pt, weight 900
- **Títulos de card**: 20pt, weight 800
- **Labels**: 13pt, weight 700, uppercase
- **Botões**: 17pt, weight 900

---

## 📦 Estrutura do Projeto

```
LancaEnsaio/
├── mobile/                 # App React Native
│   ├── app/               # Rotas (Expo Router)
│   │   ├── (tabs)/       # Telas com tabs
│   │   │   ├── index.tsx # Tela principal
│   │   │   └── settings.tsx
│   │   ├── setup.tsx     # Setup inicial
│   │   └── _layout.tsx   # Layout raiz
│   ├── src/              # Código fonte
│   │   ├── api.ts        # Cliente HTTP
│   │   └── session.ts    # Gerenciamento de sessão
│   ├── assets/           # Imagens e ícones
│   ├── .env              # Variáveis de ambiente
│   ├── app.json          # Configuração Expo
│   └── package.json      # Dependências
├── supabase/             # Backend
│   ├── functions/        # Edge Functions
│   │   └── api/         # API principal
│   └── config.toml       # Configuração
├── docs/                 # Documentação técnica
├── COMECE_AQUI.md       # Guia de início
└── README.md            # Este arquivo
```

---

## 🔧 Configuração

### Variáveis de Ambiente

Crie o arquivo `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://SEU_PROJECT_REF.supabase.co/functions/v1/api
```

### Secrets do Supabase

```bash
supabase secrets set \
  ORQUESTRA_SHEET_ID="ID_DA_PLANILHA" \
  GOOGLE_SERVICE_ACCOUNT_B64="BASE64_DA_CREDENCIAL"
```

### Deploy do Backend

```bash
cd supabase
supabase functions deploy api --no-verify-jwt
```

---

## 📱 Gerar APK

### Método 1: Build Local (Rápido)

```bash
cd mobile
eas build --platform android --profile local --local
```

### Método 2: Build na Nuvem

```bash
cd mobile
eas build --platform android --profile production
```

Ver [COMO_GERAR_APK.md](COMO_GERAR_APK.md) para instruções completas.

---

## 🧪 Testes

### Teste Manual

```bash
cd mobile
npx expo start
```

Siga o roteiro em [TESTE_MANUAL_ATUALIZADO.md](TESTE_MANUAL_ATUALIZADO.md)

### Validação de Código

```bash
# TypeScript
npx tsc --noEmit

# Lint
npm run lint
```

---

## 📊 Endpoints da API

### GET /health
Status da API

```bash
curl https://PROJECT_REF.supabase.co/functions/v1/api/health
```

### GET /config
Configurações da planilha (instrumentos, cidades, etc)

```bash
curl https://PROJECT_REF.supabase.co/functions/v1/api/config
```

### POST /registros
Criar novo registro

```bash
curl -X POST https://PROJECT_REF.supabase.co/functions/v1/api/registros \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "IRMAOS",
    "nomeLancador": "João Silva",
    "cidade": "Ribeirão - Ipiranga",
    "categoria": "Metais",
    "instrumento": "Trompete",
    "ministerio": "",
    "musicaCargo": "Instrutor"
  }'
```

### POST /registros/alerta
Adicionar alerta a um registro

```bash
curl -X POST https://PROJECT_REF.supabase.co/functions/v1/api/registros/alerta \
  -H "Content-Type: application/json" \
  -d '{
    "id": "MINV1234",
    "aviso": "Texto do alerta",
    "nomeLancador": "João Silva"
  }'
```

---

## 🗂️ Formato da Planilha

### Aba "Base Geral"
Configurações do sistema (instrumentos, cidades, ministérios, cargos)

### Aba "Dados Geral"
Registros de lançamentos (colunas A-H):

| Coluna | Conteúdo | Exemplo |
|--------|----------|---------|
| A | Horário | `18:30 - 24/04/2026` |
| B | ID | `MJOA1234` ou `F1234` |
| C | Categoria | `Metais` ou `-` |
| D | Instrumento | `Trompete` ou `-` |
| E | Cidade | `Ribeirão - Ipiranga` |
| F | Ministério | `Jovens` ou `-` |
| G | Música/Cargo | `Instrutor` |
| H | Auditoria | `META APP=UNIFICADO TIPO=IRMAOS USER=João Silva` |

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adicionar MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Padrão de Commits

Seguimos o [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

---

## 📝 Licença

Este projeto é de uso interno da organização.

---

## 👥 Autores

- **Desenvolvimento** - Sistema autônomo de desenvolvimento
- **Organização** - CCB Orquestra

---

## 🙏 Agradecimentos

- Comunidade Expo
- Equipe Supabase
- Google Sheets API
- Todos os músicos e cantores que utilizam o sistema

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte a [documentação](docs/)
2. Abra uma [issue](https://github.com/BarujaFe1/LancaEnsaio/issues)
3. Entre em contato com o administrador

---

<div align="center">

**Feito com ❤️ para a Orquestra**

[⬆ Voltar ao topo](#-lançaensaio)

</div>
