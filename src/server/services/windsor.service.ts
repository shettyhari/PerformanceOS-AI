import 'server-only';

import { WindsorHealthStatus } from '@prisma/client';
import { decrypt, encrypt } from '@/lib/encryption';
import {
  createWindsorClient,
  WindsorApiError,
} from '@/lib/infrastructure/windsor/client';
import { normalizeWindsorRow } from '@/lib/infrastructure/windsor/normalizer';
import { cacheDeletePattern } from '@/lib/cache/redis';
import { enqueueJob, QUEUE_NAMES } from '@/lib/queue/bullmq';
import { createChildLogger } from '@/lib/telemetry/logger';
import {
  DEFAULT_WINDSOR_CONFIG,
  WINDSOR_SYNC_FIELDS,
  type WindsorConnectionConfig,
  type WindsorConnectionLogView,
  type WindsorConnectionView,
  type WindsorSyncJobType,
  type WindsorSyncJobView,
} from '@/features/windsor/types';
import type { CreateWindsorConnectionInput } from '@/lib/validation/windsor';
import type { UpdateWindsorConnectionInput } from '@/lib/validation/windsor';
import type { IWindsorConnectionRepository } from '@/server/repositories/interfaces/windsor-connection.repository';
import type { ICampaignRepository } from '@/server/repositories/interfaces/campaign.repository';
import type { IAuditRepository } from '@/server/repositories/interfaces/audit.repository';

function parseConfig(raw: unknown): WindsorConnectionConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_WINDSOR_CONFIG;
  const config = raw as Partial<WindsorConnectionConfig>;
  return {
    connectors: config.connectors?.length
      ? config.connectors
      : DEFAULT_WINDSOR_CONFIG.connectors,
    datePreset: config.datePreset ?? DEFAULT_WINDSOR_CONFIG.datePreset,
    dateFrom: config.dateFrom,
    dateTo: config.dateTo,
  };
}

function getDatePresetForJobType(
  jobType: WindsorSyncJobType,
  config: WindsorConnectionConfig,
): { datePreset?: string; dateFrom?: string; dateTo?: string } {
  if (config.dateFrom && config.dateTo) {
    return { dateFrom: config.dateFrom, dateTo: config.dateTo };
  }
  if (jobType === 'incremental') return { datePreset: 'last_7d' };
  if (jobType === 'full') return { datePreset: 'last_90d' };
  return { datePreset: config.datePreset };
}

export class WindsorService {
  private readonly log = createChildLogger({ service: 'windsor' });

  constructor(
    private readonly connections: IWindsorConnectionRepository,
    private readonly campaigns: ICampaignRepository,
    private readonly audit: IAuditRepository,
  ) {}

  private decryptApiKey(connection: {
    encryptedApiKey: string;
    encryptionIv: string;
    encryptionTag: string;
  }): string {
    return decrypt({
      encryptedData: connection.encryptedApiKey,
      iv: connection.encryptionIv,
      authTag: connection.encryptionTag,
    });
  }

  private toConnectionView(
    connection: Awaited<
      ReturnType<IWindsorConnectionRepository['findByIdForOrg']>
    >,
    pendingSync = false,
  ): WindsorConnectionView {
    if (!connection) throw new Error('Connection not found');
    return {
      id: connection.id,
      name: connection.name,
      workspaceId: connection.workspaceId,
      isActive: connection.isActive,
      healthStatus: connection.healthStatus,
      lastHealthCheck: connection.lastHealthCheck,
      lastSyncAt: connection.lastSyncAt,
      syncIntervalMin: connection.syncIntervalMin,
      autoSyncEnabled: connection.autoSyncEnabled,
      config: parseConfig(connection.config),
      createdAt: connection.createdAt,
      pendingSync,
    };
  }

  async listConnections(
    organizationId: string,
  ): Promise<WindsorConnectionView[]> {
    const connections = await this.connections.findAllForOrg(organizationId);

    return Promise.all(
      connections.map(async (connection) => {
        const activeJob =
          await this.connections.findActiveSyncJob(connection.id);
        return this.toConnectionView(connection, !!activeJob);
      }),
    );
  }

  async getConnection(
    connectionId: string,
    organizationId: string,
  ): Promise<WindsorConnectionView | null> {
    const connection = await this.connections.findByIdForOrg(
      connectionId,
      organizationId,
    );
    if (!connection) return null;
    const activeJob = await this.connections.findActiveSyncJob(connection.id);
    return this.toConnectionView(connection, !!activeJob);
  }

  async createConnection(
    organizationId: string,
    userId: string,
    input: CreateWindsorConnectionInput,
  ): Promise<WindsorConnectionView> {
    const client = createWindsorClient(input.apiKey);
    await client.validateApiKey();

    const encrypted = encrypt(input.apiKey);
    const config = input.config ?? DEFAULT_WINDSOR_CONFIG;

    const connection = await this.connections.create({
      organizationId,
      name: input.name,
      workspaceId: input.workspaceId,
      encryptedApiKey: encrypted.encryptedData,
      encryptionIv: encrypted.iv,
      encryptionTag: encrypted.authTag,
      syncIntervalMin: input.syncIntervalMin,
      autoSyncEnabled: input.autoSyncEnabled,
      config,
    });

    await this.connections.updateHealthStatus(
      connection.id,
      WindsorHealthStatus.HEALTHY,
    );

    await this.connections.createLog({
      connectionId: connection.id,
      level: 'info',
      message: 'Windsor connection created and validated',
    });

    await this.audit.create({
      organizationId,
      userId,
      action: 'CONNECT',
      resourceType: 'windsor_connection',
      resourceId: connection.id,
      metadata: { name: input.name },
    });

    await this.enqueueSync(connection.id, organizationId, 'manual', userId);

    const updated = await this.connections.findByIdForOrg(
      connection.id,
      organizationId,
    );
    return this.toConnectionView(updated, true);
  }

  async updateConnection(
    connectionId: string,
    organizationId: string,
    userId: string,
    input: UpdateWindsorConnectionInput,
  ): Promise<WindsorConnectionView> {
    const existing = await this.connections.findByIdForOrg(
      connectionId,
      organizationId,
    );
    if (!existing) throw new Error('Connection not found');

    const updated = await this.connections.update(connectionId, {
      name: input.name,
      workspaceId: input.workspaceId,
      syncIntervalMin: input.syncIntervalMin,
      autoSyncEnabled: input.autoSyncEnabled,
      isActive: input.isActive,
      config: input.config,
    });

    await this.audit.create({
      organizationId,
      userId,
      action: 'UPDATE',
      resourceType: 'windsor_connection',
      resourceId: connectionId,
      metadata: input as Record<string, unknown>,
    });

    const activeJob = await this.connections.findActiveSyncJob(connectionId);
    return this.toConnectionView(updated, !!activeJob);
  }

  async deleteConnection(
    connectionId: string,
    organizationId: string,
    userId: string,
  ): Promise<void> {
    const existing = await this.connections.findByIdForOrg(
      connectionId,
      organizationId,
    );
    if (!existing) throw new Error('Connection not found');

    await this.connections.delete(connectionId);

    await this.audit.create({
      organizationId,
      userId,
      action: 'DISCONNECT',
      resourceType: 'windsor_connection',
      resourceId: connectionId,
      metadata: { name: existing.name },
    });

    await cacheDeletePattern(`metrics:${organizationId}:*`);
  }

  async validateConnection(
    connectionId: string,
    organizationId: string,
  ): Promise<{ valid: boolean; connectorCount: number; accountCount: number }> {
    const connection = await this.connections.findByIdForOrg(
      connectionId,
      organizationId,
    );
    if (!connection) throw new Error('Connection not found');

    const apiKey = this.decryptApiKey(connection);
    const client = createWindsorClient(apiKey);

    try {
      const validation = await client.validateApiKey();
      let accountCount = 0;

      try {
        const accounts = await client.listConnectedAccounts();
        accountCount = accounts.length;
      } catch {
        accountCount = 0;
      }

      await this.connections.updateHealthStatus(
        connectionId,
        WindsorHealthStatus.HEALTHY,
      );

      await this.connections.createLog({
        connectionId,
        level: 'info',
        message: `Connection validated: ${validation.connectorCount} connectors, ${accountCount} accounts`,
        metadata: validation,
      });

      return { ...validation, accountCount };
    } catch (error) {
      await this.connections.updateHealthStatus(
        connectionId,
        WindsorHealthStatus.UNHEALTHY,
      );

      const message =
        error instanceof Error ? error.message : 'Validation failed';

      await this.connections.createLog({
        connectionId,
        level: 'error',
        message: `Validation failed: ${message}`,
      });

      throw error;
    }
  }

  async validateApiKey(apiKey: string): Promise<{
    valid: boolean;
    connectorCount: number;
  }> {
    const client = createWindsorClient(apiKey);
    return client.validateApiKey();
  }

  async enqueueSync(
    connectionId: string,
    organizationId: string,
    jobType: WindsorSyncJobType = 'manual',
    userId?: string,
  ): Promise<string> {
    const connection = await this.connections.findByIdForOrg(
      connectionId,
      organizationId,
    );
    if (!connection) throw new Error('Connection not found');
    if (!connection.isActive) throw new Error('Connection is inactive');

    const activeJob = await this.connections.findActiveSyncJob(connectionId);
    if (activeJob) {
      throw new Error('A sync job is already in progress');
    }

    const syncJob = await this.connections.createSyncJob({
      connectionId,
      jobType,
    });

    await enqueueJob(
      QUEUE_NAMES.WINDSOR_SYNC,
      'sync',
      { connectionId, syncJobId: syncJob.id, jobType },
      { jobId: syncJob.id },
    );

    await this.connections.createLog({
      connectionId,
      level: 'info',
      message: `Sync job enqueued (${jobType})`,
      metadata: { syncJobId: syncJob.id, jobType },
    });

    if (userId) {
      await this.audit.create({
        organizationId,
        userId,
        action: 'SYNC',
        resourceType: 'windsor_connection',
        resourceId: connectionId,
        metadata: { syncJobId: syncJob.id, jobType },
      });
    }

    return syncJob.id;
  }

  async getSyncJobs(
    connectionId: string,
    organizationId: string,
  ): Promise<WindsorSyncJobView[]> {
    const connection = await this.connections.findByIdForOrg(
      connectionId,
      organizationId,
    );
    if (!connection) throw new Error('Connection not found');

    const jobs = await this.connections.findRecentSyncJobs(connectionId);
    return jobs.map((job) => ({
      id: job.id,
      status: job.status,
      jobType: job.jobType,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      recordsProcessed: job.recordsProcessed,
      errorMessage: job.errorMessage,
      retryCount: job.retryCount,
      createdAt: job.createdAt,
    }));
  }

  async getConnectionLogs(
    connectionId: string,
    organizationId: string,
  ): Promise<WindsorConnectionLogView[]> {
    const connection = await this.connections.findByIdForOrg(
      connectionId,
      organizationId,
    );
    if (!connection) throw new Error('Connection not found');

    const logs = await this.connections.findRecentLogs(connectionId);
    return logs.map((log) => ({
      id: log.id,
      level: log.level,
      message: log.message,
      createdAt: log.createdAt,
    }));
  }

  async performSync(
    connectionId: string,
    syncJobId: string,
    jobType: WindsorSyncJobType = 'manual',
  ): Promise<number> {
    const connection = await this.connections.findById(connectionId);
    if (!connection) throw new Error('Connection not found');
    if (!connection.isActive) throw new Error('Connection is inactive');

    const apiKey = this.decryptApiKey(connection);
    const client = createWindsorClient(apiKey);
    const config = parseConfig(connection.config);
    const dateParams = getDatePresetForJobType(jobType, config);

    let totalRecords = 0;

    try {
      await this.connections.updateHealthStatus(
        connectionId,
        WindsorHealthStatus.HEALTHY,
      );

      for (const connector of config.connectors) {
        this.log.info({ connectionId, connector }, 'Fetching Windsor data');

        const rows = await client.fetchConnectorData({
          connector,
          fields: [...WINDSOR_SYNC_FIELDS],
          ...dateParams,
        });

        const normalized = rows
          .map((row) => normalizeWindsorRow(row, connector))
          .filter((row): row is NonNullable<typeof row> => row !== null);

        if (normalized.length === 0) continue;

        const result = await this.campaigns.syncFromNormalized(
          connection.organizationId,
          normalized,
        );

        totalRecords += result.metrics;

        await this.connections.createLog({
          connectionId,
          level: 'info',
          message: `Synced ${result.metrics} metric rows from ${connector}`,
          metadata: { connector, campaigns: result.campaigns, metrics: result.metrics },
        });
      }

      await this.connections.update(connectionId, {
        lastSyncAt: new Date(),
      });

      await cacheDeletePattern(`metrics:${connection.organizationId}:*`);

      return totalRecords;
    } catch (error) {
      const status =
        error instanceof WindsorApiError && error.statusCode === 429
          ? WindsorHealthStatus.DEGRADED
          : WindsorHealthStatus.UNHEALTHY;

      await this.connections.updateHealthStatus(connectionId, status);
      throw error;
    }
  }

  async scheduleDueSyncs(): Promise<number> {
    const dueConnections = await this.connections.findDueForAutoSync();
    let scheduled = 0;

    for (const connection of dueConnections) {
      try {
        await this.enqueueSync(
          connection.id,
          connection.organizationId,
          'incremental',
        );
        scheduled += 1;
      } catch (error) {
        this.log.warn(
          {
            connectionId: connection.id,
            error: error instanceof Error ? error.message : 'Unknown',
          },
          'Failed to schedule auto sync',
        );
      }
    }

    return scheduled;
  }
}
