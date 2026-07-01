import 'server-only';

import type { Job } from 'bullmq';
import { WindsorSyncStatus } from '@prisma/client';
import { windsorService } from '@/server/services';
import { windsorConnectionRepository } from '@/server/repositories/prisma/windsor-connection.repository';
import { createChildLogger } from '@/lib/telemetry/logger';
import type { WindsorSyncJobType } from '@/features/windsor/types';

interface WindsorSyncJobData {
  connectionId: string;
  jobType?: WindsorSyncJobType;
  syncJobId: string;
}

export type { WindsorSyncJobData };

export async function processWindsorSyncJob(
  job: Job<WindsorSyncJobData>,
): Promise<void> {
  const log = createChildLogger({
    jobId: job.id,
    connectionId: job.data.connectionId,
  });

  const { connectionId, syncJobId, jobType = 'manual' } = job.data;

  await windsorConnectionRepository.updateSyncJob(syncJobId, {
    status: WindsorSyncStatus.RUNNING,
    startedAt: new Date(),
  });

  try {
    const recordsProcessed = await windsorService.performSync(
      connectionId,
      syncJobId,
      jobType,
    );

    await windsorConnectionRepository.updateSyncJob(syncJobId, {
      status: WindsorSyncStatus.COMPLETED,
      completedAt: new Date(),
      recordsProcessed,
    });

    await windsorConnectionRepository.createLog({
      connectionId,
      level: 'info',
      message: `Sync completed: ${recordsProcessed} records processed`,
      metadata: { jobId: job.id, recordsProcessed, jobType },
    });

    log.info({ recordsProcessed, jobType }, 'Windsor sync completed');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    const syncJob =
      await windsorConnectionRepository.findSyncJobById(syncJobId);
    const retryCount = (syncJob?.retryCount ?? 0) + 1;
    const maxRetries = syncJob?.maxRetries ?? 3;

    await windsorConnectionRepository.updateSyncJob(syncJobId, {
      status:
        retryCount >= maxRetries
          ? WindsorSyncStatus.FAILED
          : WindsorSyncStatus.PENDING,
      completedAt: retryCount >= maxRetries ? new Date() : undefined,
      errorMessage: message,
      retryCount,
    });

    await windsorConnectionRepository.createLog({
      connectionId,
      level: 'error',
      message: `Sync failed: ${message}`,
      metadata: { jobId: job.id, retryCount },
    });

    log.error({ error: message, retryCount }, 'Windsor sync failed');
    throw error;
  }
}
