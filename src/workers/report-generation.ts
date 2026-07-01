import 'server-only';

import type { Job } from 'bullmq';
import { ReportStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { createChildLogger } from '@/lib/telemetry/logger';

interface ReportGenerationJobData {
  reportId: string;
  organizationId: string;
}

export type { ReportGenerationJobData };

export async function processReportGenerationJob(
  job: Job<ReportGenerationJobData>,
): Promise<void> {
  const log = createChildLogger({ jobId: job.id, reportId: job.data.reportId });
  const { reportId } = job.data;

  await prisma.report.update({
    where: { id: reportId },
    data: { status: ReportStatus.GENERATING },
  });

  try {
    const report = await prisma.report.findUniqueOrThrow({
      where: { id: reportId },
    });

    // Report generation — Step 9 (Reporting module)
    log.info(
      { format: report.format, organizationId: report.organizationId },
      'Report generation acknowledged — full pipeline in Reporting module',
    );

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.COMPLETED,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.FAILED,
        errorMessage: message,
      },
    });

    throw error;
  }
}
