import React from "react";
import { Sparkles, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface Platform { platform: string; spend: number; revenue: number; roas: number; }

function fmt(v: number) {
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`;
}

function cleanName(p: string) {
  return p.replace("_ADS", "").replace("_", " ");
}

export function BudgetInsights({ platformsSummary }: { platformsSummary: Platform[] }) {
  if (!platformsSummary || platformsSummary.length < 2) return null;

  const sorted = [...platformsSummary].sort((a, b) => b.roas - a.roas);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const avgRoas = platformsSummary.reduce((s, p) => s + p.roas, 0) / platformsSummary.length;

  const shiftAmount = Math.round(worst.spend * 0.2);
  const projectedGain = shiftAmount * (best.roas - worst.roas);

  const insights = [
    {
      type: "shift",
      icon: ArrowRight,
      color: "text-purple-400",
      bg: "bg-purple-950/20 border-purple-500/10",
      title: `Shift budget from ${cleanName(worst.platform)} → ${cleanName(best.platform)}`,
      body: `Reallocating ${fmt(shiftAmount)} from your lowest-ROAS platform (${worst.roas.toFixed(2)}x) to your best (${best.roas.toFixed(2)}x) could yield ~${fmt(projectedGain)} additional revenue.`,
    },
    {
      type: "scale",
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-950/20 border-emerald-500/10",
      title: `Scale ${cleanName(best.platform)} — highest ROAS at ${best.roas.toFixed(2)}x`,
      body: `${cleanName(best.platform)} is outperforming other channels by ${((best.roas / avgRoas - 1) * 100).toFixed(0)}% above average. Increasing its budget by 20% is expected to maintain or improve current returns.`,
    },
    {
      type: "pause",
      icon: TrendingDown,
      color: "text-red-400",
      bg: "bg-red-950/20 border-red-500/10",
      title: `Review ${cleanName(worst.platform)} spend efficiency`,
      body: `${cleanName(worst.platform)} ROAS of ${worst.roas.toFixed(2)}x is ${((1 - worst.roas / avgRoas) * 100).toFixed(0)}% below average. Consider pausing underperforming ad sets and running creative refresh tests.`,
    },
  ];

  return (
    <div className="glass-card rounded-[24px] p-6 border border-white/5 bg-white/[0.01] space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-white">AI Budget Recommendations</h3>
        <span className="ml-auto text-[10px] text-neutral-500 font-light">Based on last 30 days</span>
      </div>
      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <motion.div
            key={insight.type}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className={`flex gap-3 p-4 rounded-[16px] border ${insight.bg}`}
          >
            <div className={`h-8 w-8 rounded-[10px] flex items-center justify-center flex-shrink-0 bg-white/[0.02] border border-white/5 ${insight.color}`}>
              <insight.icon className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-white">{insight.title}</p>
              <p className="text-[11px] text-neutral-400 font-light leading-relaxed">{insight.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
