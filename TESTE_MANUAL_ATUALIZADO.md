# TESTE MANUAL ATUALIZADO - LançaEnsaio

**Data**: 2026-04-24  
**Versão**: 2.0 (com alerta unificado)  
**URL da API**: https://jzkozhnuyewnjwfgjhaa.supabase.co/functions/v1/api

---

## MUDANÇAS NESTA VERSÃO

### ✅ Corrigido
- **Picker com fundo branco**: Removido propriedade `color` que causava texto invisível no Android
- **Campos de IRMAOS**: Categoria e Instrumento aparecem apenas para IRMAOS

### ✅ Novo
- **Alerta unificado**: Botão "ALERTAR ÚLTIMO LANÇAMENTO" aparece após lançar
- **Aba Alerta removida**: Agora tudo está na tela principal
- **Build local**: Configurado `eas.json` para gerar APK localmente

---

## COMO INICIAR O APP

```powershell
cd "D:\Dev\Projetos VibeCoding\LancaEnsaioIrmaos\mobile"
npx expo start
```

Abrir **Expo Go** no celular e escanear o QR Code.

---

## FLUXO DE TESTE COMPLETO

### 1. Setup Inicial
- Digitar nome (ex: "João Testador")
- Clicar em **"Lançar Irmãos"**
- Clicar em **"Salvar e Continuar"**

### 2. Lançamento IRMAOS
- Selecionar **Cidade**: "Ribeirão - Ipiranga"
- Selecionar **Categoria**: "Metais" (campo aparece apenas para IRMAOS)
- Selecionar **Instrumento**: "Trompete" (aparece após selecionar categoria)
- Selecionar **Música/Cargo**: "Instrutor"
- Clicar em **"LANÇAR AGORA"**
- ✅ Verificar mensagem de sucesso com ID

### 3. Alertar Último Lançamento
- Após lançar, aparece botão **"ALERTAR ÚLTIMO LANÇAMENTO (ID)"**
- Clicar no botão
- Digitar texto do alerta (ex: "Teste de alerta unificado")
- Clicar em **"ENVIAR ALERTA"**
- ✅ Verificar mensagem de sucesso
- Clicar em **"CANCELAR"** para voltar ao modo lançamento

### 4. Trocar para IRMAS
- Ir para aba **"Config"**
- Clicar em **"Lançar Irmãs"**
- Voltar para aba **"Lançar"**
- ✅ Verificar que campos Categoria e Instrumento desapareceram

### 5. Lançamento IRMAS
- Selecionar **Cidade**: "Ribeirão - Ipiranga"
- Selecionar **Música/Cargo**: "Cantora"
- Clicar em **"LANÇAR AGORA"**
- ✅ Verificar mensagem de sucesso com ID começando com "F"

### 6. Verificar na Planilha
Abrir: https://docs.google.com/spreadsheets/d/1GJobCp4fIBOysVTvNWULcVeRUQYXVrY8gkQgBkUcHsc

**Aba "Dados Geral"**:
- Procurar últimas linhas
- Verificar coluna H: `META APP=UNIFICADO TIPO=IRMAOS USER=João Testador`
- Verificar coluna H com alerta: deve ter o texto do alerta adicionado

---

## COMO GERAR APK

Ver arquivo `COMO_GERAR_APK.md` para instruções completas.

**Método rápido (build local)**:
```bash
cd "D:\Dev\Projetos VibeCoding\LancaEnsaioIrmaos\mobile"
eas build --platform android --profile local --local
```

---

## CHECKLIST DE VALIDAÇÃO

### Interface
- [ ] Picker mostra texto visível (não branco em fundo branco)
- [ ] Campos Categoria/Instrumento aparecem apenas para IRMAOS
- [ ] Botão "Alertar" aparece após lançamento
- [ ] Modo alerta mostra campo de texto e botões
- [ ] Botão "Cancelar" volta ao modo lançamento
- [ ] Aba "Alerta" não aparece no menu (apenas Lançar e Config)

### Funcionalidade
- [ ] Lançamento IRMAOS funciona
- [ ] Lançamento IRMAS funciona
- [ ] Alerta funciona após lançamento
- [ ] Troca entre IRMAOS/IRMAS funciona
- [ ] Registros aparecem na planilha
- [ ] Alertas são adicionados à coluna H

---

## PROBLEMAS CONHECIDOS

### ✅ RESOLVIDO: Picker com fundo branco
**Causa**: Propriedade `color` nos `Picker.Item` causa conflito no Android  
**Solução**: Removida propriedade `color`, adicionado `itemStyle`

### ✅ RESOLVIDO: Aba Alerta desnecessária
**Causa**: Fluxo separado confuso  
**Solução**: Alerta unificado na tela principal com botão contextual

---

**FIM DO ROTEIRO ATUALIZADO**
