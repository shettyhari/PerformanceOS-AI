import type { AuditAction } from '@prisma/client';

export interface CreateAuditLogInput {
  organizationId?: string;
  userId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface IAuditRepository {
  create(input: CreateAuditLogInput): Promise<void>;
}
