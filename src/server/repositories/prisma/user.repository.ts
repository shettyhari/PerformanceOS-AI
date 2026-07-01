import 'server-only';

import type { User } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import type {
  CreateUserInput,
  IUserRepository,
  UserWithMembership,
} from '@/server/repositories/interfaces/user.repository';

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<UserWithMembership | null> {
    return prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        organizationMembers: {
          include: {
            organization: { select: { id: true, slug: true, name: true } },
          },
          orderBy: { joinedAt: 'desc' },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<UserWithMembership | null> {
    return prisma.user.findUnique({
      where: { email, deletedAt: null },
      include: {
        organizationMembers: {
          include: {
            organization: { select: { id: true, slug: true, name: true } },
          },
          orderBy: { joinedAt: 'desc' },
        },
      },
    });
  }

  async create(data: CreateUserInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async updateProfile(
    id: string,
    data: { name?: string; image?: string },
  ): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async getMembership(userId: string, organizationId: string) {
    return prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });
  }

  async getPrimaryMembership(userId: string) {
    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: { select: { id: true, slug: true } } },
      orderBy: [{ role: 'asc' }, { joinedAt: 'desc' }],
    });

    if (!membership) return null;

    return {
      organizationId: membership.organizationId,
      organizationSlug: membership.organization.slug,
      role: membership.role,
    };
  }
}

export const userRepository = new PrismaUserRepository();
