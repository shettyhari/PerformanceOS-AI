"use server";

import { auth } from "../../auth";
import { prisma } from "../../lib/prisma";
import { validateWindsorApiKey } from "../../lib/windsor";
import { encrypt } from "../../lib/crypto";
import { runWindsorSync } from "../../services/sync-service";

/**
 * Validates and saves the Windsor.ai API Connection for the active user organization.
 */
export async function connectWindsor(apiKey: string) {
  try {
    const session = await auth();
    if (!session || !session.orgId) {
      return { error: "Authentication required" };
    }

    const orgId = session.orgId;

    // Validate connection health directly with Windsor.ai
    const isValid = await validateWindsorApiKey(apiKey);
    if (!isValid) {
      return { error: "Invalid Windsor.ai API Key. Connection failed." };
    }

    const encryptedKey = encrypt(apiKey);

    // Save/Upsert Connection details in organization context
    const connection = await prisma.windsorConnection.upsert({
      where: { orgId },
      update: {
        apiKeyEncrypted: encryptedKey,
        syncStatus: "PENDING",
      },
      create: {
        orgId,
        apiKeyEncrypted: encryptedKey,
        syncStatus: "PENDING",
      },
    });

    // Write audit log trace
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CONNECT_WINDSOR",
        entityType: "WindsorConnection",
        entityId: connection.id,
      },
    });

    return { success: true, connectionId: connection.id };
  } catch (err: any) {
    console.error("Save Windsor connection failed:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Retrieves the current organization's Windsor.ai connection status and logs.
 */
export async function getWindsorConnection() {
  try {
    const session = await auth();
    if (!session || !session.orgId) {
      return { error: "Authentication required" };
    }

    const connection = await prisma.windsorConnection.findUnique({
      where: { orgId: session.orgId },
      select: {
        id: true,
        syncStatus: true,
        lastSyncAt: true,
        createdAt: true,
        syncLogs: {
          orderBy: { timestamp: "desc" },
          take: 5,
        },
      },
    });

    return { success: true, connection };
  } catch (err: any) {
    console.error("Get Windsor connection failed:", err);
    return { error: "Failed to retrieve connection status." };
  }
}

/**
 * Disconnects Windsor.ai from the current organization.
 */
export async function disconnectWindsor() {
  try {
    const session = await auth();
    if (!session || !session.orgId) {
      return { error: "Authentication required" };
    }

    const orgId = session.orgId;

    // Retrieve active connection to log audit correctly
    const connection = await prisma.windsorConnection.findUnique({
      where: { orgId },
    });

    if (connection) {
      await prisma.windsorConnection.delete({
        where: { orgId },
      });

      // Write audit log trace
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DISCONNECT_WINDSOR",
          entityType: "WindsorConnection",
          entityId: connection.id,
        },
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error("Disconnect Windsor connection failed:", err);
    return { error: "An unexpected error occurred." };
  }
}

/**
 * Triggers an immediate, manual data synchronization for the user's active organization.
 */
export async function triggerManualSync() {
  try {
    const session = await auth();
    if (!session || !session.orgId) {
      return { error: "Authentication required" };
    }

    const result = await runWindsorSync(session.orgId);
    return { success: true, rowsSynced: result.rowsSynced };
  } catch (err: any) {
    console.error("Manual sync trigger failure:", err);
    return { error: err.message || "Manual sync process failed." };
  }
}
