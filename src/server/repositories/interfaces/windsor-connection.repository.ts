import type {
  WindsorConnection,
  WindsorConnectionLog,
  WindsorSyncJob,
  WindsorHealthStatus,
  Prisma,
} from '@prisma/client';
import type { WindsorConnectionConfig } from '@/features/windsor/types';

export interface CreateWindsorConnectionData {
  organizationId: string;
  name: string;
  workspaceId?: string | null;
  encryptedApiKey: string;
  encryptionIv: string;
  encryptionTag: string;
  syncIntervalMin: number;
  autoSyncEnabled: boolean;
  config: WindsorConnectionConfig;
}

export interface UpdateWindsorConnectionData {
  name?: string;
  workspaceId?: string | null;
  syncIntervalMin?: number;
  autoSyncEnabled?: boolean;
  isActive?: boolean;
  config?: WindsorConnectionConfig;
  healthStatus?: WindsorHealthStatus;
  lastHealthCheck?: Date;
  lastSyncAt?: Date;
}

export interface IWindsorConnectionRepository {
  findById(id: string): Promise<WindsorConnection | null>;
  findByIdForOrg(
    id: string,
    organizationId: string,
  ): Promise<WindsorConnection | null>;
  findAllForOrg(organizationId: string): Promise<WindsorConnection[]>;
  create(data: CreateWindsorConnectionData): Promise<WindsorConnection>;
  update(id: string, data: UpdateWindsorConnectionData): Promise<WindsorConnection>;
  delete(id: string): Promise<void>;
  createSyncJob(data: {
    connectionId: string;
    jobType: string;
    scheduledAt?: Date;
  }): Promise<WindsorSyncJob>;
  updateSyncJob(
    id: string,
    data: Prisma.WindsorSyncJobUpdateInput,
  ): Promise<WindsorSyncJob>;
  findSyncJobById(id: string): Promise<WindsorSyncJob | null>;
  findActiveSyncJob(connectionId: string): Promise<WindsorSyncJob | null>;
  findRecentSyncJobs(
    connectionId: string,
    limit?: number,
  ): Promise<WindsorSyncJob[]>;
  createLog(data: {
    connectionId: string;
    level: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<WindsorConnectionLog>;
  findRecentLogs(
    connectionId: string,
    limit?: number,
  ): Promise<WindsorConnectionLog[]>;
  findDueForAutoSync(): Promise<WindsorConnection[]>;
  findAllActive(): Promise<WindsorConnection[]>;
  updateHealthStatus(
    id: string,
    status: WindsorHealthStatus,
  ): Promise<void>;
}
