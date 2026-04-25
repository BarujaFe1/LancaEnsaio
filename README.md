# 🎵 LançaEnsaio

> Sistema unificado para lançamento de ensaios de Irmãos e Irmãs da Orquestra

[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=flat&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Edge%20Functions-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-barujafe-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/barujafe/)
[![GitHub](https://img.shields.io/badge/GitHub-BarujaFe1-181717?style=flat&logo=github)](https://github.com/BarujaFe1)

<p align="center">
  <a href="https://github.com/BarujaFe1/LancaEnsaio">Repositório</a> •
  <a href="https://github.com/BarujaFe1">GitHub</a> •
  <a href="https://www.linkedin.com/in/barujafe/">LinkedIn</a> •
  <a href="docs/">Documentação</a> •
  <a href="https://github.com/BarujaFe1/LancaEnsaio/issues">Issues</a>
</p>

---

## 📱 Screenshots

<p align="center">
  <img src="docs/screenshots/irmaos.png" alt="Modo Irmãos" width="250"/>
  <img src="docs/screenshots/irmas.png" alt="Modo Irmãs" width="250"/>
  <img src="docs/screenshots/lancamento.png" alt="Lançamento Realizado" width="250"/>
</p>

<p align="center">
  <img src="docs/screenshots/setup.png" alt="Tela de Setup" width="250"/>
  <img src="docs/screenshots/configuracoes.png" alt="Configurações" width="250"/>
</p>

---

## 📦 Demo

**[⬇️ Download APK v1.0.0](https://github.com/BarujaFe1/LancaEnsaio/releases/latest)**

Baixe o APK e instale diretamente no seu Android. Não é necessário Expo Go.

---

## 📱 Sobre o Projeto

**LançaEnsaio** é um aplicativo mobile moderno e elegante para registro de presença em ensaios musicais. Desenvolvido com foco em simplicidade e usabilidade, permite que músicos e cantores registrem sua participação de forma rápida e intuitiva.

### ✨ Características

- 🎨 **Design Premium** — Interface escura moderna com tipografia refinada
- 🔄 **Modo Unificado** — Suporte para Irmãos e Irmãs no mesmo app
- ⚡ **Fluxo Simplificado** — Identificação rápida e lançamento direto
- 📊 **Integração Google Sheets** — Dados sincronizados em tempo real via Sheets API v4
- 🌐 **Backend Serverless** — Supabase Edge Functions (Deno)
- 📱 **Experiência Mobile** — Feito para uso prático no dia a dia
- 🔒 **Sem Autenticação** — Identificação simples por nome

---

## 🎯 Funcionalidades

### Para Irmãos
- ✅ Seleção de categoria (Cordas, Metais, Madeiras, Teclas)
- ✅ Escolha de instrumento específico
- ✅ Registro de ministério e cargo musical
- ✅ Lançamento com ID único
- ✅ Padrão "Cantor" quando não seleciona instrumento/cargo

### Para Irmãs
- ✅ Registro simplificado (sem ministério)
- ✅ Seleção de cargo musical (Organista, Instrutora, Examinadora)
- ✅ Lançamento com ID único
- ✅ Fluxo adaptado ao modo selecionado
- ✅ Padrão "Cantora" quando não seleciona cargo

### Recursos Gerais
- ⚠️ Sistema de alertas para registros existentes
- 🔄 Troca rápida entre modos (Irmãos / Irmãs)
- 📍 Seleção de cidade/congregação
- 💾 Persistência de preferências locais
- 🎨 Interface adaptativa por modo
- 📋 Comprovante visual do último lançamento

---

## 🚀 Começando

### Opção 1: Download Direto do APK (Recomendado)

**[⬇️ Download APK v1.0.0](https://github.com/BarujaFe1/LancaEnsaio/releases/latest)**

1. Baixe o APK no link acima
2. Instale no seu Android (habilite "Instalar de fontes desconhecidas" se necessário)
3. Abra o app e faça o setup inicial
4. Pronto para usar!

### Opção 2: Instalação via Expo Go (Desenvolvimento)

#### Pré-requisitos
- Node.js 18+ instalado
- Expo Go no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS](https://apps.apple.com/app/expo-go/id982107779))
- Celular e computador na mesma rede Wi-Fi

#### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/BarujaFe1/LancaEnsaio.git

# 2. Acesse a pasta do projeto
cd LancaEnsaio/mobile

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# 5. Inicie o app
npx expo start
```

#### Primeiro Uso

1. Instale o **Expo Go** no celular
2. Execute o projeto: `npx expo start`
3. Escaneie o QR Code com o Expo Go
4. Na tela de setup:
   - Digite seu nome
   - Escolha o modo (Irmãos ou Irmãs)
   - Clique em **Salvar e Continuar**
5. Pronto! Comece a lançar ensaios.

---

## 🏗️ Arquitetura

```text
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
         │ Google Sheets API v4
         ▼
┌─────────────────┐
│ Google Sheets   │  Base Geral + Dados Geral
│   (Database)    │  Configurações + Registros
└─────────────────┘
```

### Stack Tecnológica

**Frontend**
- React Native 0.81
- Expo 54
- TypeScript 5.9
- Expo Router
- AsyncStorage
- Zustand

**Backend**
- Supabase Edge Functions
- Deno Runtime
- Google Sheets API v4
- Service Account Auth

**Infraestrutura**
- Supabase
- Google Cloud
- GitHub

---

## 🎨 Design System

### Paleta de Cores

```css
/* Background */
--bg-primary: #0A0B0E;
--bg-card: #1A1D25;
--bg-field: #0F1115;

/* Ações */
--primary: #34C759;
--warning: #FF9500;

/* Texto */
--text-primary: #FFFFFF;
--text-secondary: #9CA3AF;
--text-label: #E5E7EB;
```

### Tipografia

- **Nome do usuário**: 28pt, weight 900
- **Títulos de card**: 20pt, weight 800
- **Labels**: 13pt, weight 700, uppercase
- **Botões**: 17pt, weight 900

---

## 📦 Estrutura do Projeto

```text
LancaEnsaio/
├── mobile/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx
│   │   │   └── settings.tsx
│   │   ├── setup.tsx
│   │   └── _layout.tsx
│   ├── src/
│   │   ├── api.ts
│   │   └── session.ts
│   ├── assets/
│   ├── .env
│   ├── app.json
│   └── package.json
├── supabase/
│   ├── functions/
│   │   └── api/
│   └── config.toml
├── docs/
│   └── screenshots/
├── COMECE_AQUI.md
└── README.md
```

---

## 🔧 Configuração

### Variáveis de Ambiente

Crie o arquivo `mobile/.env` baseado no `.env.example`:

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

### Método 1: Build na Nuvem (Recomendado)

```bash
cd mobile
npx eas build --platform android --profile preview
```

### Método 2: Build Local

```bash
cd mobile
npx eas build --platform android --profile preview --local
```

**Nota:** O build na nuvem do EAS é gratuito e leva ~10-15 minutos.

Veja também: [COMO_GERAR_APK.md](COMO_GERAR_APK.md)

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
npx tsc --noEmit
npm run lint
```

---

## 📊 Endpoints da API

### GET /health

```bash
curl https://PROJECT_REF.supabase.co/functions/v1/api/health
```

### GET /config

```bash
curl https://PROJECT_REF.supabase.co/functions/v1/api/config
```

### POST /registros

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
Configurações do sistema: instrumentos, cidades, ministérios e cargos.

### Aba "Dados Geral"
Registros de lançamentos nas colunas A-H.

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

Contribuições são bem-vindas.

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m "feat: minha feature"`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

### Padrão de commits

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` documentação
- `style:` formatação
- `refactor:` refatoração
- `test:` testes
- `chore:` manutenção

---

## 👨‍💻 Autor

**Felipe Alirio Baruja**

- GitHub: [@BarujaFe1](https://github.com/BarujaFe1)
- LinkedIn: [linkedin.com/in/barujafe](https://www.linkedin.com/in/barujafe/)
- Repositório do projeto: [LancaEnsaio](https://github.com/BarujaFe1/LancaEnsaio)

---

## 📞 Suporte

Para dúvidas, melhorias ou problemas:

1. Consulte a [documentação](docs/)
2. Abra uma [issue](https://github.com/BarujaFe1/LancaEnsaio/issues)
3. Acompanhe meu perfil no [LinkedIn](https://www.linkedin.com/in/barujafe/)
4. Veja outros projetos no [GitHub](https://github.com/BarujaFe1)

---

## 📝 Licença

Este projeto é de uso interno da organização.

---

<div align="center">

Desenvolvido por **Felipe Alirio Baruja**

<a href="https://github.com/BarujaFe1">GitHub</a> •
<a href="https://www.linkedin.com/in/barujafe/">LinkedIn</a> •
<a href="https://github.com/BarujaFe1/LancaEnsaio">Repositório</a>

<br /><br />

**Feito com ❤️ para a Orquestra**

[⬆ Voltar ao topo](#-lançaensaio)

</div>
