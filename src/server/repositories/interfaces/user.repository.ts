import type { User, OrganizationMember, UserRole } from '@prisma/client';

export interface UserWithMembership extends User {
  organizationMembers: (OrganizationMember & {
    organization: { id: string; slug: string; name: string };
  })[];
}

export interface CreateUserInput {
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified?: Date | null;
}

export interface IUserRepository {
  findById(id: string): Promise<UserWithMembership | null>;
  findByEmail(email: string): Promise<UserWithMembership | null>;
  create(data: CreateUserInput): Promise<User>;
  updateProfile(
    id: string,
    data: { name?: string; image?: string },
  ): Promise<User>;
  getMembership(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMember | null>;
  getPrimaryMembership(userId: string): Promise<{
    organizationId: string;
    organizationSlug: string;
    role: UserRole;
  } | null>;
}
