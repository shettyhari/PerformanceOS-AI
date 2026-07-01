import 'server-only';

import { UserRole } from '@prisma/client';
import type { IUserRepository } from '@/server/repositories/interfaces/user.repository';
import type { IOrganizationRepository } from '@/server/repositories/interfaces/organization.repository';
import type { IAuditRepository } from '@/server/repositories/interfaces/audit.repository';

export interface ProvisionUserInput {
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface SessionContext {
  userId: string;
  organizationId: string;
  organizationSlug: string;
  role: UserRole;
}

export class AuthService {
  constructor(
    private readonly users: IUserRepository,
    private readonly organizations: IOrganizationRepository,
    private readonly audit: IAuditRepository,
  ) {}

  async provisionOAuthUser(input: ProvisionUserInput): Promise<SessionContext> {
    const existing = await this.users.findByEmail(input.email);

    if (existing) {
      const membership = await this.users.getPrimaryMembership(existing.id);
      if (membership) {
        return {
          userId: existing.id,
          ...membership,
        };
      }

      const orgName = input.name
        ? `${input.name}'s Organization`
        : 'My Organization';
      const slug = await this.organizations.generateUniqueSlug(orgName);

      const org = await this.organizations.createWithOwner({
        name: orgName,
        slug,
        ownerId: existing.id,
      });

      return {
        userId: existing.id,
        organizationId: org.id,
        organizationSlug: org.slug,
        role: UserRole.OWNER,
      };
    }

    const user = await this.users.create({
      email: input.email,
      name: input.name,
      image: input.image,
      emailVerified: new Date(),
    });

    const orgName = input.name
      ? `${input.name}'s Organization`
      : 'My Organization';
    const slug = await this.organizations.generateUniqueSlug(orgName);

    const org = await this.organizations.createWithOwner({
      name: orgName,
      slug,
      ownerId: user.id,
    });

    await this.audit.create({
      userId: user.id,
      organizationId: org.id,
      action: 'CREATE',
      resourceType: 'user',
      resourceId: user.id,
      metadata: { source: 'oauth' },
    });

    return {
      userId: user.id,
      organizationId: org.id,
      organizationSlug: org.slug,
      role: UserRole.OWNER,
    };
  }

  async resolveSessionContext(userId: string): Promise<SessionContext | null> {
    const user = await this.users.findById(userId);
    if (!user) return null;

    const membership = await this.users.getPrimaryMembership(userId);
    if (!membership) return null;

    return {
      userId,
      ...membership,
    };
  }

  async logAuthEvent(
    action: 'LOGIN' | 'LOGOUT',
    userId: string,
    organizationId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.audit.create({
      userId,
      organizationId,
      action,
      resourceType: 'session',
      metadata,
    });
  }
}
