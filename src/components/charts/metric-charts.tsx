'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';

const CHART_COLORS = [
  'hsl(262, 83%, 58%)',
  'hsl(220, 70%, 50%)',
  'hsl(160, 60%, 45%)',
  'hsl(30, 80%, 55%)',
  'hsl(340, 65%, 55%)',
];

interface SpendRevenueChartProps {
  data: { date: string; spend: number; revenue: number }[];
}

export function SpendRevenueChart({ data }: SpendRevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS[2]} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS[2]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(v: string) => v.slice(5)}
        />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatCurrency(value),
            name === 'spend' ? 'Spend' : 'Revenue',
          ]}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="spend"
          stroke={CHART_COLORS[0]}
          fill="url(#spendGrad)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={CHART_COLORS[2]}
          fill="url(#revenueGrad)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface ChannelPieChartProps {
  data: { channel: string; spend: number }[];
}

export function ChannelSpendChart({ data }: ChannelPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="spend"
          nameKey="channel"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface RoasLineChartProps {
  data: { date: string; roas: number }[];
}

export function RoasLineChart({ data }: RoasLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(v: string) => v.slice(5)}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: number) => [`${value.toFixed(2)}x`, 'ROAS']} />
        <Line
          type="monotone"
          dataKey="roas"
          stroke={CHART_COLORS[0]}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface ChannelBarChartProps {
  data: { channel: string; spend: number; revenue: number }[];
}

export function ChannelBarChart({ data }: ChannelBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Legend />
        <Bar dataKey="spend" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
        <Bar dataKey="revenue" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
