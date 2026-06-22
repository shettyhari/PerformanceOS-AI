"use client";

import React from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
}

export function Sparkline({ data, color = "#8884d8" }: SparklineProps) {
  // Map raw array of numbers to Recharts object shape
  const chartData = data.map((val, idx) => ({ id: idx, value: val }));

  if (data.length === 0) {
    return <div className="h-8 w-24 bg-white/[0.02] rounded animate-pulse" />;
  }

  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={true}
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export default Sparkline;
