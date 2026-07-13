# Roteiro de demo guiada (3–5 minutos)

Use este roteiro para gravar um vídeo curto ou apresentar ao vivo.

## Preparação (30s)

1. Abrir https://lancaensaio.vercel.app (demo) **ou** APK com backend.
2. Limpar site data se quiser começar do setup.
3. (Opcional) Mostrar `docs/ARCHITECTURE.md` em split screen.

## Minuto 1 — Problema e setup

- “Problema: lançar ensaio sem abrir planilha e sem inconsistência.”
- Preencher nome genérico (`Demo Portfólio`) + modo **Irmãos**.
- Destacar: identificação explícita do lançador, sem login complexo.

## Minuto 2 — Lançamento feliz

- Selecionar cidade.
- Deixar categoria vazia → padrão **Cantor**.
- Tocar **Lançar Agora**.
- Mostrar comprovante (ID + auditoria).

## Minuto 3 — Regra de negócio

- Trocar para instrumento sem categoria (ou categoria sem instrumento).
- Mostrar validação / mensagem de auditoria.
- Corrigir e lançar de novo.

## Minuto 4 — Alerta + (se APK) offline

- Adicionar alerta no último ID (“corrigir cidade”).
- Se em build com API: ativar modo avião → lançar → mostrar banner de fila → reconectar → sync.

## Minuto 5 — Arquitetura e honestidade

- Desenhar: App → Edge Function → Sheets.
- Mencionar: token de app, idempotência, health público.
- Limitações: token no cliente; Sheets como sink operacional; web demo é mock.

## Captura de screenshots

Salvar em `docs/screenshots/` (sem PII real):

| Arquivo | Conteúdo |
|---------|----------|
| `01-setup.png` | Setup nome/modo |
| `02-lancamento.png` | Formulário |
| `03-comprovante.png` | Comprovante |
| `04-web-demo.png` | Header web + demo |

### Como gravar o vídeo

1. OBS / Xbox Game Bar / QuickTime (janela do navegador 1280×720).
2. Seguir este roteiro em 3–5 min.
3. Exportar `docs/demo/lancaensaio-demo.mp4` (opcional no repo; pode ficar só no portfólio).
4. Link canônico no README quando disponível.
