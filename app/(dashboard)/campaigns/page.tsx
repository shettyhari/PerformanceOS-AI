import React from "react";
import { fetchAnalyticsData } from "../../../server/actions/analytics";
import { OnboardingPanel } from "../../../components/dashboard/onboarding";
import { CampaignsTable } from "../../../components/dashboard/campaigns-table";

export const metadata = {
  title: "Campaign Manager - PerformanceOS AI",
};

export default async function CampaignsPage() {
  const res = await fetchAnalyticsData();

  if (res.error || !res.data) {
    return <OnboardingPanel />;
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-display font-medium tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
          Campaign Manager
        </h1>
        <p className="text-neutral-400 text-sm mt-1.5 font-light">
          Monitor and audit active marketing campaigns across all synced platforms.
        </p>
      </div>

      <CampaignsTable campaigns={res.data.campaigns} />
    </div>
  );
}
