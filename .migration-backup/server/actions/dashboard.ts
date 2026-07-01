"use server";

import { auth } from "../../auth";
import { getDashboardData } from "../../services/dashboard-service";

/**
 * Server Action to retrieve processed dashboard metrics.
 * Ensures the request is authenticated and organization-scoped.
 */
export async function fetchDashboardSummary() {
  try {
    const session = await auth();
    if (!session || !session.orgId) {
      return { error: "Authentication required" };
    }

    const data = await getDashboardData(session.orgId);
    return { success: true, data };
  } catch (err: any) {
    console.error("Fetch dashboard action failure:", err);
    return { error: "Failed to load dashboard metrics. Please refresh." };
  }
}
