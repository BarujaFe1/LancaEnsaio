Aqui está o seu `README.md` perfeitamente formatado. Arrumo os blocos de código, a árvore de arquivos e as tags das badges para que fiquem com o visual correto no GitHub.

Basta clicar em **"Copiar código"** no canto superior direito do bloco abaixo e colar direto no seu repositório:

```markdown
<div align="center">
  <img src="./assets/icon.png" alt="Maestro Logo" width="120" height="120" />
  <h1>Maestro (GEM)</h1>
  <p><strong>Organização e acompanhamento musical para o Grupo de Estudos Musicais</strong></p>

  <p>
    <a href="#-sobre-o-projeto">Sobre</a> •
    <a href="#-funcionalidades">Funcionalidades</a> •
    <a href="#-tecnologias-utilizadas">Tecnologias</a> •
    <a href="#-instalação-direta-apk">APK</a> •
    <a href="#-como-executar-o-projeto-para-desenvolvedores">Como executar</a> •
    <a href="#-build-e-publicação">Build</a> •
    <a href="#-downloads">Downloads</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version 1.0.0" />
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License MIT" />
    <img src="https://img.shields.io/badge/Expo-49.0.0-000020.svg?logo=expo" alt="Expo" />
    <img src="https://img.shields.io/badge/React%20Native-0.72-61DAFB.svg?logo=react" alt="React Native" />
    <img src="https://img.shields.io/badge/Supabase-3.0.0-3ECF8E.svg?logo=supabase" alt="Supabase" />
  </p>
</div>

---

## 📖 Sobre o projeto

**Maestro** é um aplicativo mobile desenvolvido para o **Grupo de Estudos Musicais (GEM)** de Vargem Grande do Sul. Ele centraliza todo o controle do ensino musical em um único lugar: cadastro de alunos, métodos, professores, lançamentos de aula e acompanhamento de evolução com relatórios e gráficos. Pensado para uso diário dos instrutores, o app oferece uma interface rápida, limpa e sem burocracia, além de permitir o trabalho colaborativo entre toda a equipe.

> “A música é a linguagem universal da humanidade.” — Henry Wadsworth Longfellow

---

## ✨ Funcionalidades

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

---

## 🚀 Tecnologias utilizadas

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

```


2. Instale as dependências:
```bash
npm install

```


3. Crie um arquivo `.env` na raiz com as seguintes variáveis:
```env
EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
EXPO_PUBLIC_ORG_JOIN_CODE=codigo_de_acesso

```


4. Inicie o projeto:
```bash
npx expo start -c

```


5. Escaneie o QR Code com o aplicativo Expo Go (Android/iOS) ou pressione `a` para abrir no emulador Android.

---

## 📲 Build e publicação

**Gerar APK (Android) - APENAS APK, SEM AAB**

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


4. Para gerar um APK de teste (instalação direta):
```bash
eas build --profile preview --platform android

```



> **Nota:** O arquivo gerado estará disponível para download no site do Expo ou via link fornecido ao final do build. O projeto atual não gera AAB para Play Store, apenas APK para distribuição direta.

---

## 📥 Downloads

* **APK (última versão):** [Download Maestro.apk](https://www.google.com/search?q=%23)
* **Slide de apresentação do projeto:** [Ver PDF](https://www.google.com/search?q=%23)

*(Links atualizados conforme novas versões são lançadas.)*

---

## 🤝 Contribuição

Contribuições são sempre bem-vindas! Sinta-se à vontade para abrir uma issue ou enviar um pull request.

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

## 👨‍💻 Autor e Créditos

Desenvolvido por **BarujaFe** para o Grupo de Estudo Musical de Vargem Grande do Sul.

<p align="center">
<i>Este aplicativo foi desenvolvido para o Grupo de Estudo Musical de Vargem Grande do Sul.</i>
</p>

<p align="center">
<img src="./docs/screenshots/dashboard.png" alt="Dashboard" width="200" />
<img src="./docs/screenshots/aluno.png" alt="Tela do Aluno" width="200" />
<img src="./docs/screenshots/relatorios.png" alt="Relatórios" width="200" />
</p>

```

-----

### Instruções para criar o repositório e fazer o upload (Para sua referência)

Deixei essas instruções fora do bloco principal para não sujarem o seu `README.md`.

1.  Crie o repositório no GitHub com o nome **Maestro** (ou Maestro-GEM). Não adicione README, `.gitignore` ou licença pelo site para evitar conflitos.
2.  Prepare a pasta local com a estrutura mencionada, incluindo o arquivo `.gitignore` (use o template "Expo" ou adicione manualmente as pastas `node_modules/`, `.expo/`, etc.).
3.  Cole o conteúdo do bloco acima e salve como `README.md` na raiz do projeto.
4.  Crie as pastas `apk/` (para o arquivo `.apk`) e `docs/` (para o slide em PDF).
5.  Adicione os arquivos e faça o push:
    ```bash
    git add .
    git commit -m "Adiciona estrutura inicial do Maestro"
    git branch -M main
    git remote add origin https://github.com/seu-usuario/Maestro.git
    git push -u origin main
    ```
    *(Se o repositório remoto não estiver vazio, use `git pull origin main --allow-unrelated-histories` e depois `git push`)*.

Quer que eu te ajude a gerar um arquivo `.gitignore` padrão para projetos Expo/React Native para garantir que nenhuma pasta desnecessária suba para o GitHub?

```
