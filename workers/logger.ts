export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export class WorkerLogger {
  private prefix: string;

  constructor(prefix = 'GarimpoWorker') {
    this.prefix = prefix;
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] [${this.prefix}] ${message}${metaStr}`;
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(this.formatMessage(LogLevel.INFO, message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, meta));
  }

  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    const errMeta = error instanceof Error ? { errorName: error.name, errorMessage: error.message, stack: error.stack, ...meta } : { error, ...meta };
    console.error(this.formatMessage(LogLevel.ERROR, message, errMeta));
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }
}

export const logger = new WorkerLogger();
