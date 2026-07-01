import 'server-only';

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import type {
  CreateAuditLogInput,
  IAuditRepository,
} from '@/server/repositories/interfaces/audit.repository';

export class PrismaAuditRepository implements IAuditRepository {
  async create(input: CreateAuditLogInput): Promise<void> {
    await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }
}

export const auditRepository = new PrismaAuditRepository();
