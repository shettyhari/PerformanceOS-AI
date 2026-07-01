import React from "react";
import { useGetAnalyticsData } from "@workspace/api-client-react";
import { OnboardingPanel } from "@/components/dashboard/onboarding";
import { CampaignsTable } from "@/components/dashboard/campaigns-table";

export default function CampaignsPage() {
  const { data, isLoading, error } = useGetAnalyticsData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-neutral-400 text-sm">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          Loading campaigns...
        </div>
      </div>
    );
  }

  if (error || !data) return <OnboardingPanel />;

  const { campaigns } = data as any;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
          Campaign Manager
        </h1>
        <p className="text-neutral-400 text-sm mt-1.5 font-light">
          Monitor and audit active marketing campaigns across all synced platforms.
        </p>
      </div>
      <CampaignsTable campaigns={campaigns || []} />
    </div>
  );
}
