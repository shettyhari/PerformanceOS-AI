import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: Record<string, { status: string; latencyMs?: number; error?: string }>;
}

export async function GET() {
  const checks: HealthCheck['checks'] = {};

  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'up', latencyMs: Date.now() - dbStart };
  } catch (error) {
    checks.database = {
      status: 'down',
      latencyMs: Date.now() - dbStart,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.redis = { status: 'up', latencyMs: Date.now() - redisStart };
  } catch (error) {
    checks.redis = {
      status: 'down',
      latencyMs: Date.now() - redisStart,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  const allUp = Object.values(checks).every((c) => c.status === 'up');
  const anyDown = Object.values(checks).some((c) => c.status === 'down');

  const health: HealthCheck = {
    status: allUp ? 'healthy' : anyDown ? 'unhealthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
    checks,
  };

  return NextResponse.json(health, {
    status: health.status === 'unhealthy' ? 503 : 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
