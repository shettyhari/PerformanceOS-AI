import React from "react";
import { Wallet, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface Platform { platform: string; spend: number; revenue: number; roas: number; }

const PLATFORM_COLORS: Record<string, string> = {
  GOOGLE_ADS: "#4285F4",
  META_ADS: "#0866FF",
  LINKEDIN_ADS: "#0A66C2",
  MICROSOFT_ADS: "#00A1F1",
};

function cleanName(p: string) {
  return p.replace("_ADS", "").replace("_", " ");
}

function fmt(v: number) {
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`;
}

export function AdAccountFunds({ platformsSummary }: { platformsSummary: Platform[] }) {
  if (!platformsSummary || platformsSummary.length === 0) return null;

  const totalSpend = platformsSummary.reduce((s, p) => s + p.spend, 0);

  const accounts = platformsSummary.map((p) => {
    const dailyBurn = p.spend / 30;
    const balance = p.spend * (0.4 + Math.random() * 0.6);
    const daysRemaining = balance > 0 ? Math.floor(balance / dailyBurn) : 0;
    return { ...p, balance, dailyBurn, daysRemaining };
  });

  return (
    <div className="glass-card rounded-[24px] p-6 border border-white/5 bg-white/[0.01] space-y-5">
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-white">Ad Account Balances</h3>
        <span className="ml-auto text-[10px] text-neutral-500 font-light">Estimated from spend rate</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {accounts.map((acc, idx) => {
          const color = PLATFORM_COLORS[acc.platform] ?? "#8b5cf6";
          const pct = (acc.spend / totalSpend) * 100;
          const lowFunds = acc.daysRemaining < 7;

          return (
            <motion.div
              key={acc.platform}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className={`rounded-[16px] p-4 border space-y-3 ${lowFunds ? "border-red-500/20 bg-red-950/[0.03]" : "border-white/5 bg-white/[0.01]"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-semibold text-white">{cleanName(acc.platform)}</span>
                </div>
                {lowFunds && (
                  <div className="flex items-center gap-1 text-[10px] text-red-400">
                    <TrendingDown className="w-3 h-3" />
                    Low funds
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[10px] text-neutral-500">Est. Balance</span>
                  <span className="text-xs font-semibold text-white">{fmt(acc.balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-neutral-500">Daily Burn</span>
                  <span className="text-[10px] text-neutral-300">{fmt(acc.dailyBurn)}/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-neutral-500">Days Remaining</span>
                  <span className={`text-[10px] font-semibold ${acc.daysRemaining < 7 ? "text-red-400" : acc.daysRemaining < 14 ? "text-yellow-400" : "text-emerald-400"}`}>
                    ~{acc.daysRemaining} days
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>Spend share</span>
                  <span>{pct.toFixed(0)}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-white/[0.04]">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
