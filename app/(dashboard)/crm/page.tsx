import React from "react";
import { getWindsorConnection } from "../../../server/actions/windsor";
import { OnboardingPanel } from "../../../components/dashboard/onboarding";
import { Users, AlertTriangle, Plus, PlusCircle } from "lucide-react";

export const metadata = {
  title: "CRM Leads Tracker - PerformanceOS AI",
};

export default async function CRMPage() {
  const res = await getWindsorConnection();

  if (res.error || !res.connection) {
    return <OnboardingPanel />;
  }

  const stages = ["New Leads", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            CRM Leads Pipeline
          </h1>
          <p className="text-neutral-400 text-sm mt-1.5 font-light">
            Track customer acquisition lifecycles, and attribute lead sources to active campaigns.
          </p>
        </div>
        
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-white text-black font-medium hover:bg-neutral-200 active:scale-95 transition text-xs cursor-pointer">
          <PlusCircle className="w-3.5 h-3.5" />
          Add Lead
        </button>
      </div>

      {/* Kanban Board Stage Headers */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {stages.map((stage) => (
          <div key={stage} className="glass-card rounded-[20px] p-4 border border-white/5 bg-[#020203]/25 flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-white tracking-wide">{stage}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-500 font-medium">0</span>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/[0.04] rounded-[14px] p-4 text-center">
              <Users className="w-6 h-6 text-neutral-700 mb-2" />
              <span className="text-[10px] text-neutral-600 font-light">No leads in this stage.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
