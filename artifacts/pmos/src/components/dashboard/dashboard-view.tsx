import React from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, AlertCircle, Award, Percent, DollarSign, Target, MousePointer, Activity } from "lucide-react";
import { Sparkline } from "@/components/charts/sparkline";

interface KPIs { spend: number; revenue: number; roas: number; cpa: number; cpl: number; ctr: number; cpc: number; cpm: number; leads: number; conversions: number; }
interface CampaignIssue { id: string; name: string; platform: string; spend: number; roas: number; issue: string; }
interface CampaignOpportunity { id: string; name: string; platform: string; roas: number; conversions: number; suggestion: string; }
interface CampaignRow { id: string; name: string; platform: string; spend: number; revenue: number; roas: number; conversions: number; clicks: number; impressions: number; }

interface DashboardViewProps {
  data: { kpis: KPIs; needsAttention: CampaignIssue[]; opportunities: CampaignOpportunity[]; topPerformers: CampaignRow[]; executiveSummary: string; aiRecommendations: string[]; };
  userName: string;
}

export function DashboardView({ data, userName }: DashboardViewProps) {
  const { kpis, needsAttention, opportunities, executiveSummary, aiRecommendations } = data;

  const formatCurrency = (val: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat("en-US").format(val);

  const getSparklineData = (baseVal: number, seed: number) => {
    const points = [];
    let current = baseVal * 0.8;
    for (let i = 0; i < 7; i++) { current = current * (1 + Math.sin(i + seed) * 0.1); points.push(current); }
    points.push(baseVal);
    return points;
  };

  const kpiCards = [
    { name: "Spend", value: formatCurrency(kpis.spend), icon: DollarSign, color: "#3b82f6", data: getSparklineData(kpis.spend, 1) },
    { name: "Revenue", value: formatCurrency(kpis.revenue), icon: DollarSign, color: "#10b981", data: getSparklineData(kpis.revenue, 2) },
    { name: "ROAS", value: `${kpis.roas.toFixed(2)}x`, icon: TrendingUp, color: kpis.roas >= 2 ? "#10b981" : "#f59e0b", data: getSparklineData(kpis.roas, 3) },
    { name: "CPA", value: formatCurrency(kpis.cpa), icon: Target, color: "#ec4899", data: getSparklineData(kpis.cpa, 4) },
    { name: "CTR", value: `${kpis.ctr.toFixed(2)}%`, icon: Percent, color: "#8b5cf6", data: getSparklineData(kpis.ctr, 6) },
    { name: "CPC", value: formatCurrency(kpis.cpc), icon: MousePointer, color: "#06b6d4", data: getSparklineData(kpis.cpc, 7) },
    { name: "Leads", value: formatNumber(kpis.leads), icon: Award, color: "#3b82f6", data: getSparklineData(kpis.leads, 9) },
    { name: "Conversions", value: formatNumber(kpis.conversions), icon: Award, color: "#10b981", data: getSparklineData(kpis.conversions, 10) },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
          Good Morning, {userName || "User"}
        </motion.h1>
        <p className="text-neutral-400 text-sm mt-1.5 font-light">Here is your marketing performance summary for the last 30 days.</p>
      </div>

      {/* Executive Summary */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-[24px] p-6 border border-white/5 bg-gradient-to-r from-white/[0.01] to-purple-950/[0.02]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-xs uppercase tracking-wider text-purple-400 font-semibold">AI Command Center • Executive Summary</h3>
        </div>
        <p className="text-base text-neutral-200 leading-relaxed font-light">{executiveSummary}</p>
      </motion.div>

      {/* Attention + Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-[24px] p-6 border border-red-500/10 bg-red-950/[0.01]">
          <div className="flex items-center gap-2 mb-4 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-medium text-sm tracking-wide text-white">Needs Attention ({needsAttention.length})</h3>
          </div>
          {needsAttention.length === 0 ? (
            <p className="text-xs text-neutral-500 font-light">No critical performance drops detected.</p>
          ) : (
            <div className="space-y-4">
              {needsAttention.map((c) => (
                <div key={c.id} className="p-3.5 rounded-[16px] bg-white/[0.01] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">{c.platform.replace("_", " ")}</span>
                    <h4 className="text-sm font-medium text-neutral-200">{c.name}</h4>
                    <p className="text-xs text-neutral-500 mt-1 font-light">{c.issue}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-light text-neutral-400">Spend: {formatCurrency(c.spend)}</span>
                    <div className="text-red-400 font-medium text-sm mt-0.5 flex items-center gap-1 justify-end">
                      <TrendingDown className="w-3.5 h-3.5" />{c.roas.toFixed(2)}x ROAS
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-[24px] p-6 border border-emerald-500/10 bg-emerald-950/[0.01]">
          <div className="flex items-center gap-2 mb-4 text-emerald-400">
            <Award className="w-5 h-5" />
            <h3 className="font-medium text-sm tracking-wide text-white">Scaling Opportunities ({opportunities.length})</h3>
          </div>
          {opportunities.length === 0 ? (
            <p className="text-xs text-neutral-500 font-light">No high-performing campaigns to scale yet.</p>
          ) : (
            <div className="space-y-4">
              {opportunities.map((c) => (
                <div key={c.id} className="p-3.5 rounded-[16px] bg-white/[0.01] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">{c.platform.replace("_", " ")}</span>
                    <h4 className="text-sm font-medium text-neutral-200">{c.name}</h4>
                    <p className="text-xs text-neutral-500 mt-1 font-light">{c.suggestion}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-light text-neutral-400">{c.conversions} Conversions</span>
                    <div className="text-emerald-400 font-medium text-sm mt-0.5 flex items-center gap-1 justify-end">
                      <TrendingUp className="w-3.5 h-3.5" />{c.roas.toFixed(2)}x ROAS
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* AI Recommendations */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-[24px] p-6 border border-white/5 bg-white/[0.01]">
        <h3 className="font-medium text-sm text-white mb-4">AI Optimization Recommendations</h3>
        <ul className="space-y-3.5">
          {aiRecommendations.map((rec, idx) => (
            <li key={idx} className="flex gap-3 text-sm text-neutral-300 font-light">
              <span className="h-5 w-5 rounded-full bg-purple-950/40 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">{idx + 1}</span>
              <span className="pt-0.5">{rec}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* KPI Grid */}
      <div>
        <h3 className="font-medium text-sm text-white mb-4">Core Performance Indicators</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + idx * 0.05 }} className="glass-card rounded-[20px] p-5 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-300 flex flex-col justify-between h-[140px] relative group overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-neutral-400 font-light">{card.name}</span>
                  <div className="p-1 rounded-[6px] bg-white/[0.02] border border-white/5 text-neutral-500 group-hover:text-white transition duration-200">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-end justify-between mt-4">
                  <span className="text-2xl font-bold tracking-tight text-white">{card.value}</span>
                  <Sparkline data={card.data} color={card.color} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
