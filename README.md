
  <img src="./assets/icon.png" alt="LançaEnsaio Logo" width="120" height="120" />
  <h1>LançaEnsaio</h1>
  <p><strong>Registros de ensaio rápidos, padronizados e auditáveis</strong></p>
>>>>>>> 12bdff861020ff29ec444d80d1c652759931a7b5

  <p>
    <a href="#-sobre-o-projeto">Sobre</a> •
    <a href="#-funcionalidades">Funcionalidades</a> •
<<<<<<< HEAD
    <a href="#-tecnologias-utilizadas">Tecnologias</a> •
    <a href="#-instalação-direta-apk">APK</a> •
    <a href="#-como-executar-o-projeto-para-desenvolvedores">Como executar</a> •
    <a href="#-build-e-publicação">Build</a> •
=======
    <a href="#-arquitetura">Arquitetura</a> •
    <a href="#-como-executar-o-projeto-ambiente-de-desenvolvimento">Como executar</a> •
    <a href="#-build-apk-para-distribuição">Build APK</a> •
>>>>>>> 12bdff861020ff29ec444d80d1c652759931a7b5
    <a href="#-downloads">Downloads</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version 1.0.0" />
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License MIT" />
    <img src="https://img.shields.io/badge/Expo-49.0.0-000020.svg?logo=expo" alt="Expo" />
    <img src="https://img.shields.io/badge/React%20Native-0.72-61DAFB.svg?logo=react" alt="React Native" />
<<<<<<< HEAD
    <img src="https://img.shields.io/badge/Supabase-3.0.0-3ECF8E.svg?logo=supabase" alt="Supabase" />
=======
    <img src="https://img.shields.io/badge/Supabase-3FCF8E.svg?logo=supabase" alt="Supabase" />
>>>>>>> 12bdff861020ff29ec444d80d1c652759931a7b5
  </p>
</div>

---

## 📖 Sobre o projeto

<<<<<<< HEAD
**Maestro** é um aplicativo mobile desenvolvido para o **Grupo de Estudos Musicais (GEM)** de Vargem Grande do Sul. Ele centraliza todo o controle do ensino musical em um único lugar: cadastro de alunos, métodos, professores, lançamentos de aula e acompanhamento de evolução com relatórios e gráficos. Pensado para uso diário dos instrutores, o app oferece uma interface rápida, limpa e sem burocracia, além de permitir o trabalho colaborativo entre toda a equipe.

> “A música é a linguagem universal da humanidade.” — Henry Wadsworth Longfellow
=======
**LançaEnsaio** é um aplicativo mobile desenvolvido para equipes de música que precisam registrar ensaios e escalas de forma rápida, padronizada e com validação automática. Com uma interface simples e guiada, o app permite que os usuários façam lançamentos precisos, evitem erros de digitação e ainda possam alertar sobre correções quando necessário.

O backend roda em **Supabase Edge Functions** e utiliza uma planilha Google Sheets como banco de dados central ("Cérebro"), garantindo que os dados estejam sempre acessíveis e auditáveis.

> Ideal para ministérios de música, bandas, orquestras e grupos que desejam organizar seus registros de ensaio de forma colaborativa e segura.
>>>>>>> 12bdff861020ff29ec444d80d1c652759931a7b5

---

## ✨ Funcionalidades

<<<<<<< HEAD
### 🔐 Login e Acesso
- Login e cadastro por e-mail/senha via Supabase.
- Opção de **entrada como convidado** (útil para testes, quando habilitado).
- Perfil do instrutor com nome e função.

### 📊 Dashboard
- Visão geral do grupo: quantidade de alunos, registros recentes, evolução e alertas.
- Gráficos de crescimento e atividade.

### 👥 Alunos
- Cadastro completo: nome, instrumento, família (cordas/metais/madeiras), graduação, comum/congregação, datas, status e observações.
- Busca e filtros por instrumento, categoria, graduação e status.
- Tela individual do aluno com histórico completo e métricas de progresso.

### 📚 Métodos
- Cadastro de métodos musicais e associação de instrumentos compatíveis.
- Padronização do ensino e organização do conteúdo.

### 🧑‍🏫 Professores / Encarregados
- Cadastro de instrutores e encarregados com nome, instrumento, comum e função.

### 📝 Lançamentos (Registro de Aula)
- Registro com data e hora.
- Suporte a múltiplos itens por aula:
  - **Hinos e coros** (com seleção de vozes: soprano, contralto, tenor, baixo e opção de solfejo).
  - **Páginas e lições** do método.
- Campo de observações técnicas do instrutor.

### 📈 Progresso Musical
- Visualização do que o aluno já realizou:
  - Lista de hinos e coros passados.
  - Métodos e lições concluídas.
- Gráfico indicador de "travamento" (ex.: repetição de lições ao longo do tempo).

### 📑 Relatórios e Exportações
- Relatórios individuais e coletivos.
- Gráficos de evolução (linha, barras).
- Exportação para **PDF**, **Excel** e imagem de gráfico.

### ⚙️ Configurações
- Alternar tema: sistema / claro / escuro.
- Seção "Equipe (uso coletivo)" com informações sobre o GEM.
- Rodapé: “Este aplicativo foi desenvolvido para o Grupo de Estudo Musical de Vargem Grande do Sul.”

### 🐛 Logs
- Tela de logs para capturar erros e facilitar o suporte e diagnóstico.

### 🤝 Uso Coletivo (Diferencial)
- Sistema colaborativo: todos os instrutores compartilham os mesmos dados.
- Organização via **Supabase** com código de acesso (ex.: `GEMVGS-2026`).
- RLS (Row Level Security) por organização.
- Auto-join opcional para entrada automática na equipe.
=======
### 🔐 Autenticação
- Login com usuário e senha validados contra a planilha "Cérebro" (aba `usuarios`).
- Controle de limite de dispositivos por usuário (padrão: 3 dispositivos).
- Token de sessão (Bearer) para chamadas autenticadas.

### ⚙️ Configuração automática
- Após o login, o app baixa as listas atualizadas via endpoint `/config`:
  - Cidades
  - Ministérios
  - Cargos musicais
  - Instrumentos organizados por família (Cordas, Metais, Madeiras, Teclas)

### 📝 Lançamento de registro (Gravar)
- Seleção guiada dos campos (cidade, ministério, cargo, instrumento, etc.).
- Ao tocar em **Gravar** (botão verde), o registro é enviado para a aba `Dados Geral` da planilha:
  - Coluna A: horário do lançamento
  - Coluna B: ID único gerado
  - Coluna H: auditoria automática (se houver regras de validação)
- Exibição do **comprovante do último registro** para conferência rápida.

### ⚠️ Alertar (correção manual)
- Se o usuário perceber que lançou algo errado, toca no botão **Alertar** (amarelo).
- Abre um modal para escrever um aviso manual.
- O backend localiza o registro pelo ID (coluna B) e atualiza a coluna H com:
  ```text
  ALERTA (DD/MM/AAAA HH:MM): texto do usuário

```

### 🧹 Limpar

* Botão que limpa todos os campos do formulário para um novo lançamento.

### 📱 Interface amigável

* Dropdowns com busca integrada para cidades e instrumentos.
* Opção de digitar uma nova cidade (caso não esteja na lista).
* Temas claro/escuro seguindo o sistema (ou configuração manual).

---

## 🧱 Arquitetura

O LançaEnsaio é construído sobre uma arquitetura moderna e escalável:

* **Frontend:** React Native + Expo (com Expo Router para navegação).
* **Backend:** Supabase Edge Functions (Node.js + TypeScript) – endpoints REST.
* **Banco de dados:** Google Sheets (planilha "Cérebro") – fácil visualização e auditoria.
* **Autenticação:** JWT próprio gerado no backend, validado contra a planilha.

### Fluxo de dados

1. O app faz login e recebe um token JWT.
2. Com o token, busca as configurações em `/config`.
3. Ao gravar, envia os dados para `/registros`, que insere uma linha na planilha.
4. Em caso de alerta, o app chama `/registros/alerta` com o ID do registro e a mensagem.

### Segurança

* O token de sessão é armazenado com segurança no AsyncStorage.
* O backend utiliza uma Service Account do Google com acesso apenas à planilha "Cérebro".
* Variáveis sensíveis (Service Account, Sheet ID, JWT secret) são configuradas como secrets no Supabase.
>>>>>>> 12bdff861020ff29ec444d80d1c652759931a7b5

---

## 🚀 Tecnologias utilizadas

<<<<<<< HEAD
- [Expo (managed)](https://expo.dev/) — desenvolvimento rápido e compatível com Expo Go.
- [React Native](https://reactnative.dev/) — base do aplicativo.
- [Supabase](https://supabase.io/) — autenticação, banco de dados e RLS.
- [React Navigation](https://reactnavigation.org/) — navegação entre telas.
- [React Native Paper](https://callstack.github.io/react-native-paper/) — componentes UI e temas.
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) — persistência local.
- [React Native Chart Kit](https://github.com/indiespirit/react-native-chart-kit) — gráficos estatísticos.
- [Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/), [Sharing](https://docs.expo.dev/versions/latest/sdk/sharing/) — exportação de relatórios.
- [EAS Build](https://docs.expo.dev/build/introduction/) — geração de APK e AAB.

---

## 📁 Estrutura de pastas

```text
Maestro/
├── assets/             # Imagens, ícones, splash
│   ├── icon.png
│   ├── splash.png
│   └── ...
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── AlunosScreen.js
│   │   ├── MetodosScreen.js
│   │   ├── ProfessoresScreen.js
│   │   ├── LancesScreen.js
│   │   ├── ProgressoScreen.js
│   │   ├── RelatoriosScreen.js
│   │   ├── ConfiguracoesScreen.js
│   │   └── LogsScreen.js
│   ├── components/
│   │   ├── AlunoCard.js
│   │   ├── GraficoEvolucao.js
│   │   └── ...
│   ├── utils/
│   │   ├── supabase.js # Configuração do Supabase
│   │   ├── auth.js
│   │   ├── database.js
│   │   └── exporters.js
│   ├── context/
│   │   ├── AuthContext.js
│   │   └── TemaContext.js
│   ├── theme.js
│   └── App.js
├── .env                # Variáveis de ambiente (não versionar)
├── .gitignore
├── app.json
├── eas.json
├── package.json
└── README.md

```

---

## 📲 Instalação direta (APK)

A maneira mais rápida de experimentar o **Maestro** é baixar o APK e instalar diretamente no seu celular Android.

1. **Baixe o APK** na seção [Downloads](https://www.google.com/search?q=%23-downloads) abaixo.
2. No seu celular, permita a instalação de apps de fontes desconhecidas (geralmente em *Configurações > Segurança*).
3. Abra o arquivo baixado e clique em **Instalar**.
4. Pronto! Agora é só abrir o app e começar a usar.

> 💡 *O APK é gerado automaticamente a cada nova versão. Você sempre encontrará o link atualizado na seção de downloads.*

---

## ⚙️ Como executar o projeto (para desenvolvedores)

### Pré-requisitos

* Node.js (versão LTS recomendada)
* Expo CLI (`npm install -g expo-cli`) ou use `npx expo`
* Conta no [Supabase](https://supabase.io/) e um projeto configurado
* Um dispositivo físico com **Expo Go** instalado ou um emulador configurado

### Configuração do Supabase

1. Crie um projeto no Supabase.
2. Copie a URL e a Anon Key do projeto.
3. Configure as tabelas e as políticas de RLS conforme a documentação do app.
4. Defina o código de acesso da organização (ex.: `GEMVGS-2026`).

### Passos para rodar localmente

1. Clone o repositório:
```bash
git clone [https://github.com/seu-usuario/Maestro.git](https://github.com/seu-usuario/Maestro.git)
cd Maestro
=======
* [Expo](https://expo.dev/) – desenvolvimento rápido e builds simplificados.
* [React Native](https://reactnative.dev/) – base do aplicativo.
* [Expo Router](https://docs.expo.dev/router/introduction/) – navegação baseada em arquivos.
* [Axios](https://axios-http.com/) – chamadas HTTP para a API.
* [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) – cache local e token.
* [Supabase Edge Functions](https://supabase.com/docs/guides/functions) – backend serverless.
* [Google Sheets API](https://developers.google.com/sheets/api) – planilha como banco de dados.

---

## ⚙️ Como executar o projeto (ambiente de desenvolvimento)

### Pré-requisitos

* Node.js (LTS)
* Expo CLI (`npm install -g expo-cli`) ou use `npx expo`
* Conta no Supabase (para testar com seu próprio backend)
* Aplicativo **Expo Go** instalado no celular (Android/iOS)

### Passos

1. Clone o repositório:
```bash
git clone [https://github.com/seu-usuario/LancaEnsaio.git](https://github.com/seu-usuario/LancaEnsaio.git)
cd LancaEnsaio
>>>>>>> 12bdff861020ff29ec444d80d1c652759931a7b5

```


2. Instale as dependências:
```bash
npm install

```


<<<<<<< HEAD
3. Crie um arquivo `.env` na raiz com as seguintes variáveis:
```env
EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
EXPO_PUBLIC_ORG_JOIN_CODE=codigo_de_acesso
=======
3. Crie um arquivo `.env` na raiz do projeto com a URL da sua Edge Function:
```env
EXPO_PUBLIC_API_URL=https://<seu-projeto>.supabase.co/functions/v1/api
>>>>>>> 12bdff861020ff29ec444d80d1c652759931a7b5

```


4. Inicie o projeto:
```bash
npx expo start -c

```


<<<<<<< HEAD
5. Escaneie o QR Code com o aplicativo Expo Go (Android/iOS) ou pressione `a` para abrir no emulador Android.

---

## 📲 Build e publicação

**Gerar APK (Android) - APENAS APK, SEM AAB**
=======
> Escaneie o QR Code com o Expo Go ou pressione `a` para abrir no emulador Android.


> **Nota:** O backend (Edge Function) precisa estar publicado e configurado com as secrets corretas. Veja a seção *Deploy do Backend* para mais detalhes.



---

## ☁️ Deploy do backend (Supabase Edge Functions)

1. Instale a Supabase CLI e faça login:
```bash
npm install -g supabase
supabase login

```


2. Inicie um projeto local (ou vincule a um projeto remoto):
```bash
supabase init
supabase link --project-ref <seu-project-ref>

```


3. Crie a função `api` (ou use a pasta `supabase/functions/api` já existente).
4. Configure as secrets necessárias:
```bash
supabase secrets set ORQUESTRA_SHEET_ID="ID_DA_SUA_PLANILHA"
supabase secrets set GOOGLE_SERVICE_ACCOUNT_B64="base64_do_json_da_service_account"
supabase secrets set APP_JWT_SECRET="sua_chave_secreta_para_jwt"
supabase secrets set MAX_DEVICES_PER_USER="3"  # opcional
supabase secrets set SESSION_TTL_MS="86400000" # opcional (24h)

```


5. Publique a função:
```bash
supabase functions deploy api --no-verify-jwt

```


*A função estará disponível em:* `https://<seu-projeto>.supabase.co/functions/v1/api`

---

## 📲 Build APK (para distribuição)

O app utiliza **EAS Build** para gerar o APK.
>>>>>>> 12bdff861020ff29ec444d80d1c652759931a7b5

1. Instale o EAS CLI:
```bash
npm install -g eas-cli

```


2. Faça login na sua conta Expo:
```bash
eas login

```


3. Configure o EAS (se ainda não fez):
```bash
eas build:configure

```


<<<<<<< HEAD
4. Para gerar um APK de teste (instalação direta):
```bash
eas build --profile preview --platform android
=======
4. No arquivo `eas.json`, certifique-se de ter um profile para `preview` (APK) e `production` (AAB). Exemplo:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}

```


5. Para gerar um **APK**:
```bash
eas build --platform android --profile preview
>>>>>>> 12bdff861020ff29ec444d80d1c652759931a7b5

```



<<<<<<< HEAD
> **Nota:** O arquivo gerado estará disponível para download no site do Expo ou via link fornecido ao final do build. O projeto atual não gera AAB para Play Store, apenas APK para distribuição direta.
=======
> Ao final, o EAS fornecerá um link para download do APK. Você pode baixar e compartilhar.
> **Dica:** O APK gerado pode ser instalado diretamente em qualquer dispositivo Android.
>>>>>>> 12bdff861020ff29ec444d80d1c652759931a7b5

---

## 📥 Downloads

<<<<<<< HEAD
* **APK (última versão):** [Download Maestro.apk](https://www.google.com/search?q=%23)
* **Slide de apresentação do projeto:** [Ver PDF](https://www.google.com/search?q=%23)

*(Links atualizados conforme novas versões são lançadas.)*
=======
* **APK (última versão):** [Download LancaEnsaio.apk](https://www.google.com/search?q=%23)
* **Slide de apresentação do projeto:** [Ver PDF](https://www.google.com/search?q=%23)

*(Os links são atualizados a cada nova versão. Para acessar o APK mais recente, consulte a seção **Releases** do GitHub.)*

---

## 🧾 Estrutura da planilha "Cérebro"

A planilha Google Sheets deve conter as seguintes abas:

| Aba | Descrição | Colunas essenciais |
| --- | --- | --- |
| **usuarios** | Autenticação e controle de dispositivos | `usuario`, `senha` (hash), `deviceIds`, `ultimoLogin` |
| **Base Geral** | Configurações do sistema | `cidades`, `ministerios`, `cargos`, `instrumentos` (com família) |
| **Dados Geral** | Registros de ensaio | `A`: timestamp, `B`: id, `C..G`: campos do lançamento, `H`: auditoria/alertas |

> **Importante:** A planilha deve estar compartilhada com o e-mail da Service Account usada no backend.

---

## 🛠 Troubleshooting

| Problema | Possível causa | Solução |
| --- | --- | --- |
| **Erro 401 ao fazer login** | Usuário/senha incorretos ou planilha sem permissão | Verifique a aba `usuarios` e se a Service Account tem acesso |
| **Listas não carregam** | Endpoint `/config` falhou ou variável `EXPO_PUBLIC_API_URL` incorreta | Confira o `.env` e se a Edge Function está no ar |
| **Registro não aparece na planilha** | Permissões da Service Account | Compartilhe a planilha com o e-mail da service account |
| **Token expirado** | `SESSION_TTL_MS` configurado muito baixo | Aumente o valor (padrão: 24h) |
>>>>>>> 12bdff861020ff29ec444d80d1c652759931a7b5

---

## 🤝 Contribuição

<<<<<<< HEAD
Contribuições são sempre bem-vindas! Sinta-se à vontade para abrir uma issue ou enviar um pull request.

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
=======
Contribuições são bem-vindas! Siga os passos:

1. Faça um fork do projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
>>>>>>> 12bdff861020ff29ec444d80d1c652759931a7b5
5. Abra um Pull Request

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

<<<<<<< HEAD
## 👨‍💻 Autor e Créditos

Desenvolvido por **BarujaFe** para o Grupo de Estudo Musical de Vargem Grande do Sul.

<p align="center">
<i>Este aplicativo foi desenvolvido para o Grupo de Estudo Musical de Vargem Grande do Sul.</i>
</p>

<p align="center">
<img src="./docs/screenshots/dashboard.png" alt="Dashboard" width="200" />
<img src="./docs/screenshots/aluno.png" alt="Tela do Aluno" width="200" />
<img src="./docs/screenshots/relatorios.png" alt="Relatórios" width="200" />
=======
## 👨‍💻 Autor

Desenvolvido por **BarujaFe**

<p align="center">
<img src="./docs/screenshots/login.png" alt="Tela de login" width="200" />
<img src="./docs/screenshots/registro.png" alt="Tela de registro" width="200" />
<img src="./docs/screenshots/alertar.png" alt="Modal de alerta" width="200" />
>>>>>>> 12bdff861020ff29ec444d80d1c652759931a7b5
</p>
