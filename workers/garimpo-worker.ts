import { garimpoPipeline } from '../services/pipeline/garimpoPipeline';
import { workerConfig } from './config';
import { logger } from './logger';

export interface CycleSummary {
  startTime: string;
  endTime: string;
  durationMs: number;
  totalCollected: number;
  totalProcessedAI: number;
  sourceResults: Record<string, { collected: number; errors: string[] }>;
  errors: string[];
}

export class GarimpoWorker {
  private isRunning = false;
  private loopTimeout: NodeJS.Timeout | null = null;

  /**
   * Executes a single collection and processing cycle across enabled sources
   */
  async runCycle(): Promise<CycleSummary> {
    const startTime = new Date();
    logger.info('=== INICIANDO CICLO DO WORKER GARIMPO ===', {
      config: {
        batchSize: workerConfig.batchSize,
        enabledSources: workerConfig.enabledSources,
        environment: workerConfig.environment,
      },
    });

    let totalCollected = 0;
    let totalProcessedAI = 0;
    const globalErrors: string[] = [];
    const sourceResults: Record<string, { collected: number; errors: string[] }> = {};

    for (const sourceId of workerConfig.enabledSources) {
      logger.info(`Iniciando coleta para a fonte: ${sourceId}`);
      try {
        const result = await garimpoPipeline.runSourcePipeline(sourceId, workerConfig.batchSize);

        sourceResults[sourceId] = {
          collected: result.processedCount,
          errors: result.errors,
        };

        totalCollected += result.processedCount;
        totalProcessedAI += result.candidates.filter(c => c.status === 'ai_processed').length;

        if (result.errors.length > 0) {
          logger.warn(`Fonte '${sourceId}' finalizou com alguns avisos/erros`, {
            errorsCount: result.errors.length,
            errors: result.errors,
          });
        } else {
          logger.info(`Fonte '${sourceId}' finalizada com sucesso`, {
            processedCount: result.processedCount,
          });
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error(`Erro crítico ao processar fonte '${sourceId}'`, err);
        globalErrors.push(`Fonte ${sourceId}: ${errorMsg}`);
        sourceResults[sourceId] = {
          collected: 0,
          errors: [errorMsg],
        };
      }
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    const summary: CycleSummary = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMs,
      totalCollected,
      totalProcessedAI,
      sourceResults,
      errors: globalErrors,
    };

    logger.info('=== CICLO DO WORKER FINALIZADO ===', {
      durationMs,
      totalCollected,
      totalProcessedAI,
      hasGlobalErrors: globalErrors.length > 0,
    });

    return summary;
  }

  /**
   * Runs the worker continuously in an interval loop
   */
  async startLoop(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Worker já está em execução.');
      return;
    }

    this.isRunning = true;
    logger.info(`Iniciando Worker em modo contínuo (Intervalo: ${workerConfig.intervalMinutes} min)`);

    const execute = async () => {
      try {
        await this.runCycle();
      } catch (err) {
        logger.error('Erro não tratado durante o ciclo do worker:', err);
      }

      if (this.isRunning) {
        const nextRunMs = workerConfig.intervalMinutes * 60 * 1000;
        logger.info(`Aguardando próximo ciclo em ${workerConfig.intervalMinutes} minutos...`);
        this.loopTimeout = setTimeout(execute, nextRunMs);
      }
    };

    // Execute immediately on startup
    await execute();
  }

  /**
   * Gracefully stops the worker loop
   */
  stop(): void {
    logger.info('Solicitado encerramento do Worker Garimpo...');
    this.isRunning = false;
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }
    logger.info('Worker Garimpo encerrado com sucesso.');
  }
}

// Entry point execution logic
if (require.main === module) {
  const worker = new GarimpoWorker();

  const isLoopMode = process.argv.includes('--loop');

  // Signal handlers for graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Sinal SIGINT recebido.');
    worker.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Sinal SIGTERM recebido.');
    worker.stop();
    process.exit(0);
  });

  if (isLoopMode) {
    worker.startLoop().catch(err => {
      logger.error('Falha fatal no loop do worker:', err);
      process.exit(1);
    });
  } else {
    // Default single cycle execution
    worker
      .runCycle()
      .then(summary => {
        logger.info('Execução pontual finalizada.', { summary });
        process.exit(0);
      })
      .catch(err => {
        logger.error('Falha fatal na execução pontual do worker:', err);
        process.exit(1);
      });
  }
}
