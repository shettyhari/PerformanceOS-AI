import React from "react";
import { useGetAnalyticsData } from "@workspace/api-client-react";
import { OnboardingPanel } from "@/components/dashboard/onboarding";
import { CampaignsTable } from "@/components/dashboard/campaigns-table";
import { DollarSign, Percent, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function AnalyticsPage() {
  const { data, isLoading, error } = useGetAnalyticsData();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="flex items-center gap-3 text-neutral-400 text-sm"><div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />Loading analytics...</div></div>;
  }

  if (error || !data) return <OnboardingPanel />;

  const { timeSeries, campaigns, platformsSummary } = data as any;

  const formatCurrency = (val: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  const totalSpend = platformsSummary?.reduce((s: number, p: any) => s + p.spend, 0) || 0;
  const totalRevenue = platformsSummary?.reduce((s: number, p: any) => s + p.revenue, 0) || 0;
  const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">Multi-Channel Analytics</h1>
        <p className="text-neutral-400 text-sm mt-1.5 font-light">Cross-platform performance overview for the last 30 days.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Spend", value: formatCurrency(totalSpend), icon: DollarSign, color: "text-blue-400" },
          { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "text-emerald-400" },
          { label: "Blended ROAS", value: `${blendedRoas.toFixed(2)}x`, icon: Percent, color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-[20px] p-5 border border-white/5 bg-white/[0.01]">
            <div className={`flex items-center gap-2 mb-2 ${s.color}`}><s.icon className="w-4 h-4" /><span className="text-xs font-medium">{s.label}</span></div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Time Series Chart */}
      {timeSeries && timeSeries.length > 0 && (
        <div className="glass-card rounded-[24px] p-6 border border-white/5 bg-white/[0.01]">
          <h3 className="font-medium text-sm text-white mb-4">Spend vs Revenue (30 Days)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }} formatter={(v: any) => [formatCurrency(v)]} />
                <Area type="monotone" dataKey="spend" name="Spend" stroke="#3b82f6" strokeWidth={2} fill="url(#spendGrad)" dot={false} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Platform breakdown */}
      {platformsSummary && platformsSummary.length > 0 && (
        <div className="glass-card rounded-[24px] p-6 border border-white/5 bg-white/[0.01]">
          <h3 className="font-medium text-sm text-white mb-4">Platform ROAS Comparison</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformsSummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="platform" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} tickFormatter={(v) => v.replace("_ADS", "").replace("_", " ")} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }} formatter={(v: any) => [`${Number(v).toFixed(2)}x`]} />
                <Bar dataKey="roas" name="ROAS" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      <div>
        <h3 className="font-medium text-sm text-white mb-4">Campaign Performance Table</h3>
        {campaigns && <CampaignsTable campaigns={campaigns} />}
      </div>
    </div>
  );
}
