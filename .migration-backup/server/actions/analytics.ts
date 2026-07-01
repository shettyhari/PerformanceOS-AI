"use server";

import { auth } from "../../auth";
import { getAnalyticsData } from "../../services/analytics-service";

/**
 * Server Action to retrieve data for the cross-platform charts and campaign lists.
 */
export async function fetchAnalyticsData() {
  try {
    const session = await auth();
    if (!session || !session.orgId) {
      return { error: "Authentication required" };
    }

    const data = await getAnalyticsData(session.orgId);
    return { success: true, data };
  } catch (err: any) {
    console.error("Fetch analytics action failure:", err);
    return { error: "Failed to load analytics metrics." };
  }
}
