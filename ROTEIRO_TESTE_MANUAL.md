# ROTEIRO DE TESTE MANUAL - LançaEnsaio

**Data**: 2026-04-24  
**Projeto Supabase**: jzkozhnuyewnjwfgjhaa (LançaEnsaio)  
**URL da API**: https://jzkozhnuyewnjwfgjhaa.supabase.co/functions/v1/api  
**Diretório**: D:\Dev\Projetos VibeCoding\LancaEnsaioIrmaos

---

## PRÉ-REQUISITOS

### Verificar antes de começar
- ✅ Node.js instalado
- ✅ Expo Go instalado no celular (Android/iOS)
- ✅ Celular e computador na mesma rede Wi-Fi
- ✅ Dependências do mobile instaladas (node_modules existe)
- ✅ Arquivo `.env` configurado com URL da API

---

## COMO INICIAR O APP

### Passo 1: Abrir terminal no diretório do mobile
```powershell
cd "D:\Dev\Projetos VibeCoding\LancaEnsaioIrmaos\mobile"
```

### Passo 2: Iniciar o Expo
```powershell
npx expo start
```

### Passo 3: Abrir no celular
1. Abrir o app **Expo Go** no celular
2. Escanear o QR Code que aparece no terminal
3. Aguardar o app carregar

---

## TESTE 1: FLUXO INICIAL (SETUP)

### O que você deve ver
1. **Tela de Setup** com:
   - Título "LançaEnsaio"
   - Campo "Como você se chama?"
   - Dois botões: "Lançar Irmãos" e "Lançar Irmãs"
   - Botão "Salvar e Continuar"

### O que você deve fazer
1. Digitar seu nome no campo (ex: "João Testador")
2. Clicar em **"Lançar Irmãos"** (botão deve ficar destacado)
3. Clicar em **"Salvar e Continuar"**

### O que deve acontecer
- App deve ir para a tela principal (tabs na parte inferior)
- Você deve ver 3 abas: "Lançar", "Alerta", "Configurações"

---

## TESTE 2: LANÇAMENTO DE IRMÃOS

### O que você deve ver
1. **Tela "Lançar"** com:
   - Texto mostrando seu nome e tipo (ex: "João Testador - IRMÃOS")
   - Campos: Cidade, Categoria, Instrumento, Ministério, Música/Cargo
   - Botão "Lançar Ensaio"
   - Área de comprovante (vazia inicialmente)

### O que você deve fazer
1. Selecionar **Cidade**: "Ribeirão - Ipiranga"
2. Selecionar **Categoria**: "Metais"
3. Selecionar **Instrumento**: "Trompete"
4. Deixar **Ministério** vazio
5. Selecionar **Música/Cargo**: "Instrutor"
6. Clicar em **"Lançar Ensaio"**

### O que deve acontecer
- Mensagem de sucesso deve aparecer
- Comprovante deve aparecer na tela com:
  - ID gerado (ex: "MINV1234")
  - Horário do lançamento
  - Dados que você preencheu
  - Auditoria: "META APP=UNIFICADO TIPO=IRMAOS USER=João Testador"

### Como conferir na planilha
1. Abrir: https://docs.google.com/spreadsheets/d/1GJobCp4fIBOysVTvNWULcVeRUQYXVrY8gkQgBkUcHsc
2. Ir para aba **"Dados Geral"**
3. Procurar a última linha adicionada
4. Verificar:
   - Coluna A: Horário (formato "HH:mm - dd/MM/yyyy")
   - Coluna B: ID gerado (começa com "M")
   - Coluna C: "Metais"
   - Coluna D: "Trompete"
   - Coluna E: "Ribeirão - Ipiranga"
   - Coluna F: "-" (ministério vazio)
   - Coluna G: "Instrutor"
   - Coluna H: **"META APP=UNIFICADO TIPO=IRMAOS USER=João Testador"**

---

## TESTE 3: TROCAR PARA IRMÃS

### O que você deve fazer
1. Clicar na aba **"Configurações"** (terceira aba)
2. Na seção "Tipo de Lançamento", clicar em **"Lançar Irmãs"**
3. Voltar para a aba **"Lançar"** (primeira aba)

### O que deve acontecer
- Texto no topo deve mudar para "João Testador - IRMÃS"
- Campos de Categoria e Instrumento devem desaparecer
- Campo Música/Cargo deve mostrar opções de irmãs (Cantora, Organista, etc)

---

## TESTE 4: LANÇAMENTO DE IRMÃS

### O que você deve fazer
1. Selecionar **Cidade**: "Ribeirão - Ipiranga"
2. Deixar **Ministério** vazio
3. Deixar **Música/Cargo** vazio (ou selecionar "Cantora")
4. Clicar em **"Lançar Ensaio"**

### O que deve acontecer
- Mensagem de sucesso deve aparecer
- Comprovante deve aparecer com:
  - ID gerado (ex: "F1234")
  - Auditoria: "META APP=UNIFICADO TIPO=IRMAS USER=João Testador"

### Como conferir na planilha
1. Abrir aba **"Dados Geral"** novamente
2. Procurar a última linha adicionada
3. Verificar:
   - Coluna B: ID gerado (começa com "F")
   - Coluna C: "-" (sem categoria)
   - Coluna D: "-" (sem instrumento)
   - Coluna E: "Ribeirão - Ipiranga"
   - Coluna G: "Cantora" (ou vazio)
   - Coluna H: **"META APP=UNIFICADO TIPO=IRMAS USER=João Testador"**

---

## TESTE 5: ALERTA MANUAL

### O que você deve fazer
1. Clicar na aba **"Alerta"** (segunda aba)
2. Digitar o **ID** de um registro anterior (ex: "MINV1234")
3. Digitar um **aviso** (ex: "Teste de alerta manual")
4. Clicar em **"Enviar Alerta"**

### O que deve acontecer
- Mensagem de sucesso deve aparecer
- Campos devem ser limpos

### Como conferir na planilha
1. Abrir aba **"Dados Geral"**
2. Procurar a linha com o ID que você usou
3. Verificar coluna H: deve ter o texto do alerta adicionado

---

## TESTE 6: EDITAR NOME

### O que você deve fazer
1. Ir para aba **"Configurações"**
2. Editar o campo "Seu Nome"
3. Clicar em **"Salvar Nome"**

### O que deve acontecer
- Mensagem de sucesso deve aparecer
- Voltar para aba "Lançar" e verificar que o nome mudou no topo

---

## TESTE 7: LIMPAR PREFERÊNCIAS

### O que você deve fazer
1. Ir para aba **"Configurações"**
2. Rolar até o final
3. Clicar em **"Limpar Tudo e Voltar ao Setup"**
4. Confirmar na mensagem

### O que deve acontecer
- App deve voltar para a tela de Setup inicial
- Campos devem estar vazios
- Nenhum tipo deve estar selecionado

---

## CHECKLIST DE VALIDAÇÃO

### Backend
- [ ] GET /health retorna OK
- [ ] POST /authlogin retorna 404 (não existe)
- [ ] GET /config funciona SEM Bearer token
- [ ] POST /registros funciona SEM Bearer token
- [ ] Registro IRMAOS gera ID começando com "M"
- [ ] Registro IRMAS gera ID começando com "F"
- [ ] Metadado tem formato "META APP=UNIFICADO TIPO={tipo} USER={nome}"

### Mobile
- [ ] Tela de setup aparece na primeira vez
- [ ] Escolha de tipo (IRMAOS/IRMAS) funciona
- [ ] Nome é salvo e reutilizado
- [ ] Lançamento IRMAOS funciona
- [ ] Lançamento IRMAS funciona
- [ ] Comprovante aparece após lançamento
- [ ] Alerta manual funciona
- [ ] Edição de nome funciona
- [ ] Troca de tipo funciona
- [ ] Limpar preferências funciona

### Planilha
- [ ] Registros aparecem na aba "Dados Geral"
- [ ] Coluna H tem formato "META APP=UNIFICADO TIPO={tipo} USER={nome}"
- [ ] IDs de IRMAOS começam com "M"
- [ ] IDs de IRMAS começam com "F"
- [ ] Alertas são adicionados à coluna H

---

## PROBLEMAS COMUNS

### App não abre no Expo Go
- Verificar se celular e computador estão na mesma rede Wi-Fi
- Tentar fechar e abrir o Expo Go novamente
- Verificar se o terminal não mostrou erro

### Erro ao lançar ensaio
- Verificar se todos os campos obrigatórios foram preenchidos
- Verificar se a internet está funcionando
- Verificar se a URL da API está correta no .env

### Registro não aparece na planilha
- Aguardar alguns segundos e atualizar a página
- Verificar se o ID gerado no app corresponde ao ID na planilha
- Verificar se a planilha correta está aberta

---

## INFORMAÇÕES TÉCNICAS

### URL da API
```
https://jzkozhnuyewnjwfgjhaa.supabase.co/functions/v1/api
```

### Planilha Google Sheets
```
https://docs.google.com/spreadsheets/d/1GJobCp4fIBOysVTvNWULcVeRUQYXVrY8gkQgBkUcHsc
```

### Abas da Planilha
- **Base Geral**: Configurações (instrumentos, cidades, ministérios)
- **Dados Geral**: Registros de lançamentos (colunas A-H)

### Formato da Coluna H (Auditoria)
```
META APP=UNIFICADO TIPO=IRMAOS USER=NomeDoUsuario
META APP=UNIFICADO TIPO=IRMAS USER=NomeDoUsuario
```

### Prefixos de ID
- **IRMAOS**: M + 3 letras do nome + 4 dígitos (ex: MJOA1234)
- **IRMAS**: F + 4 dígitos (ex: F1234)

---

**FIM DO ROTEIRO**
