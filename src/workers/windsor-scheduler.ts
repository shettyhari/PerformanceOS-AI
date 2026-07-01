import { windsorService } from '@/server/services';
import { windsorConnectionRepository } from '@/server/repositories/prisma/windsor-connection.repository';
import { createWindsorClient } from '@/lib/infrastructure/windsor/client';
import { decrypt } from '@/lib/encryption';
import { WindsorHealthStatus } from '@prisma/client';
import { createChildLogger } from '@/lib/telemetry/logger';

const log = createChildLogger({ service: 'windsor-scheduler' });

const SCHEDULER_INTERVAL_MS = 60_000;
const HEALTH_CHECK_INTERVAL_MS = 15 * 60_000;

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let healthTimer: ReturnType<typeof setInterval> | null = null;

async function runAutoSyncScheduler(): Promise<void> {
  try {
    const scheduled = await windsorService.scheduleDueSyncs();
    if (scheduled > 0) {
      log.info({ scheduled }, 'Auto-sync jobs scheduled');
    }
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : 'Unknown' },
      'Auto-sync scheduler failed',
    );
  }
}

async function runHealthChecks(): Promise<void> {
  try {
    const connections = await windsorConnectionRepository.findAllActive();

    for (const connection of connections) {
      try {
        const apiKey = decrypt({
          encryptedData: connection.encryptedApiKey,
          iv: connection.encryptionIv,
          authTag: connection.encryptionTag,
        });

        const client = createWindsorClient(apiKey);
        await client.healthCheck();

        await windsorConnectionRepository.updateHealthStatus(
          connection.id,
          WindsorHealthStatus.HEALTHY,
        );
      } catch {
        await windsorConnectionRepository.updateHealthStatus(
          connection.id,
          WindsorHealthStatus.UNHEALTHY,
        );

        await windsorConnectionRepository.createLog({
          connectionId: connection.id,
          level: 'warn',
          message: 'Scheduled health check failed',
        });
      }
    }
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : 'Unknown' },
      'Health check scheduler failed',
    );
  }
}

export function startWindsorScheduler(): void {
  if (schedulerTimer) return;

  schedulerTimer = setInterval(runAutoSyncScheduler, SCHEDULER_INTERVAL_MS);
  healthTimer = setInterval(runHealthChecks, HEALTH_CHECK_INTERVAL_MS);

  void runAutoSyncScheduler();

  log.info('Windsor scheduler started');
}

export function stopWindsorScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }
}
