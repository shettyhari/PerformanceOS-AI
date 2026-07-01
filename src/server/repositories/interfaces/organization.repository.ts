import type { Organization, OrganizationMember, UserRole } from '@prisma/client';

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  ownerId: string;
}

export interface IOrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  createWithOwner(input: CreateOrganizationInput): Promise<Organization>;
  addMember(
    organizationId: string,
    userId: string,
    role: UserRole,
  ): Promise<OrganizationMember>;
  getMembers(organizationId: string): Promise<OrganizationMember[]>;
  isSlugAvailable(slug: string): Promise<boolean>;
  generateUniqueSlug(baseName: string): Promise<string>;
}
