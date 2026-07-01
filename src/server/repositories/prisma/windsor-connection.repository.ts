import 'server-only';

import { WindsorSyncStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import type {
  CreateWindsorConnectionData,
  IWindsorConnectionRepository,
  UpdateWindsorConnectionData,
} from '@/server/repositories/interfaces/windsor-connection.repository';
import type { WindsorHealthStatus, Prisma } from '@prisma/client';

export class PrismaWindsorConnectionRepository
  implements IWindsorConnectionRepository
{
  findById(id: string) {
    return prisma.windsorConnection.findUnique({ where: { id } });
  }

  findByIdForOrg(id: string, organizationId: string) {
    return prisma.windsorConnection.findFirst({
      where: { id, organizationId },
    });
  }

  findAllForOrg(organizationId: string) {
    return prisma.windsorConnection.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: CreateWindsorConnectionData) {
    return prisma.windsorConnection.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        workspaceId: data.workspaceId,
        encryptedApiKey: data.encryptedApiKey,
        encryptionIv: data.encryptionIv,
        encryptionTag: data.encryptionTag,
        syncIntervalMin: data.syncIntervalMin,
        autoSyncEnabled: data.autoSyncEnabled,
        config: data.config as unknown as Prisma.InputJsonValue,
      },
    });
  }

  update(id: string, data: UpdateWindsorConnectionData) {
    return prisma.windsorConnection.update({
      where: { id },
      data: {
        ...data,
        config: data.config as unknown as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.windsorConnection.delete({ where: { id } });
  }

  createSyncJob(data: {
    connectionId: string;
    jobType: string;
    scheduledAt?: Date;
  }) {
    return prisma.windsorSyncJob.create({
      data: {
        connectionId: data.connectionId,
        jobType: data.jobType,
        status: WindsorSyncStatus.PENDING,
        scheduledAt: data.scheduledAt ?? new Date(),
      },
    });
  }

  updateSyncJob(id: string, data: Prisma.WindsorSyncJobUpdateInput) {
    return prisma.windsorSyncJob.update({ where: { id }, data });
  }

  findSyncJobById(id: string) {
    return prisma.windsorSyncJob.findUnique({ where: { id } });
  }

  findActiveSyncJob(connectionId: string) {
    return prisma.windsorSyncJob.findFirst({
      where: {
        connectionId,
        status: { in: [WindsorSyncStatus.PENDING, WindsorSyncStatus.RUNNING] },
      },
    });
  }

  findRecentSyncJobs(connectionId: string, limit = 10) {
    return prisma.windsorSyncJob.findMany({
      where: { connectionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  createLog(data: {
    connectionId: string;
    level: string;
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    return prisma.windsorConnectionLog.create({
      data: {
        connectionId: data.connectionId,
        level: data.level,
        message: data.message,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  findRecentLogs(connectionId: string, limit = 20) {
    return prisma.windsorConnectionLog.findMany({
      where: { connectionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findDueForAutoSync() {
    const connections = await prisma.windsorConnection.findMany({
      where: { isActive: true, autoSyncEnabled: true },
      include: {
        syncJobs: {
          where: {
            status: {
              in: [WindsorSyncStatus.PENDING, WindsorSyncStatus.RUNNING],
            },
          },
          take: 1,
        },
      },
    });

    const now = Date.now();

    return connections.filter((connection) => {
      if (connection.syncJobs.length > 0) return false;
      if (!connection.lastSyncAt) return true;
      const intervalMs = connection.syncIntervalMin * 60 * 1000;
      return connection.lastSyncAt.getTime() + intervalMs <= now;
    });
  }

  async findAllActive() {
    return prisma.windsorConnection.findMany({
      where: { isActive: true },
    });
  }

  async updateHealthStatus(id: string, status: WindsorHealthStatus): Promise<void> {
    await prisma.windsorConnection.update({
      where: { id },
      data: {
        healthStatus: status,
        lastHealthCheck: new Date(),
      },
    });
  }
}

export const windsorConnectionRepository =
  new PrismaWindsorConnectionRepository();
