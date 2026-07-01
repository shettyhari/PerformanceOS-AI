import 'server-only';

import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { slugify } from '@/lib/utils';
import type {
  CreateOrganizationInput,
  IOrganizationRepository,
} from '@/server/repositories/interfaces/organization.repository';

export class PrismaOrganizationRepository implements IOrganizationRepository {
  async findById(id: string) {
    return prisma.organization.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findBySlug(slug: string) {
    return prisma.organization.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  async createWithOwner(input: CreateOrganizationInput) {
    return prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.name,
          slug: input.slug,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: input.ownerId,
          role: UserRole.OWNER,
          joinedAt: new Date(),
        },
      });

      await tx.subscription.create({
        data: {
          organizationId: organization.id,
          plan: 'FREE',
          status: 'TRIALING',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });

      return organization;
    });
  }

  async addMember(organizationId: string, userId: string, role: UserRole) {
    return prisma.organizationMember.create({
      data: {
        organizationId,
        userId,
        role,
        joinedAt: new Date(),
      },
    });
  }

  async getMembers(organizationId: string) {
    return prisma.organizationMember.findMany({
      where: { organizationId },
    });
  }

  async isSlugAvailable(slug: string) {
    const existing = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    return !existing;
  }

  async generateUniqueSlug(baseName: string): Promise<string> {
    let slug = slugify(baseName);
    let suffix = 0;

    while (!(await this.isSlugAvailable(slug))) {
      suffix += 1;
      slug = `${slugify(baseName)}-${suffix}`;
    }

    return slug;
  }
}

export const organizationRepository = new PrismaOrganizationRepository();
