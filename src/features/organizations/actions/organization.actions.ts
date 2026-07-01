'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { auditRepository } from '@/server/repositories/prisma/audit.repository';

const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  timezone: z.string().min(1),
  currency: z.string().length(3),
});

export type UpdateOrganizationState = {
  success: boolean;
  error?: string;
};

export async function updateOrganization(
  _prev: UpdateOrganizationState,
  formData: FormData,
): Promise<UpdateOrganizationState> {
  try {
    const session = await requirePermission('settings:write');

    const parsed = updateOrganizationSchema.safeParse({
      name: formData.get('name'),
      timezone: formData.get('timezone'),
      currency: formData.get('currency'),
    });

    if (!parsed.success) {
      return { success: false, error: 'Invalid organization data' };
    }

    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: parsed.data,
    });

    await auditRepository.create({
      userId: session.user.id,
      organizationId: session.user.organizationId,
      action: 'UPDATE',
      resourceType: 'organization',
      resourceId: session.user.organizationId,
      metadata: parsed.data,
    });

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed',
    };
  }
}
