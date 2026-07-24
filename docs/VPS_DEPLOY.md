# Manual de Deploy e Infraestrutura VPS — Melhora Prudente

Este documento descreve a arquitetura e os procedimentos para a hospedagem e o deploy do projeto **Melhora Prudente** em servidor VPS com ecossistema multisserviço.

---

## 1. Estrutura de Diretórios na VPS

O servidor é organizado sob `/var/www/` para hospedar múltiplos projetos do ecossistema:

```
/var/www/
├── roxou/                   # Aplicações e serviços do ecossistema Roxou
└── melhora-prudente/        # Projeto Melhora Prudente
    ├── .env.production      # Variáveis de ambiente reais (chmod 600)
    ├── ecosystem.config.js  # Configuração do PM2 (Web + Worker)
    ├── logs/                # Diretório de logs do PM2
    │   ├── web-out.log
    │   ├── web-err.log
    │   ├── worker-out.log
    │   └── worker-err.log
    └── dist / .next/        # Build de produção do Next.js
```

---

## 2. Fluxo de Deploy

### 2.1 Deploy Completo (Web + Worker)

```bash
cd /var/www/melhora-prudente

# 1. Atualizar repositório
git pull origin main

# 2. Instalar dependências
npm install --production=false

# 3. Compilar aplicação Next.js
npm run build

# 4. Reiniciar serviços no PM2
pm2 reload ecosystem.config.js --env production

# 5. Salvar estado do PM2 para inicialização automática com o SO
pm2 save
```

### 2.2 Deploy Somente Web
```bash
pm2 reload melhora-prudente-web
```

### 2.3 Deploy Somente Worker
```bash
pm2 reload melhora-prudente-worker
```

---

## 3. Comandos Úteis do PM2

| Ação | Comando |
| :--- | :--- |
| **Status dos serviços** | `pm2 status` |
| **Monitoramento em tempo real** | `pm2 monit` |
| **Logs em tempo real** | `pm2 logs` |
| **Logs específicos do Worker** | `pm2 logs melhora-prudente-worker` |
| **Reiniciar Worker** | `pm2 restart melhora-prudente-worker` |
| **Salvar estado do PM2** | `pm2 save` |

---

## 4. Segurança e Boas Práticas

1. **Variáveis de Ambiente Privatizadas**:
   - O arquivo `.env.production` **NUNCA** deve ser commitado no repositório Git.
   - Definir permissões estritas no servidor: `chmod 600 /var/www/melhora-prudente/.env.production`.
2. **Uso de `SUPABASE_SERVICE_ROLE_KEY`**:
   - Utilizada exclusivamente pelo Worker e pelas rotas de servidor (`/api/*`).
   - Jamais expor no front-end ou em variáveis `NEXT_PUBLIC_`.
3. **Isolamento de Logs**:
   - O diretório `logs/` é mantido pelo PM2.
   - Configurar `logrotate` no sistema operacional para evitar acúmulo excessivo de espaço em disco.
4. **Procedimento de Rollback**:
   ```bash
   git log -n 5 --oneline
   git reset --hard <HASH_COMMIT_ANTERIOR>
   npm install
   npm run build
   pm2 reload ecosystem.config.js
   ```
