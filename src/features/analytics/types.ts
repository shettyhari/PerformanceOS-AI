export interface DashboardSummary {
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  campaignCount: number;
}

export interface DailyMetricPoint {
  date: string;
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface ChannelMetric {
  channel: string;
  spend: number;
  revenue: number;
  conversions: number;
  roas: number | null;
}

export interface CampaignListItem {
  id: string;
  name: string;
  source: string;
  channel: string | null;
  platform: string | null;
  status: string;
  spend: number;
  revenue: number;
  conversions: number;
  roas: number | null;
  lastSyncedAt: Date | null;
}

export interface ExecutiveSummary extends DashboardSummary {
  topChannels: ChannelMetric[];
  topCampaigns: CampaignListItem[];
  periodLabel: string;
  spendChangePercent: number | null;
  revenueChangePercent: number | null;
}

export interface PaginatedCampaigns {
  items: CampaignListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type AnalyticsPeriod = '7d' | '30d' | '90d';

export function periodToDays(period: AnalyticsPeriod): number {
  const map: Record<AnalyticsPeriod, number> = { '7d': 7, '30d': 30, '90d': 90 };
  return map[period];
}

export function getDateRange(period: AnalyticsPeriod): {
  startDate: Date;
  endDate: Date;
} {
  const endDate = new Date();
  endDate.setUTCHours(23, 59, 59, 999);
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - periodToDays(period) + 1);
  startDate.setUTCHours(0, 0, 0, 0);
  return { startDate, endDate };
}
