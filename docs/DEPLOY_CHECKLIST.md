# Checklist Oficial de Deploy — Melhora Prudente

Este checklist deve ser verificado antes, durante e após qualquer procedimento de deploy no servidor VPS de produção.

## 1. Pré-Deploy (Validação Local e Build)
- [ ] Código enviado e mesclado na branch `main`.
- [ ] Compilação sem erros executada: `npm run build`.
- [ ] Verificação de tipos executada: `npm run typecheck`.
- [ ] Linter sem erros fatais: `npm run lint`.
- [ ] Teste do worker em ciclo único realizado localmente: `npm run worker:garimpo`.

## 2. Configurações e Ambiente no Servidor
- [ ] Variáveis de ambiente configuradas em `/var/www/melhora-prudente/.env.production`.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurado.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado (restrito ao servidor).
- [ ] `GEMINI_API_KEY` configurada e com cota ativa.
- [ ] Permissões de arquivo verificadas (`chmod 600 .env.production`).

## 3. Execução do Deploy
- [ ] Executar deploy web / worker ou completo:
  - Deploy Web: `./scripts/deploy-web.sh`
  - Deploy Worker: `./scripts/deploy-worker.sh`
  - Deploy Completo: `./scripts/deploy-full.sh`

## 4. Pós-Deploy e Validação de Saúde (Health Checks)
- [ ] Verificar status do PM2: `pm2 status`.
- [ ] Validar logs sem erros críticos: `pm2 logs`.
- [ ] Testar endpoint de saúde web: `curl http://127.0.0.1:3000/api/health`.
- [ ] Testar endpoint de saúde do worker: `curl http://127.0.0.1:3000/api/worker/health`.
- [ ] Confirmar Nginx ativo e proxy reverso respondendo sem erros 502/504.
- [ ] Verificar certificado SSL Válido em `https://melhoraprudente.com.br`.

## 5. Procedimento de Rollback de Emergência (Se necessário)
Em caso de quebra de produção:
```bash
./scripts/rollback.sh <COMMIT_HASH_ANTERIOR>
```
