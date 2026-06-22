"use server";

import { auth } from "../../auth";
import { prisma } from "../../lib/prisma";
import { checkPerformanceAnomalies } from "../../services/alert-engine";

/**
 * Fetches all campaign alerts for the active organization.
 * Automatically runs the performance anomaly auditor first.
 */
export async function fetchAlerts() {
  try {
    const session = await auth();
    if (!session || !session.orgId) {
      return { error: "Authentication required" };
    }

    const orgId = session.orgId;

    // Run performance audit checks
    await checkPerformanceAnomalies(orgId);

    // Query active alerts
    const alerts = await prisma.alert.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" }
    });

    return { success: true, alerts };
  } catch (err: any) {
    console.error("Fetch alerts action failure:", err);
    return { error: "Failed to load active alerts." };
  }
}

/**
 * Marks a specific alert as resolved.
 */
export async function resolveAlert(alertId: string) {
  try {
    const session = await auth();
    if (!session || !session.orgId) {
      return { error: "Authentication required" };
    }

    // Verify alert belongs to the organization
    const alert = await prisma.alert.findUnique({
      where: { id: alertId }
    });

    if (!alert || alert.orgId !== session.orgId) {
      return { error: "Unauthorized" };
    }

    await prisma.alert.update({
      where: { id: alertId },
      data: { isResolved: true }
    });

    return { success: true };
  } catch (err: any) {
    console.error("Resolve alert failure:", err);
    return { error: "Failed to resolve alert." };
  }
}
