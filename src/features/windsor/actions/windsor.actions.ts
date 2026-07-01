'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/session';
import { windsorService } from '@/server/services';
import {
  createWindsorConnectionSchema,
  updateWindsorConnectionSchema,
  validateWindsorApiKeySchema,
} from '@/lib/validation/windsor';
import { WINDSOR_MARKETING_CONNECTORS } from '@/features/windsor/types';

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

function parseConnectors(formData: FormData): string[] {
  return WINDSOR_MARKETING_CONNECTORS.filter(
    (connector) => formData.get(`connector_${connector}`) === 'on',
  );
}

export async function createWindsorConnection(
  _prev: ActionResult<{ connectionId: string }>,
  formData: FormData,
): Promise<ActionResult<{ connectionId: string }>> {
  try {
    const session = await requirePermission('integrations:write');

    const connectors = parseConnectors(formData);
    const parsed = createWindsorConnectionSchema.safeParse({
      name: formData.get('name'),
      apiKey: formData.get('apiKey'),
      workspaceId: formData.get('workspaceId') || undefined,
      syncIntervalMin: formData.get('syncIntervalMin'),
      autoSyncEnabled: formData.get('autoSyncEnabled') === 'on',
      config: {
        connectors: connectors.length > 0 ? connectors : undefined,
        datePreset: formData.get('datePreset') || 'last_30d',
      },
    });

    if (!parsed.success) {
      return { success: false, error: 'Invalid connection data' };
    }

    const connection = await windsorService.createConnection(
      session.user.organizationId,
      session.user.id,
      parsed.data,
    );

    revalidatePath('/dashboard/settings/integrations');
    return { success: true, data: { connectionId: connection.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create connection',
    };
  }
}

export async function updateWindsorConnection(
  connectionId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requirePermission('integrations:write');

    const connectors = parseConnectors(formData);
    const parsed = updateWindsorConnectionSchema.safeParse({
      name: formData.get('name') || undefined,
      workspaceId: formData.get('workspaceId') || undefined,
      syncIntervalMin: formData.get('syncIntervalMin') || undefined,
      autoSyncEnabled:
        formData.get('autoSyncEnabled') === 'on'
          ? true
          : formData.get('autoSyncEnabled') === 'off'
            ? false
            : undefined,
      isActive:
        formData.get('isActive') === 'on'
          ? true
          : formData.get('isActive') === 'off'
            ? false
            : undefined,
      config:
        connectors.length > 0
          ? {
              connectors,
              datePreset: formData.get('datePreset') || 'last_30d',
            }
          : undefined,
    });

    if (!parsed.success) {
      return { success: false, error: 'Invalid update data' };
    }

    await windsorService.updateConnection(
      connectionId,
      session.user.organizationId,
      session.user.id,
      parsed.data,
    );

    revalidatePath('/dashboard/settings/integrations');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update connection',
    };
  }
}

export async function deleteWindsorConnection(
  connectionId: string,
): Promise<ActionResult> {
  try {
    const session = await requirePermission('integrations:write');

    await windsorService.deleteConnection(
      connectionId,
      session.user.organizationId,
      session.user.id,
    );

    revalidatePath('/dashboard/settings/integrations');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete connection',
    };
  }
}

export async function triggerWindsorSync(
  connectionId: string,
): Promise<ActionResult<{ syncJobId: string }>> {
  try {
    const session = await requirePermission('windsor:sync');

    const syncJobId = await windsorService.enqueueSync(
      connectionId,
      session.user.organizationId,
      'manual',
      session.user.id,
    );

    revalidatePath('/dashboard/settings/integrations');
    return { success: true, data: { syncJobId } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger sync',
    };
  }
}

export async function validateWindsorConnection(
  connectionId: string,
): Promise<
  ActionResult<{ connectorCount: number; accountCount: number }>
> {
  try {
    const session = await requirePermission('integrations:read');

    const result = await windsorService.validateConnection(
      connectionId,
      session.user.organizationId,
    );

    revalidatePath('/dashboard/settings/integrations');
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}

export async function validateWindsorApiKey(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult<{ connectorCount: number }>> {
  try {
    await requirePermission('integrations:write');

    const parsed = validateWindsorApiKeySchema.safeParse({
      apiKey: formData.get('apiKey'),
    });

    if (!parsed.success) {
      return { success: false, error: 'Invalid API key' };
    }

    const result = await windsorService.validateApiKey(parsed.data.apiKey);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'API key validation failed',
    };
  }
}

export async function getWindsorConnections() {
  const session = await requirePermission('integrations:read');
  return windsorService.listConnections(session.user.organizationId);
}

export async function getWindsorConnectionDetails(connectionId: string) {
  const session = await requirePermission('integrations:read');

  const [connection, syncJobs, logs] = await Promise.all([
    windsorService.getConnection(connectionId, session.user.organizationId),
    windsorService.getSyncJobs(connectionId, session.user.organizationId),
    windsorService.getConnectionLogs(connectionId, session.user.organizationId),
  ]);

  return { connection, syncJobs, logs };
}
