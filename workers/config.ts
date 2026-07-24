export interface WorkerConfig {
  intervalMinutes: number;
  batchSize: number;
  timeoutMs: number;
  environment: string;
  enabledSources: ('g1' | 'prefeitura' | 'inova')[];
}

export const workerConfig: WorkerConfig = {
  intervalMinutes: Number(process.env.WORKER_INTERVAL_MINUTES) || 15,
  batchSize: Number(process.env.WORKER_BATCH_SIZE) || 3,
  timeoutMs: Number(process.env.WORKER_TIMEOUT_MS) || 60000,
  environment: process.env.NODE_ENV || 'development',
  enabledSources: ['g1', 'prefeitura', 'inova'],
};
