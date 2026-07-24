import { NextResponse } from 'next/server';
import { workerConfig } from '@/workers/config';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'melhora-prudente-worker',
    timestamp: new Date().toISOString(),
    config: {
      intervalMinutes: workerConfig.intervalMinutes,
      batchSize: workerConfig.batchSize,
      enabledSources: workerConfig.enabledSources,
    },
    environment: process.env.NODE_ENV || 'development',
  });
}
