"use client";

import React, { useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { DollarSign, TrendingUp, Sparkles, Filter } from "lucide-react";

interface TimeSeriesPoint {
  date: string;
  googleSpend: number;
  metaSpend: number;
  linkedinSpend: number;
  msSpend: number;
  googleRevenue: number;
  metaRevenue: number;
  linkedinRevenue: number;
  msRevenue: number;
  googleConversions: number;
  metaConversions: number;
  linkedinConversions: number;
  msConversions: number;
  totalSpend: number;
  totalRevenue: number;
}

interface InteractiveChartsProps {
  data: TimeSeriesPoint[];
}

export function InteractiveCharts({ data }: InteractiveChartsProps) {
  const [metric, setMetric] = useState<"spend" | "revenue" | "conversions">("spend");

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  };

  const formatValue = (val: number) => {
    if (metric === "conversions") return val.toLocaleString();
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Configure series names based on active metric
  const getKeys = () => {
    if (metric === "revenue") {
      return {
        google: "googleRevenue",
        meta: "metaRevenue",
        linkedin: "linkedinRevenue",
        ms: "msRevenue",
        label: "Revenue"
      };
    }
    if (metric === "conversions") {
      return {
        google: "googleConversions",
        meta: "metaConversions",
        linkedin: "linkedinConversions",
        ms: "msConversions",
        label: "Conversions"
      };
    }
    return {
      google: "googleSpend",
      meta: "metaSpend",
      linkedin: "linkedinSpend",
      ms: "msSpend",
      label: "Spend"
    };
  };

  const keys = getKeys();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card rounded-[14px] p-4 border border-white/5 bg-black/80 backdrop-blur-md shadow-lg text-xs space-y-1.5 text-neutral-300 font-sans">
          <p className="font-semibold text-white mb-2">{formatDate(label)}</p>
          {payload.map((item: any) => (
            <div key={item.name} className="flex justify-between gap-6 items-center">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <span className="font-mono text-white font-medium">{formatValue(item.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card rounded-[24px] border border-white/5 bg-white/[0.01] p-6 space-y-6">
      {/* Chart Headers */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-display font-medium text-base text-white">
            Cross-Platform Performance Trend
          </h3>
          <p className="text-xs text-neutral-400 font-light mt-0.5">
            Plotting daily multi-channel trends. Compare platform efficiencies.
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex rounded-[12px] bg-white/[0.02] border border-white/5 p-1 self-start sm:self-center">
          <button
            onClick={() => setMetric("spend")}
            className={`px-3.5 py-1.5 rounded-[9px] text-xs font-medium transition cursor-pointer outline-none ${
              metric === "spend"
                ? "bg-white text-black"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Ad Spend
          </button>
          <button
            onClick={() => setMetric("revenue")}
            className={`px-3.5 py-1.5 rounded-[9px] text-xs font-medium transition cursor-pointer outline-none ${
              metric === "revenue"
                ? "bg-white text-black"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setMetric("conversions")}
            className={`px-3.5 py-1.5 rounded-[9px] text-xs font-medium transition cursor-pointer outline-none ${
              metric === "conversions"
                ? "bg-white text-black"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Conversions
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-[360px] w-full pr-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorGoogle" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="colorLinkedin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="colorMs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate} 
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatValue(val).split(".")[0]}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", color: "#9ca3af", fontFamily: "var(--font-sans)" }}
            />
            <Area
              name="Google Ads"
              type="monotone"
              dataKey={keys.google}
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorGoogle)"
              strokeWidth={1.5}
            />
            <Area
              name="Meta Ads"
              type="monotone"
              dataKey={keys.meta}
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorMeta)"
              strokeWidth={1.5}
            />
            <Area
              name="LinkedIn Ads"
              type="monotone"
              dataKey={keys.linkedin}
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorLinkedin)"
              strokeWidth={1.5}
            />
            <Area
              name="Microsoft Ads"
              type="monotone"
              dataKey={keys.ms}
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorMs)"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
export default InteractiveCharts;
