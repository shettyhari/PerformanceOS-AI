import React from "react";
import { auth } from "../../auth";
import { fetchDashboardSummary } from "../../server/actions/dashboard";
import { OnboardingPanel } from "../../components/dashboard/onboarding";
import { DashboardView } from "../../components/dashboard/dashboard-view";

export const metadata = {
  title: "AI Command Center - PerformanceOS AI",
};

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || "User";

  const res = await fetchDashboardSummary();

  // If there's an error fetching or no connection exists (no database records)
  if (res.error || !res.data) {
    return <OnboardingPanel />;
  }

  return <DashboardView data={res.data} userName={userName} />;
}
