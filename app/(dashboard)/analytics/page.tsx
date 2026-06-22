import React from "react";
import { fetchAnalyticsData } from "../../../server/actions/analytics";
import { OnboardingPanel } from "../../../components/dashboard/onboarding";
import { InteractiveCharts } from "../../../components/charts/interactive-charts";
import { CampaignsTable } from "../../../components/dashboard/campaigns-table";
import { DollarSign, Percent, TrendingUp, Sparkles } from "lucide-react";

export const metadata = {
  title: "Analytics - PerformanceOS AI",
};

export default async function AnalyticsPage() {
  const res = await fetchAnalyticsData();

  if (res.error || !res.data) {
    return <OnboardingPanel />;
  }

  const { timeSeries, campaigns, platformsSummary } = res.data;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-display font-medium tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
          Multi-Channel Analytics
        </h1>
        <p className="text-neutral-400 text-sm mt-1.5 font-light">
          Deep-dive campaign performance. Analyze Google, Meta, LinkedIn, and Microsoft ads side-by-side.
        </p>
      </div>

      {/* Platform Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {platformsSummary.map((platform) => (
          <div
            key={platform.name}
            className="glass-card rounded-[20px] p-5 border border-white/5 bg-white/[0.01]"
          >
            <span className={`inline-block px-2 py-0.5 rounded-[6px] text-[9px] font-semibold uppercase tracking-wider mb-3 ${
              platform.name === "GOOGLE_ADS" ? "bg-blue-950/40 border border-blue-500/20 text-blue-400" :
              platform.name === "META_ADS" ? "bg-emerald-950/40 border border-emerald-500/20 text-emerald-400" :
              platform.name === "LINKEDIN_ADS" ? "bg-purple-950/40 border border-purple-500/20 text-purple-400" :
              "bg-yellow-950/40 border border-yellow-500/20 text-yellow-400"
            }`}>
              {platform.name.replace("_", " ")}
            </span>
            <div className="space-y-2 mt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-light">Spend</span>
                <span className="font-mono text-white font-medium">{formatCurrency(platform.spend)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-light">Revenue</span>
                <span className="font-mono text-white font-medium">{formatCurrency(platform.revenue)}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-white/[0.03] pt-2">
                <span className="text-neutral-400 font-medium">ROAS</span>
                <span className={`font-mono font-semibold ${platform.roas >= 2 ? "text-emerald-400" : "text-yellow-500"}`}>
                  {platform.roas.toFixed(2)}x
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Interactive Recharts */}
      <InteractiveCharts data={timeSeries} />

      {/* Campaign Details Table */}
      <div>
        <h3 className="font-display font-medium text-sm text-white mb-4">
          All Campaign Performance Records
        </h3>
        <CampaignsTable campaigns={campaigns} />
      </div>
    </div>
  );
}
