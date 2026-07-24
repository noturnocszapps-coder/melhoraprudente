# Estrutura do Servidor VPS — Ecossistema Roxou & Melhora Prudente

## Visão Geral
O projeto **Melhora Prudente** foi padronizado para coexistir de forma isolada e segura na infraestrutura de produção VPS compartilhada com o ecossistema Roxou.

## Árvore do Servidor `/var/www/`

```
/var/www/
├── roxou/                      # Aplicações e serviços do ecossistema Roxou
│   ├── roxou-web/
│   ├── prudente-em-foco/
│   ├── motorista-roxou/
│   ├── reserva-roxou/
│   ├── roxou-cortes/
│   └── nt-aplicacoes/
│
└── melhora-prudente/           # Projeto Melhora Prudente
    ├── app/                    # Next.js App Router (Páginas, Layouts e API Routes)
    ├── components/             # Componentes React compartilhados
    ├── services/               # Serviços de Scrapers, IA e Pipeline Modular
    ├── workers/                # Daemon Garimpo Worker
    ├── docs/                   # Documentações de arquitetura e infraestrutura
    ├── scripts/                # Scripts utilitários e de automação de deploy
    ├── public/                 # Ativos estáticos públicos
    ├── supabase/               # Migrações SQL e esquemas do banco
    ├── logs/                   # Logs de runtime e do PM2 (web.log, worker.log, error.log)
    ├── backups/                # Backups e snapshots de emergência
    ├── ecosystem.config.js     # Configuração do PM2 (Web + Worker)
    ├── .env.production.example # Template de variáveis de ambiente de produção
    └── package.json            # Manifesto do projeto e dependências Node.js
```

## Mapeamento de Portas e Processos PM2

| Serviço | Nome no PM2 | Execução / Script | Porta Interna |
| :--- | :--- | :--- | :--- |
| Aplicação Web | `melhora-prudente-web` | `next start -p 3000` | `3000` |
| Garimpo Worker | `melhora-prudente-worker` | `tsx workers/garimpo-worker.ts --loop` | Daemon sem porta |
