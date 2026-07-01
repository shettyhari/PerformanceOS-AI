import { describe, it, expect } from 'vitest';
import { hasPermission, hasMinimumRole } from '@/lib/auth/rbac';
import { UserRole } from '@prisma/client';

describe('RBAC', () => {
  it('grants org:read to all roles', () => {
    expect(hasPermission(UserRole.VIEWER, 'org:read')).toBe(true);
    expect(hasPermission(UserRole.OWNER, 'org:read')).toBe(true);
  });

  it('restricts billing:manage to owner', () => {
    expect(hasPermission(UserRole.OWNER, 'billing:manage')).toBe(true);
    expect(hasPermission(UserRole.ADMIN, 'billing:manage')).toBe(false);
  });

  it('enforces role hierarchy', () => {
    expect(hasMinimumRole(UserRole.ADMIN, UserRole.MANAGER)).toBe(true);
    expect(hasMinimumRole(UserRole.VIEWER, UserRole.ADMIN)).toBe(false);
  });
});

describe('Utils', () => {
  it('slugifies text', async () => {
    const { slugify } = await import('@/lib/utils');
    expect(slugify('Acme Marketing Inc.')).toBe('acme-marketing-inc');
  });
});
