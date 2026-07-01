import 'server-only';

import type { Job } from 'bullmq';
import { createChildLogger } from '@/lib/telemetry/logger';

interface NotificationDeliveryJobData {
  channel: 'email' | 'whatsapp' | 'telegram';
  recipient: string;
  subject: string;
  body: string;
  attachmentUrl?: string;
}

export type { NotificationDeliveryJobData };

export async function processNotificationDeliveryJob(
  job: Job<NotificationDeliveryJobData>,
): Promise<void> {
  const log = createChildLogger({
    jobId: job.id,
    channel: job.data.channel,
  });

  // Delivery implementation — Step 9 (Reporting module)
  log.info(
    { recipient: job.data.recipient },
    'Notification delivery acknowledged — full delivery in Reporting module',
  );
}
