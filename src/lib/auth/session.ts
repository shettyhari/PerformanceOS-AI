import 'server-only';

import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '@/lib/auth/config';
import { hasPermission, type Permission } from '@/lib/auth/rbac';

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await requireSession();
  if (!hasPermission(session.user.role, permission)) {
    throw new Error('Forbidden');
  }
  return session;
}

export interface AuthContext {
  userId: string;
  organizationId: string;
  organizationSlug: string;
  role: UserRole;
  email: string;
  name: string | null | undefined;
  image: string | null | undefined;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await getSession();
  if (!session?.user?.id || !session.user.organizationId) return null;

  return {
    userId: session.user.id,
    organizationId: session.user.organizationId,
    organizationSlug: session.user.organizationSlug,
    role: session.user.role,
    email: session.user.email ?? '',
    name: session.user.name,
    image: session.user.image,
  };
}

export async function requireAuthContext(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) {
    throw new Error('Unauthorized');
  }
  return context;
}
