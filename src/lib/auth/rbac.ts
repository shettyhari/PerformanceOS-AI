import { UserRole } from '@prisma/client';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 100,
  ADMIN: 80,
  MANAGER: 60,
  ANALYST: 40,
  VIEWER: 20,
};

export const PERMISSIONS = {
  'org:read': [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.ANALYST, UserRole.VIEWER],
  'org:update': [UserRole.OWNER, UserRole.ADMIN],
  'org:delete': [UserRole.OWNER],
  'members:invite': [UserRole.OWNER, UserRole.ADMIN],
  'members:remove': [UserRole.OWNER, UserRole.ADMIN],
  'members:update_role': [UserRole.OWNER, UserRole.ADMIN],
  'campaigns:read': [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.ANALYST, UserRole.VIEWER],
  'campaigns:write': [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],
  'reports:read': [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.ANALYST, UserRole.VIEWER],
  'reports:write': [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.ANALYST],
  'reports:schedule': [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],
  'crm:read': [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.ANALYST, UserRole.VIEWER],
  'crm:write': [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.ANALYST],
  'integrations:read': [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],
  'integrations:write': [UserRole.OWNER, UserRole.ADMIN],
  'windsor:sync': [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],
  'athena:use': [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.ANALYST],
  'settings:read': [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],
  'settings:write': [UserRole.OWNER, UserRole.ADMIN],
  'billing:manage': [UserRole.OWNER],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}

export function hasMinimumRole(role: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimumRole];
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    ANALYST: 'Analyst',
    VIEWER: 'Viewer',
  };
  return labels[role];
}
