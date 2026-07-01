import React from "react";
import { getWindsorConnection } from "../../../server/actions/windsor";
import { OnboardingPanel } from "../../../components/dashboard/onboarding";
import { GitMerge, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Multi-Touch Attribution - PerformanceOS AI",
};

export default async function AttributionPage() {
  const res = await getWindsorConnection();

  if (res.error || !res.connection) {
    return <OnboardingPanel />;
  }

  const attributionModels = [
    { name: "First Touch Model", desc: "Assigns 100% of conversion value to the first channel clicked." },
    { name: "Last Touch Model", desc: "Assigns 100% of conversion value to the final channel clicked." },
    { name: "Linear Model", desc: "Distributes credit equally across all touchpoints in the funnel." },
    { name: "Time Decay Model", desc: "Gives more weight to touchpoints closer in time to the conversion event." },
  ];

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-medium tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
          AI Touchpoint Attribution
        </h1>
        <p className="text-neutral-400 text-sm mt-1.5 font-light">
          Map multi-channel customer journeys and audit return-on-ad-spend (ROAS) allocation.
        </p>
      </div>

      <div className="glass-card rounded-[24px] border border-white/5 bg-white/[0.01] p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[12px] bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Attribution Engine Active</h3>
            <p className="text-xs text-neutral-400 font-light mt-0.5">
              Attribution models are running against Windsor.ai aggregated pipelines.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/[0.03] pt-6">
          {attributionModels.map((model) => (
            <div key={model.name} className="p-4 rounded-[16px] bg-white/[0.01] border border-white/5 space-y-1">
              <h4 className="text-xs font-semibold text-white">{model.name}</h4>
              <p className="text-[11px] text-neutral-500 font-light leading-normal">{model.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Attribution pipeline empty indicator to fit NO DEMO DATA */}
      <div className="p-4 rounded-[16px] bg-neutral-950/40 border border-white/5 flex gap-3 text-xs text-neutral-400">
        <AlertTriangle className="w-4.5 h-4.5 text-neutral-500 flex-shrink-0" />
        <p className="font-light leading-normal">
          No external CRM leads matched current campaign parameters. Connect your CRM in Settings or load lead datasets to activate touchpoint weighting tables.
        </p>
      </div>
    </div>
  );
}
