import React from "react";
import { fetchAlerts } from "../../../server/actions/alerts";
import { OnboardingPanel } from "../../../components/dashboard/onboarding";
import { AlertsView } from "../../../components/dashboard/alerts-view";

export const metadata = {
  title: "Alert Center - PerformanceOS AI",
};

export default async function AlertsPage() {
  const res = await fetchAlerts();

  if (res.error || !res.alerts) {
    return <OnboardingPanel />;
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-display font-medium tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
          Alert Command Center
        </h1>
        <p className="text-neutral-400 text-sm mt-1.5 font-light">
          Monitor spend anomalies, ROAS performance drifts, and CPA alert triggers across platforms.
        </p>
      </div>

      <AlertsView alerts={res.alerts as any} />
    </div>
  );
}
