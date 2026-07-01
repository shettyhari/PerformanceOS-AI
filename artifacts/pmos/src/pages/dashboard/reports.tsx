import React, { useState } from "react";
import { useGetWindsorConnection } from "@workspace/api-client-react";
import { OnboardingPanel } from "@/components/dashboard/onboarding";
import { FileSpreadsheet, Mail, Calendar, MessageSquare, Plus, Download, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const reportsConfig = [
  { title: "Weekly Executive Summary", format: "PDF", schedule: "Every Monday 8:00 AM", channels: ["Email", "Slack"] },
  { title: "Consolidated ROAS Audit", format: "Excel", schedule: "Monthly (1st Day)", channels: ["Email"] },
  { title: "Daily Spend Alerts", format: "PDF", schedule: "Daily 9:00 PM", channels: ["Telegram"] },
];

const reportTemplates = [
  { name: "Campaign Performance Report", desc: "Complete cross-channel campaign metrics with ROAS, CPA, CTR breakdowns", format: "PDF" },
  { name: "Executive Spend Summary", desc: "High-level budget allocation and ROI summary for stakeholder review", format: "PDF" },
  { name: "Platform Comparison Matrix", desc: "Side-by-side comparison of Google, Meta, LinkedIn, and Microsoft metrics", format: "Excel" },
  { name: "Attribution Analysis Report", desc: "Multi-touch attribution breakdown across all tracked conversion events", format: "PDF" },
];

export default function ReportsPage() {
  const { data: connection, isLoading } = useGetWindsorConnection();
  const [exported, setExported] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-neutral-400 text-sm">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          Loading reports...
        </div>
      </div>
    );
  }

  if (!connection || !(connection as any).connected) return <OnboardingPanel />;

  const handleExport = (name: string) => {
    setExported(name);
    setTimeout(() => setExported(null), 2000);
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Scheduled Reporting
          </h1>
          <p className="text-neutral-400 text-sm mt-1.5 font-light">
            Configure automated PDF, Excel, and PowerPoint exports and schedule delivery via Email, Slack, or Telegram.
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-white text-black font-medium hover:bg-neutral-200 active:scale-95 transition text-xs cursor-pointer flex-shrink-0">
          <Plus className="w-3.5 h-3.5" />
          New Schedule
        </button>
      </div>

      {/* Active Schedules */}
      <div>
        <h3 className="font-medium text-sm text-white mb-4">Active Report Schedules</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportsConfig.map((rep) => (
            <motion.div key={rep.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[20px] p-5 border border-white/5 bg-white/[0.01] space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">{rep.format} Report</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{rep.title}</h4>
                <p className="text-[11px] text-neutral-500 font-light flex items-center gap-1 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {rep.schedule}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap border-t border-white/[0.03] pt-3 text-[10px] text-neutral-400 font-light items-center">
                <span>Deliver via:</span>
                {rep.channels.map((chan) => (
                  <span key={chan} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[9px] font-medium text-purple-400">{chan}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Report Templates */}
      <div>
        <h3 className="font-medium text-sm text-white mb-4">On-Demand Report Templates</h3>
        <div className="glass-card rounded-[24px] border border-white/5 bg-white/[0.01] divide-y divide-white/[0.03]">
          {reportTemplates.map((template) => (
            <div key={template.name} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-[8px] bg-white/[0.02] border border-white/5 flex items-center justify-center text-neutral-400 flex-shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white">{template.name}</p>
                  <p className="text-[11px] text-neutral-500 font-light mt-0.5">{template.desc}</p>
                </div>
              </div>
              <button
                onClick={() => handleExport(template.name)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] text-[10px] font-medium text-neutral-300 hover:text-white transition cursor-pointer flex-shrink-0"
              >
                {exported === template.name ? (
                  <><CheckCircle2 className="w-3 h-3 text-emerald-400" />Exported!</>
                ) : (
                  <><Download className="w-3 h-3" />Export {template.format}</>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
