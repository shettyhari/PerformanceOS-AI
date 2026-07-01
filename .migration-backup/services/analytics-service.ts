import { prisma } from "../lib/prisma";

export interface AnalyticsTimeSeriesPoint {
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

export interface AnalyticsCampaignRow {
  id: string;
  name: string;
  platform: string;
  spend: number;
  revenue: number;
  roas: number;
  conversions: number;
  clicks: number;
  impressions: number;
}

export interface AnalyticsData {
  timeSeries: AnalyticsTimeSeriesPoint[];
  campaigns: AnalyticsCampaignRow[];
  platformsSummary: Array<{
    name: string;
    spend: number;
    revenue: number;
    roas: number;
    conversions: number;
  }>;
}

export async function getAnalyticsData(orgId: string): Promise<AnalyticsData | null> {
  const connection = await prisma.windsorConnection.findUnique({
    where: { orgId }
  });

  if (!connection) {
    return null;
  }

  // Fetch campaign metrics
  const campaigns = await prisma.campaign.findMany({
    where: {
      adAccount: { orgId }
    },
    include: {
      adAccount: true,
      metrics: {
        orderBy: { date: "asc" }
      }
    }
  });

  const totalMetrics = campaigns.reduce((acc, c) => acc + c.metrics.length, 0);
  if (totalMetrics === 0) {
    return null;
  }

  // 1. Construct daily time-series
  const dailyMap: { [dateStr: string]: AnalyticsTimeSeriesPoint } = {};

  campaigns.forEach((camp) => {
    const platform = camp.adAccount.platform;

    camp.metrics.forEach((m) => {
      const dateStr = m.date.toISOString().split("T")[0];
      const spend = Number(m.spend);
      const rev = Number(m.revenue);

      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = {
          date: dateStr,
          googleSpend: 0,
          metaSpend: 0,
          linkedinSpend: 0,
          msSpend: 0,
          googleRevenue: 0,
          metaRevenue: 0,
          linkedinRevenue: 0,
          msRevenue: 0,
          googleConversions: 0,
          metaConversions: 0,
          linkedinConversions: 0,
          msConversions: 0,
          totalSpend: 0,
          totalRevenue: 0
        };
      }

      dailyMap[dateStr].totalSpend += spend;
      dailyMap[dateStr].totalRevenue += rev;

      if (platform === "GOOGLE_ADS") {
        dailyMap[dateStr].googleSpend += spend;
        dailyMap[dateStr].googleRevenue += rev;
        dailyMap[dateStr].googleConversions += m.conversions;
      } else if (platform === "META_ADS") {
        dailyMap[dateStr].metaSpend += spend;
        dailyMap[dateStr].metaRevenue += rev;
        dailyMap[dateStr].metaConversions += m.conversions;
      } else if (platform === "LINKEDIN_ADS") {
        dailyMap[dateStr].linkedinSpend += spend;
        dailyMap[dateStr].linkedinRevenue += rev;
        dailyMap[dateStr].linkedinConversions += m.conversions;
      } else if (platform === "MS_ADS") {
        dailyMap[dateStr].msSpend += spend;
        dailyMap[dateStr].msRevenue += rev;
        dailyMap[dateStr].msConversions += m.conversions;
      }
    });
  });

  // Convert daily map to sorted array
  const timeSeries = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  // 2. Construct tabular campaigns rows
  const campaignsList: AnalyticsCampaignRow[] = campaigns.map((camp) => {
    let spend = 0;
    let revenue = 0;
    let conversions = 0;
    let clicks = 0;
    let impressions = 0;

    camp.metrics.forEach((m) => {
      spend += Number(m.spend);
      revenue += Number(m.revenue);
      conversions += m.conversions;
      clicks += m.clicks;
      impressions += m.impressions;
    });

    return {
      id: camp.id,
      name: camp.name,
      platform: camp.adAccount.platform,
      spend,
      revenue,
      roas: spend > 0 ? revenue / spend : 0,
      conversions,
      clicks,
      impressions
    };
  });

  // 3. Platform aggregates
  const platformSummaryMap: { [platform: string]: { spend: number; revenue: number; conversions: number } } = {
    GOOGLE_ADS: { spend: 0, revenue: 0, conversions: 0 },
    META_ADS: { spend: 0, revenue: 0, conversions: 0 },
    LINKEDIN_ADS: { spend: 0, revenue: 0, conversions: 0 },
    MS_ADS: { spend: 0, revenue: 0, conversions: 0 }
  };

  campaignsList.forEach((c) => {
    if (platformSummaryMap[c.platform]) {
      platformSummaryMap[c.platform].spend += c.spend;
      platformSummaryMap[c.platform].revenue += c.revenue;
      platformSummaryMap[c.platform].conversions += c.conversions;
    }
  });

  const platformsSummary = Object.entries(platformSummaryMap).map(([name, data]) => ({
    name,
    spend: data.spend,
    revenue: data.revenue,
    roas: data.spend > 0 ? data.revenue / data.spend : 0,
    conversions: data.conversions
  }));

  return {
    timeSeries,
    campaigns: campaignsList,
    platformsSummary
  };
}
