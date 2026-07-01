import { createWorker, QUEUE_NAMES } from '@/lib/queue/bullmq';
import { logger } from '@/lib/telemetry/logger';
import {
  processWindsorSyncJob,
  type WindsorSyncJobData,
} from '@/workers/windsor-sync';
import {
  processReportGenerationJob,
  type ReportGenerationJobData,
} from '@/workers/report-generation';
import {
  processNotificationDeliveryJob,
  type NotificationDeliveryJobData,
} from '@/workers/notification-delivery';
import {
  startWindsorScheduler,
  stopWindsorScheduler,
} from '@/workers/windsor-scheduler';

const workers = [
  createWorker<WindsorSyncJobData>(
    QUEUE_NAMES.WINDSOR_SYNC,
    processWindsorSyncJob,
    3,
  ),
  createWorker<ReportGenerationJobData>(
    QUEUE_NAMES.REPORT_GENERATION,
    processReportGenerationJob,
    2,
  ),
  createWorker<NotificationDeliveryJobData>(
    QUEUE_NAMES.NOTIFICATION_DELIVERY,
    processNotificationDeliveryJob,
    5,
  ),
];

workers.forEach((worker) => {
  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, queue: worker.name }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, queue: worker.name, error: err.message },
      'Job failed',
    );
  });
});

logger.info('PerformanceOS workers started');
startWindsorScheduler();

process.on('SIGTERM', async () => {
  logger.info('Shutting down workers...');
  stopWindsorScheduler();
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
});
