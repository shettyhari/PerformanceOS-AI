import 'server-only';

import { Queue, Worker, type Job, type JobsOptions } from 'bullmq';
import { env } from '@/lib/env';

const connection = {
  host: new URL(env.REDIS_URL).hostname,
  port: Number(new URL(env.REDIS_URL).port) || 6379,
};

export const QUEUE_NAMES = {
  WINDSOR_SYNC: 'windsor-sync',
  REPORT_GENERATION: 'report-generation',
  NOTIFICATION_DELIVERY: 'notification-delivery',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue {
  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, { connection });
    queues.set(name, queue);
  }
  return queue;
}

export async function enqueueJob<T extends object>(
  queueName: QueueName,
  jobName: string,
  data: T,
  options?: JobsOptions,
): Promise<string> {
  const queue = getQueue(queueName);
  const job = await queue.add(jobName, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
    ...options,
  });
  return job.id ?? '';
}

export function createWorker<T extends object>(
  queueName: QueueName,
  processor: (job: Job<T>) => Promise<void>,
  concurrency = 5,
): Worker<T> {
  return new Worker<T>(queueName, processor, {
    connection,
    concurrency,
  });
}
