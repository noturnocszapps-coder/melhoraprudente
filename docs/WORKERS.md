# Documentação do Garimpo Worker

## Visão Geral
O **Garimpo Worker** (`workers/garimpo-worker.ts`) é o processo daemon em segundo plano responsável por orquestrar a execução recorrente do pipeline de raspagem de notícias e reescrita por Inteligência Artificial.

## Arquitetura e Ciclo de Execução

```
                    [GarimpoWorker]
                          │
                          ▼
            [Para cada fonte habilitada]
             ('g1', 'prefeitura', 'inova')
                          │
                          ▼
            [garimpoPipeline.runSourcePipeline]
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
[Ingestão do Texto Limpo]      [Processamento por IA]
 status: pending_ai             status: ai_processed
```

## Configurações (`workers/config.ts`)

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `WORKER_INTERVAL_MINUTES` | `15` | Intervalo em minutos entre os ciclos de coleta |
| `WORKER_BATCH_SIZE` | `3` | Quantidade máxima de matérias por fonte em cada lote |
| `WORKER_TIMEOUT_MS` | `60000` | Timeout máximo para requisições de coleta |
| `NODE_ENV` | `development` / `production` | Modo de execução do ambiente |

## Modos de Execução

1. **Execução Pontual (Único Ciclo)**:
   ```bash
   npm run worker:garimpo
   ```

2. **Execução Contínua em Loop**:
   ```bash
   npm run worker:dev
   ```

3. **Execução em Produção via PM2**:
   ```bash
   pm2 start ecosystem.config.js --only melhora-prudente-worker
   ```

## Logs e Monitoramento
Os logs do worker são formatados via `WorkerLogger` (`workers/logger.ts`) com timestamps ISO, níveis de severidade (`INFO`, `WARN`, `ERROR`, `DEBUG`) e metadados estruturados.
- Output local / PM2: `./logs/worker-out.log` e `./logs/worker-err.log`.
