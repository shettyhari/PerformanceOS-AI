import React from "react";
import { useGetMe, useGetDashboardSummary, useGetAnalyticsData } from "@workspace/api-client-react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { OnboardingPanel } from "@/components/dashboard/onboarding";

export default function DashboardPage() {
  const { data: user } = useGetMe();
  const { data, isLoading, error } = useGetDashboardSummary();
  const { data: analyticsData } = useGetAnalyticsData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-neutral-400 text-sm">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <OnboardingPanel />;
  }

  return <DashboardView data={data as any} userName={(user as any)?.name || "User"} analyticsData={analyticsData as any} />;
}
