# Testing — LançaEnsaio

## Comandos

```bash
cd mobile
npm ci
npm run lint
npm run typecheck
npm test
npm run ci
```

## O que é testado automaticamente

| Suite | Cobertura |
|-------|-----------|
| `src/domain/__tests__/auditoria.test.ts` | Regras IRMAOS/IRMAS, IDs, validação pré-envio |
| `src/domain/__tests__/form-state.test.ts` | Limpeza de formulário com/sem trava de cidade |

Jest roda em ambiente `node` (`jest.config.js`) para manter os testes de domínio estáveis sem o polyfill nativo do `jest-expo`.

## Teste manual (produção / APK)

Ver `docs/ROTEIRO_TESTE_MANUAL.md` e `TESTE_MANUAL_ATUALIZADO.md`.

Checklist mínimo:

1. Setup com nome + modo  
2. Lançar Cantor/Cantora (só cidade)  
3. Lançar com instrumento + categoria  
4. Bloquear conflito ministério + cargo  
5. Adicionar alerta no último ID  
6. Pull-to-refresh de config  
7. Offline: banner + bloqueio de envio (modo API)

## CI

GitHub Actions (`.github/workflows/ci.yml`) executa lint, typecheck e test em Node 20.
