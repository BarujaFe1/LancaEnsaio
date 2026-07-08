# Portfolio Handoff — LançaEnsaio (Expo Web Demo)

> Documento oficial de entrega do deploy web do app LançaEnsaio,
> criado para inclusão no portfólio pessoal de Felipe Alirio Baruja.

---

## 1. Identificação do Projeto

| Campo | Valor |
|---|---|
| **Nome oficial** | LançaEnsaio |
| **Tipo de projeto** | Mobile Web — Aplicação React Native/Expo compilada para web estática |
| **Objetivo principal** | Substituir fichas físicas de ensaio musical por um app de lançamento rápido, padronizado e rastreável, com modo demonstração funcional no navegador |
| **Status atual** | ✅ Publicado e funcional |
| **URL de produção (demo)** | [https://lancaensaio.vercel.app](https://lancaensaio.vercel.app) |
| **Repositório** | [https://github.com/BarujaFe1/LancaEnsaio](https://github.com/BarujaFe1/LancaEnsaio) |
| **Branch do deploy** | `feat/vercel-site` |
| **Contexto de criação** | Projeto originalmente desenvolvido como app mobile (APK) com backend Supabase + Google Sheets. Esta versão adapta o app para web estática (Expo Web) com modo demonstração autossuficiente, dispensando backend externo, para que recrutadores possam testar o fluxo completo no navegador sem configuração. |

---

## 2. Resumo Executivo

O LançaEnsaio é um aplicativo mobile que padroniza o registro de ensaios e escalas musicais — originalmente usava fichas físicas que se perdiam ou atrasavam. O app guia o usuário por um formulário com campos obrigatórios (cidade, nome do lançador, tipo Irmãos/Irmãs) e opcionais (instrumento, ministério, cargo musical), envia os dados para o Google Sheets via Supabase Edge Functions e exibe um comprovante com auditoria.

**O que este deploy web entrega:** Uma versão do app que roda inteiramente no navegador, **sem backend**. O modo demonstração simula o servidor: fornece dados mockados de cidades, instrumentos, ministérios e cargos musicais; processa o lançamento gerando ID e comprovante localmente; persiste o histórico no AsyncStorage. O recrutador experimenta o fluxo guiado completo — setup, lançamento, comprovante e alerta — sem instalar nada, sem configurar ambiente, sem expor secrets de produção.

**Público-alvo:** Recrutadores, gerentes de produto e avaliadores técnicos que precisam validar a qualidade do app sem acessar infraestrutura real.

**Proposta de valor:** Demonstra competência em React Native, Expo, TypeScript, integração com Supabase, adaptação multiplataforma (APK → Web) e capacidade de criar modo demo funcional com persistência local — tudo com entrega contínua via Vercel.

**Por que merece entrar no portfólio:** É o único projeto do portfólio que existe em duas plataformas (Android e Web), foi construído com arquitetura serverless real (Edge Functions), e teve seu deploy web resolvendo um problema concreto de portfólio: "como demonstrar um app mobile sem publicar na Play Store?".

---

## 3. O que Foi Construído

### 3.1 Páginas e Fluxos

| Rota | Tela | Função |
|---|---|---|
| `/setup` | SetupScreen | Captura nome do lançador e tipo (Irmãos / Irmãs). Redireciona para tabs após salvar. |
| `/` (tabs/index) | LaunchScreen | Formulário de lançamento: seleção de cidade (obrigatória), categoria, instrumento, ministério, cargo musical. Botão "Lançar Agora". Exibe comprovante após envio. Modo alerta para adicionar observação ao último registro. |
| `/settings` (tabs/settings) | SettingsScreen | Edita nome, alterna modo Irmãos/Irmãs, exibe status do backend (demo ou real), limpa preferências locais. |

### 3.2 Componentes Criados

- **`WebSiteHeader`** (`src/components/WebSiteHeader.tsx`): Barra superior exibida apenas em web com:
  - Nome "LançaEnsaio"
  - Badges: `React Native`, `Expo`, `Supabase`, `TypeScript`
  - Badge amarelo `Demo`
  - Link "← Portfólio" → perfil GitHub do autor
  - Link "GitHub ↗" → repositório do projeto
  - Links externos via `Linking.openURL`

### 3.3 Camada de Backend Abstraída

- **`src/backend.ts`**: Novo módulo que centraliza toda comunicação com backend:
  - `isDemo()` → `true` quando `EXPO_PUBLIC_API_URL` vazio ou `EXPO_PUBLIC_DEMO=true`
  - `getConfig()` → retorna dados mockados (cidades, instrumentos, ministerios, cargos) em demo; ou chama `api.get('/config')` em produção
  - `enviarRegistro(payload)` → em demo: gera ID único, cria comprovante com timestamp, persiste no AsyncStorage (log local), retorna comprovante; em produção: chama `api.post('/registros')`
  - `enviarAlerta(params)` → em demo: atualiza registro no log local; em produção: chama `api.post('/registros/alerta')`

### 3.4 Modo Demonstração

| Aspecto | Comportamento Demo |
|---|---|
| **Config** | 40+ cidades (do arquivo `cidades.ts`), 4 categorias de instrumentos (Cordas/Sopros/Percussão/Teclas) com subitens, 5 ministérios, 5 cargos musicais |
| **Registro** | Gera ID no formato `ENS-AAAA-NNNN`, horário via `formatDeviceTimestamp()`, cidade/instrumento/ministério/cargo do formulário. Persiste em AsyncStorage chave `@ensaio/demo_log_v1` (até 50 registros). |
| **Comprovante** | Exibe ID, horário, cidade, instrumento, ministério, cargo, auditoria "Lançado por [nome] (modo demo)" |
| **Alerta** | Adiciona campo `alerta` ao registro no log local |
| **Settings** | Mostra "Modo Demo (sem backend) — dados simulados" no lugar do endpoint |

### 3.5 Navegação

- Expo Router com grupos `(tabs)` para navegação por abas
- Stack principal com telas `setup` e `(tabs)`
- Redirecionamento automático: sem preferências → `/setup`; com preferências → `/(tabs)`
- Suporte a SPA (client-side routing) via rewrite no Vercel

### 3.6 Estados Visuais

- Loading: tela com ActivityIndicator verde (#34C759) e texto "Carregando..."
- Refresh: pull-to-refresh na LaunchScreen
- Erro: Alert nativo em caso de falha de carregamento
- Enviando: botão desabilitado com ActivityIndicator
- Sucesso: Alert com confirmação + comprovante em card verde
- Vazio: Picker com opção "Selecione..." ou "Nenhum"

### 3.7 Responsividade

- Layout otimizado para mobile (viewport dedicado)
- ScrollView para formulários longos
- KeyboardAvoidingView para entrada de texto
- Funciona em desktop (janela redimensionada mantém proporção do app mobile)

---

## 4. Como Foi Construído

### 4.1 Arquitetura Geral

```
┌─────────────────────────────────────────────┐
│                  Vercel                      │
│  ┌───────────┐  ┌───────────────────────┐  │
│  │  Static    │  │  SPA Rewrite          │  │
│  │  dist/     │  │  /* → /index.html      │  │
│  └───────────┘  └───────────────────────┘  │
└──────────────────┬─────────────────────────┘
                   │
┌──────────────────▼─────────────────────────┐
│            Expo Web App                      │
│  ┌────────────┐  ┌──────────────────────┐  │
│  │ Expo Router │  │  React Native Web    │  │
│  │ (file-based)│  │  (react-dom)         │  │
│  └────────────┘  └──────────────────────┘  │
│  ┌────────────┐  ┌──────────────────────┐  │
│  │  backend.ts │  │  AsyncStorage (web)  │  │
│  │  (demo)    │  │  (localStorage shim) │  │
│  └────────────┘  └──────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  CityPicker / Picker / WebSiteHeader │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 4.2 Stack Completa

| Categoria | Tecnologia | Versão |
|---|---|---|
| **Linguagem** | TypeScript | ~5.9 |
| **Framework Mobile** | React Native | 0.81 |
| **Framework Expo** | Expo SDK | ~54.0 |
| **Roteamento** | Expo Router | ~6.0 |
| **Web Render** | React Native Web | ~0.21 |
| **Web Runtime** | react-dom | 19.1 |
| **Animações** | react-native-reanimated | ~4.1 |
| **Picker** | @react-native-picker/picker | 2.11 |
| **Persistência** | @react-native-async-storage/async-storage | 2.2 |
| **Estado global** | Zustand | ~5.0 |
| **Ícones** | @expo/vector-icons | ~15.0 |
| **NetInfo / Haptics** | @react-native-community/netinfo, expo-haptics | — |
| **Build estático** | `npx expo export --platform web` | — |
| **Hospedagem** | Vercel (static + SPA rewrite) | — |

### 4.3 Organização do Código

```
mobile/
├── app/                        # Expo Router (file-based routes)
│   ├── _layout.tsx              # Root layout + WebSiteHeader injection
│   ├── index.tsx                # Redireciona para /(tabs)
│   ├── setup.tsx                # Tela de configuração inicial
│   ├── modal.tsx                # Modal placeholder
│   └── (tabs)/
│       ├── _layout.tsx          # Layout com abas (Lançar / Config)
│       ├── index.tsx            # Tela principal de lançamento
│       └── settings.tsx         # Tela de configurações
├── src/
│   ├── api.ts                   # Axios instance (mantida para modo real)
│   ├── backend.ts               # ★ Novo: abstração demo/real
│   ├── session.ts               # Gerenciamento de preferências (AsyncStorage)
│   ├── constants/
│   │   └── cidades.ts           # Lista fixa de cidades/grupos
│   ├── components/
│   │   ├── WebSiteHeader.tsx    # ★ Novo: header padrão web
│   │   ├── AppHeader.tsx        # Header reutilizável
│   │   └── CityPickerModal.tsx  # Modal de seleção de cidade
│   ├── storage/
│   │   └── form-storage.ts      # Persistência de rascunho
│   ├── theme/
│   │   └── index.ts             # Tokens de design
│   └── utils/
│       ├── date.ts              # formatDeviceTimestamp()
│       ├── form-state.ts        # Tipos e limpeza de formulário
│       └── logger.ts            # Logger com __DEV__
├── web/                         # (opcional) template HTML customizado
├── dist/                        # Build estático (gitignored)
├── app.json                     # Config Expo
├── package.json
├── eas.json
└── tsconfig.json
vercel.json                      # ★ Novo: config de deploy
```

### 4.4 Estratégia de UI/UX

- **Dark mode nativo**: fundo #0F1115, cards #1A1D25, verde #34C759 como cor de ação
- **Design system consistente**: cantos arredondados (14px), sombras sutis, tipografia bold
- **Picker estilizado**: fundo escuro com borda verde translúcida, dropdownIconColor customizado
- **Feedback imediato**: Alert nativo para sucesso/erro, loading states, desabilitação de botão durante envio
- **Comprovante destacado**: card com borda verde e ícone de checklist, exibindo campos lado a lado

### 4.5 Decisões de Design

| Decisão | Justificativa |
|---|---|
| **Usar `npx expo export --platform web` em vez de `expo export:web`** | O Expo SDK 54 usa Metro bundler (não Webpack) para web; `export:web` requer webpack e falha |
| **Auto-detecção de demo via `EXPO_PUBLIC_API_URL` vazio** | Elimina necessidade de configurar env vars no Vercel; deploy funciona sem secrets |
| **Persistência local em AsyncStorage** | Simula "grava localmente" conforme requisito; mantém histórico de demonstração entre recargas |
| **WebSiteHeader condicional (Platform.OS === 'web')** | Código não impacta build nativo; header só aparece quando relevante |
| **Refatoração em backend.ts** | Isola lógica de demo do código de UI; mantém compatibilidade com modo real (basta setar EXPO_PUBLIC_API_URL) |
| **vercel.json com buildCommand customizado** | Evita problemas de detecção automática de framework (Vercel não reconhece Expo nativamente) |

---

## 5. Onde Foi Construído e Publicado

| Aspecto | Detalhe |
|---|---|
| **Desenvolvimento** | Local (Windows, Node 24, npm 11) |
| **Build** | `cd mobile && npx expo export --platform web` → `mobile/dist/` |
| **Teste de build** | Local, verificado com curl (index.html, JS bundle, assets) |
| **Hospedagem** | Vercel (plano Hobby, static deployment) |
| **Projeto Vercel** | `lancaensaio` (team `barujafe1s-projects`) |
| **URL de produção** | [https://lancaensaio.vercel.app](https://lancaensaio.vercel.app) |
| **Deploy** | Manual via `vercel --prod --yes` (também disponível via CI/CD se push for feito) |
| **Build remote** | Vercel build machine (iad1, 2 vCPU, 8 GB) |
| **Tempo de build** | ~52 segundos |
| **Ambiente** | Production |
| **Status** | ✅ Ativo, 200 OK, SPA rewrite funcional |

---

## 6. Funcionalidades Principais

1. **Setup personalizado** — Usuário informa nome e escolhe modo (Irmãos / Irmãs). Preferências persistem localmente entre sessões.
2. **Seleção de cidade** — Picker com dezenas de cidades e bairros de Ribeirão Preto e região. Campo obrigatório validado antes do envio.
3. **Classificação musical** — Seleção encadeada: Categoria → Instrumento (apenas para Irmãos), Ministério, Cargo Musical. Adapta campos conforme o tipo escolhido.
4. **Lançamento com comprovante** — Ao enviar, exibe card verde com ID único, horário, cidade, instrumento, ministério, cargo e auditoria. Simula fluxo real de confirmação.
5. **Alerta em lote** — Permite adicionar observação textual ao último lançamento. Útil para registrar imprevistos ou instruções.
6. **Modo demonstração autossuficiente** — Funciona sem backend. Dados mockados, persistência local, nenhuma configuração necessária.
7. **Header web profissional** — Na versão web, exibe barra superior com badges de tecnologia, links para portfólio e GitHub, e badge "Demo" destacado.
8. **Configurações** — Alterna entre Irmãos/Irmãs, edita nome do lançador, visualiza status do backend, limpa dados locais.

---

## 7. Fluxo de Uso (Experiência do Usuário)

```
1. ACESSO
   └── Usuário abre https://lancaensaio.vercel.app

2. SETUP (primeira vez)
   └── Tela escura com campos:
       ├── "Como você se chama?" → digita nome
       └── "O que você vai lançar hoje?" → escolhe Irmãos ou Irmãs
       └── Botão "Começar"

3. TELA PRINCIPAL — LANÇAR
   ├── Header: "Olá, [nome]" + badge último ID
   ├── Seletor Irmãos/Irmãs (alterna sem perder contexto)
   ├── Formulário:
   │   ├── Cidade * (Picker obrigatório)
   │   ├── Categoria (só Irmãos: Cordas/Sopros/Percussão/Teclas)
   │   ├── Instrumento (só Irmãos + categoria selecionada)
   │   ├── Ministério (só Irmãos)
   │   └── Música / Cargo Musical (Picker)
   ├── Botão "Lançar Agora →"
   ├── Validação: cidade obrigatória → Alert se vazia
   └── Sucesso: Alert "✔ Lançamento Registrado" + card comprovante

4. COMPROVANTE
   ├── ID: ENS-2026-XXXX
   ├── Horário: HH:mm - dd/MM/yyyy
   ├── Cidade, Instrumento, Ministério, Cargo
   └── Auditoria: "Lançado por [nome] (modo demo)"

5. ALERTA (opcional)
   └── Botão "⚠ Adicionar Alerta ao ID"
       ├── TextArea para observação
       └── Botão "Enviar Alerta" / "Cancelar"

6. CONFIGURAÇÕES (aba Config)
   ├── Editar nome do lançador
   ├── Alternar Irmãos/Irmãs
   ├── Status: "Modo Demo (sem backend) — dados simulados"
   └── Botão "Limpar Preferências Locais" → volta ao setup
```

---

## 8. Stack Técnica

### Frontend

| Tecnologia | Função |
|---|---|
| **TypeScript** | Linguagem principal, tipos estáticos |
| **React Native 0.81** | Framework mobile multiplataforma |
| **Expo SDK 54** | Toolchain, build, gestão de dependências |
| **Expo Router ~6.0** | Roteamento baseado em arquivos (file-based) |
| **React Native Web ~0.21** | Renderização web via react-dom |
| **@react-native-picker/picker** | Componente de seleção (Picker) |
| **@react-native-async-storage/async-storage** | Persistência local (web: localStorage shim) |
| **@expo/vector-icons** | Ícones Ionicons na tab bar |
| **react-native-reanimated ~4.1** | Animações performáticas |
| **Zustand ~5.0** | Gerenciamento de estado global |
| **axios** | HTTP client (para modo real) |

### Infraestrutura

| Tecnologia | Função |
|---|---|
| **Vercel** | Hospedagem estática + SPA rewrite + CI/CD |
| **Expo Export** | Build estático para web (`dist/`) |
| **GitHub** | Repositório e versionamento |

### Build e Qualidade

| Ferramenta | Função |
|---|---|
| **TypeScript ~5.9** | Type checking |
| **ESLint (expo-config)** | Linting |
| **Jest + jest-expo** | Testes unitários |

---

## 9. Decisões de Produto e Design

### Por que estruturar como abstração demo/real?

O código original chamava `api.get('/config')` e `api.post('/registros')` diretamente nas telas. Isso impedia o app de funcionar sem backend. A refatoração criou `backend.ts` como única camada de acesso, permitindo:

- Trocar entre demo e real sem alterar código de UI
- Testar o app localmente sem Supabase configurado
- Futuramente adicionar cache, retry, ou fallback sem refatorar telas

### Por que auto-detecção e não flag manual?

Usar `EXPO_PUBLIC_API_URL` vazio como gatilho de demo significa que:

- Qualquer deploy sem env vars entra em demo automaticamente
- Não precisa configurar nada no Vercel
- Se um dia quiser modo real, basta adicionar a env var no dashboard

### Por que manter o código original (api.ts, session.ts)?

Para preservar compatibilidade total com o fluxo de produção. O app continua funcionando como APK com backend real — a camada demo é aditiva.

### Por que header web separado?

`WebSiteHeader` é condicional (`Platform.OS !== 'web'` retorna null). Zero impacto no build nativo. No web, adiciona contexto profissional essencial para recrutadores: badges de tecnologia, links de navegação do portfólio e identificação clara de demo.

---

## 10. Diferenciais para Portfólio

### Competências demonstradas

- **React Native + Expo**: App completo com roteamento, formulários, pickers, persistência e integração com backend
- **Adaptação multiplataforma**: Do APK Android ao site web estático, sem reescrever código (compartilha ~95% do código)
- **TypeScript**: Tipos para config, payloads, preferências e estado
- **Arquitetura limpa**: Separação de responsabilidades (backend.ts), injeção de dependência (isDemo()), componentes reutilizáveis
- **Deploy profissional**: Vercel com build customizado, SPA rewrite, validação de produção
- **Modo demonstração funcional**: Resolve um problema real de portfólio — como mostrar um app mobile sem publicar na loja
- **Documentação técnica**: Este handoff documenta arquitetura, decisões e fluxos

### Por que impressiona recrutadores

1. É um app que **existia só como APK** e foi adaptado para web sem reescrever
2. Tem **modo demo autossuficiente** — o recrutador testa em segundos, sem configurar nada
3. Usa **stack moderna**: Expo SDK 54, Expo Router, TypeScript, React Native Web
4. Está **publicado na Vercel** com build e deploy automatizáveis
5. Tem **header profissional** com badges, links e identidade visual consistente com o portfólio
6. Substituiu **processo analógico** (fichas de papel) por **solução digital** — história de produto real

---

## 11. Limitações Atuais

| Limitação | Impacto | Mitigação |
|---|---|---|
| **Modo demo não persiste entre sessões se localStorage for limpo** | Perde histórico de lançamentos | Dados ficam no AsyncStorage (localStorage no web); esperado para demo |
| **Picker do @react-native-picker/picker no web tem aparência nativa do SO** | Visual pode destoar em alguns navegadores | Funcionalidade intacta; para portfólio é aceitável |
| **Sem lazy loading do bundle JS** | Bundle único de ~1.58 MB, impacto em redes lentas | Expo export não code-splits por rota; melhoria futura |
| **Não há SSR/SEO** | Indexadores não veem conteúdo além do shell | App é SPA com client-side rendering; suficiente para portfólio |
| **Requer JavaScript** | Noscript mostra aviso padrão | Esperado para SPA Expo |

---

## 12. Próximos Passos Possíveis

- Substituir Picker nativo por Select customizado com search (web)
- Adicionar lazy loading / code splitting para rotas
- Implementar modo real com Supabase (basta setar `EXPO_PUBLIC_API_URL`)
- Adicionar dark mode toggle (já tem dark mode fixo)
- Adicionar tela de histórico de lançamentos com filtros
- Gerar PDF do comprovante
- Service Worker para PWA e instalação

---

## 13. Metadados Prontos para Portfólio

| Campo | Valor |
|---|---|
| **Nome do projeto** | LançaEnsaio |
| **Subtítulo** | Registro padronizado de ensaios musicais — App Mobile + Web Demo |
| **Descrição curta** | App mobile que substitui fichas físicas de ensaio por lançamento rápido e rastreável, com modo demonstração funcional no navegador. |
| **Descrição média** | App mobile construído com React Native e Expo que padroniza o registro de ensaios musicais. A versão web demo dispensa backend, simulando todo o fluxo de configuração, lançamento, comprovante e alerta diretamente no navegador. Deploy estático na Vercel com SPA rewrite. |
| **Descrição longa** | O LançaEnsaio foi criado para resolver o problema real de fichas físicas de ensaio que se perdiam ou atrasavam — substituindo por um app mobile de lançamento guiado com dados enviados em tempo real para Google Sheets via Supabase Edge Functions. Para este deploy web, adaptei o app existente para Expo Web, criei um modo demonstração completo (dados mockados, persistência local, geração de ID e comprovante), adicionei header profissional com badges de tecnologia e links para portfólio/GitHub, e publiquei na Vercel com build automatizado e rewrite SPA. O recrutador testa o fluxo guiado completo sem instalar nada. |
| **Tecnologias** | TypeScript, React Native, Expo, Supabase, AsyncStorage, Vercel |
| **Categoria** | Mobile Web / Demo |
| **Status** | Publicado |
| **Link de demo** | [https://lancaensaio.vercel.app](https://lancaensaio.vercel.app) |
| **Link de repositório** | [https://github.com/BarujaFe1/LancaEnsaio](https://github.com/BarujaFe1/LancaEnsaio) |
| **Destaque principal** | App mobile adaptado para web com modo demonstração autossuficiente, sem backend, deploy na Vercel |
| **Bullets de impacto** | • Substituiu fichas físicas que se perdiam ou atrasavam — fluxo digital rastreável • Adaptado de APK Android para web estática sem reescrever (~95% de código compartilhado) • Modo demo funcional com dados mockados, persistência local (AsyncStorage) e comprovante • Publicado na Vercel com build customizado (`expo export --platform web`) e SPA rewrite |
| **Tags** | `react-native` `expo` `typescript` `supabase` `vercel` `mobile-web` `demo` |

---

## 14. Sugestão de Card para Portfólio

```
┌─────────────────────────────────────────────────────────┐
│ ● Em produção                                           │
│                                                         │
│ ### LançaEnsaio                                         │
│                                                         │
│ App mobile que substitui fichas físicas de ensaio        │
│ musical por lançamento rápido e rastreável. Versão       │
│ web demo testável no navegador, sem backend.            │
│                                                         │
│ - Substituiu fichas físicas que se perdiam ou atrasavam │
│ - Adaptado de APK para web (~95% de código compartilhado│
│ - Modo demo autossuficiente com persistência local      │
│ - Publicado na Vercel com build e SPA rewrite           │
│                                                         │
│ `TypeScript` `React Native` `Expo` `Supabase` `Vercel`  │
│                                                         │
│ [Abrir demo →] [GitHub ↗]                              │
└─────────────────────────────────────────────────────────┘
```

---

## 15. Sugestão de Texto para Página / Case Study

> **LançaEnsaio: do papel ao app — e do APK ao navegador**
>
> Toda sexta-feira, fichas físicas de ensaio se perdiam, caligrafias ilegíveis atrasavam conferências e dados chegavam duas semanas depois. O LançaEnsaio nasceu para resolver isso: um app mobile que padroniza o lançamento de ensaios musicais com campos obrigatórios, seleção encadeada de instrumentos e envio em tempo real para Google Sheets via Supabase Edge Functions.
>
> **O desafio do portfólio:** Como mostrar um app mobile que só existia como APK Android para recrutadores que usam desktop? A resposta foi adaptar o app para Expo Web, criando um modo demonstração que simula o backend inteiro — dados mockados, persistência local, geração de ID e comprovante — sem precisar de configuração ou secrets.
>
> **O resultado:** Um site web estático publicado na Vercel que entrega o fluxo guiado completo (setup → lançamento → comprovante → alerta) em segundos. O recrutador testa sem instalar nada, sem configurar ambiente, sem expor infraestrutura real. O código compartilha ~95% com o app Android original — mesma stack, mesma experiência, plataforma diferente.

---

## Apêndice: Comandos de Deploy

```bash
# Build local
cd mobile && npm install && npx expo export --platform web

# Deploy na Vercel (primeira vez)
vercel link --project lancaensaio --yes
vercel --prod --yes

# Deploy via git push (após link)
git push -u origin feat/vercel-site
```

---
