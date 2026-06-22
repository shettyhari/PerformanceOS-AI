import React from "react";
import { getWindsorConnection } from "../../../server/actions/windsor";
import { OnboardingPanel } from "../../../components/dashboard/onboarding";
import { FileSpreadsheet, Mail, Calendar, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Reports Scheduler - PerformanceOS AI",
};

export default async function ReportsPage() {
  const res = await getWindsorConnection();

  if (res.error || !res.connection) {
    return <OnboardingPanel />;
  }

  const reportsConfig = [
    { title: "Weekly Executive Summary", format: "PDF", schedule: "Every Monday 8:00 AM", channels: ["Email", "Slack"] },
    { title: "Consolidated ROAS Audit", format: "Excel", schedule: "Monthly (1st Day)", channels: ["Email"] },
    { title: "Daily Spend Alerts", format: "PDF", schedule: "Daily 9:00 PM", channels: ["Telegram"] },
  ];

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-medium tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
          Scheduled Reporting
        </h1>
        <p className="text-neutral-400 text-sm mt-1.5 font-light">
          Configure automated PDF, Excel, and PowerPoint exports and schedule delivery via Email, Slack, or Telegram.
        </p>
      </div>

      {/* Active Schedules */}
      <div className="space-y-4">
        <h3 className="font-display font-medium text-sm text-white">Active Report Schedules</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportsConfig.map((rep) => (
            <div key={rep.title} className="glass-card rounded-[20px] p-5 border border-white/5 bg-white/[0.01] space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">
                  {rep.format} Report
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white truncate">{rep.title}</h4>
                <p className="text-[11px] text-neutral-500 font-light flex items-center gap-1 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {rep.schedule}
                </p>
              </div>
              <div className="flex gap-2 border-t border-white/[0.03] pt-3 text-[10px] text-neutral-400 font-light">
                <span>Deliver via:</span>
                {rep.channels.map((chan) => (
                  <span key={chan} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[9px] font-medium text-purple-400">
                    {chan}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
