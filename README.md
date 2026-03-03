
<div align="center">
  <img src="./assets/icon.png" alt="LançaEnsaio Logo" width="120" height="120" />
  <h1>LançaEnsaio</h1>
  <p><strong>Registros de ensaio rápidos, padronizados e auditáveis</strong></p>

  <p>
    <a href="#-sobre-o-projeto">Sobre</a> •
    <a href="#-funcionalidades">Funcionalidades</a> •
    <a href="#-arquitetura">Arquitetura</a> •
    <a href="#-como-executar-o-projeto-ambiente-de-desenvolvimento">Como executar</a> •
    <a href="#-build-apk-para-distribuição">Build APK</a> •
    <a href="#-downloads">Downloads</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version 1.0.0" />
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License MIT" />
    <img src="https://img.shields.io/badge/Expo-49.0.0-000020.svg?logo=expo" alt="Expo" />
    <img src="https://img.shields.io/badge/React%20Native-0.72-61DAFB.svg?logo=react" alt="React Native" />
    <img src="https://img.shields.io/badge/Supabase-3FCF8E.svg?logo=supabase" alt="Supabase" />
  </p>
</div>

---

## 📖 Sobre o projeto

**LançaEnsaio** é um aplicativo mobile desenvolvido para equipes de música que precisam registrar ensaios e escalas de forma rápida, padronizada e com validação automática. Com uma interface simples e guiada, o app permite que os usuários façam lançamentos precisos, evitem erros de digitação e ainda possam alertar sobre correções quando necessário.

O backend roda em **Supabase Edge Functions** e utiliza uma planilha Google Sheets como banco de dados central ("Cérebro"), garantindo que os dados estejam sempre acessíveis e auditáveis.

> Ideal para ministérios de música, bandas, orquestras e grupos que desejam organizar seus registros de ensaio de forma colaborativa e segura.

---

## ✨ Funcionalidades

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

---

## 🚀 Tecnologias utilizadas

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

```


2. Instale as dependências:
```bash
npm install

```


3. Crie um arquivo `.env` na raiz do projeto com a URL da sua Edge Function:
```env
EXPO_PUBLIC_API_URL=https://<seu-projeto>.supabase.co/functions/v1/api

```


4. Inicie o projeto:
```bash
npx expo start -c

```


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

```



> Ao final, o EAS fornecerá um link para download do APK. Você pode baixar e compartilhar.
> **Dica:** O APK gerado pode ser instalado diretamente em qualquer dispositivo Android.

---

## 📥 Downloads

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

---

## 🤝 Contribuição

Contribuições são bem-vindas! Siga os passos:

1. Faça um fork do projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

## 👨‍💻 Autor

Desenvolvido por **BarujaFe**

<p align="center">
<img src="./docs/screenshots/login.png" alt="Tela de login" width="200" />
<img src="./docs/screenshots/registro.png" alt="Tela de registro" width="200" />
<img src="./docs/screenshots/alertar.png" alt="Modal de alerta" width="200" />
</p>
