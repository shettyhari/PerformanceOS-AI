import { prisma } from "../lib/prisma";

export interface DashboardSummary {
  kpis: {
    spend: number;
    revenue: number;
    roas: number;
    cpa: number;
    cpl: number;
    ctr: number;
    cpc: number;
    cpm: number;
    leads: number;
    conversions: number;
    impressions: number;
    clicks: number;
  };
  needsAttention: Array<{
    id: string;
    name: string;
    platform: string;
    spend: number;
    roas: number;
    issue: string;
  }>;
  opportunities: Array<{
    id: string;
    name: string;
    platform: string;
    roas: number;
    conversions: number;
    suggestion: string;
  }>;
  topPerformers: Array<{
    platform: string;
    spend: number;
    revenue: number;
    roas: number;
    conversions: number;
  }>;
  executiveSummary: string;
  aiRecommendations: string[];
}

export async function getDashboardData(orgId: string): Promise<DashboardSummary | null> {
  // 1. Verify if Windsor connection exists
  const connection = await prisma.windsorConnection.findUnique({
    where: { orgId }
  });

  if (!connection) {
    return null;
  }

  // 2. Fetch all campaigns and metrics for the active organization
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

  // If there are no campaigns synced yet, return empty state indicators
  const totalMetricsCount = campaigns.reduce((acc, c) => acc + c.metrics.length, 0);
  if (totalMetricsCount === 0) {
    return null;
  }

  // 3. Compute KPI aggregates
  let totalSpend = 0;
  let totalRevenue = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let totalLeads = 0;

  const campaignStats = campaigns.map((camp) => {
    let campSpend = 0;
    let campRevenue = 0;
    let campConversions = 0;
    let campClicks = 0;
    let campImpressions = 0;

    camp.metrics.forEach((m) => {
      const spend = Number(m.spend);
      const rev = Number(m.revenue);
      
      totalSpend += spend;
      totalRevenue += rev;
      totalImpressions += m.impressions;
      totalClicks += m.clicks;
      totalConversions += m.conversions;
      totalLeads += m.leads;

      campSpend += spend;
      campRevenue += rev;
      campConversions += m.conversions;
      campClicks += m.clicks;
      campImpressions += m.impressions;
    });

    const campRoas = campSpend > 0 ? campRevenue / campSpend : 0;

    return {
      id: camp.id,
      name: camp.name,
      platform: camp.adAccount.platform,
      spend: campSpend,
      revenue: campRevenue,
      roas: campRoas,
      conversions: campConversions,
      clicks: campClicks,
      impressions: campImpressions
    };
  });

  // Global KPIs calculation
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

  // 4. Identify Needs Attention & Opportunities
  const needsAttention: DashboardSummary["needsAttention"] = [];
  const opportunities: DashboardSummary["opportunities"] = [];

  campaignStats.forEach((c) => {
    if (c.spend > 100) {
      if (c.roas < 1.2) {
        needsAttention.push({
          id: c.id,
          name: c.name,
          platform: c.platform,
          spend: c.spend,
          roas: c.roas,
          issue: `Critical ROAS (${c.roas.toFixed(2)}) below target. High budget burn with low return.`
        });
      } else if (c.roas > 3.0) {
        opportunities.push({
          id: c.id,
          name: c.name,
          platform: c.platform,
          roas: c.roas,
          conversions: c.conversions,
          suggestion: `Scaling candidate. Strong ROAS (${c.roas.toFixed(2)}). Recommend increasing daily budget by 20%.`
        });
      }
    }
  });

  // 5. Group by platform for Top Performers
  const platformGroups: { [key: string]: { spend: number; revenue: number; conversions: number } } = {};
  campaignStats.forEach((c) => {
    if (!platformGroups[c.platform]) {
      platformGroups[c.platform] = { spend: 0, revenue: 0, conversions: 0 };
    }
    platformGroups[c.platform].spend += c.spend;
    platformGroups[c.platform].revenue += c.revenue;
    platformGroups[c.platform].conversions += c.conversions;
  });

  const topPerformers = Object.entries(platformGroups).map(([platform, data]) => ({
    platform,
    spend: data.spend,
    revenue: data.revenue,
    roas: data.spend > 0 ? data.revenue / data.spend : 0,
    conversions: data.conversions
  })).sort((a, b) => b.roas - a.roas);

  // 6. Generate Dynamic Summary sentences based on metrics (no hardcoded placeholders!)
  const bestPlatform = topPerformers.length > 0 ? topPerformers[0] : null;
  const executiveSummary = `Your marketing channels generated a total of $${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in revenue from a spend of $${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, resulting in a consolidated ROAS of ${roas.toFixed(2)}x. ${
    bestPlatform 
      ? `${bestPlatform.platform.replace("_", " ")} was your most efficient channel with a ${bestPlatform.roas.toFixed(2)}x ROAS.` 
      : ""
  }`;

  const aiRecommendations: string[] = [];
  if (needsAttention.length > 0) {
    aiRecommendations.push(`Pause or optimize target CPA on the ${needsAttention.length} failing campaign(s) on ${needsAttention[0].platform}.`);
  }
  if (opportunities.length > 0) {
    aiRecommendations.push(`Increase budget allocation on high-yield campaign "${opportunities[0].name}" (${opportunities[0].roas.toFixed(2)}x ROAS).`);
  }
  if (roas < 2.0) {
    aiRecommendations.push(`Consolidated ROAS is under 2.0x. Consider shifting budget from low-conversion display campaigns to high-intent search platforms.`);
  } else {
    aiRecommendations.push(`Overall performance is healthy. Maintain current distribution and test audience lookalikes on ${bestPlatform?.platform || "top channels"}.`);
  }

  return {
    kpis: {
      spend: totalSpend,
      revenue: totalRevenue,
      roas,
      cpa,
      cpl,
      ctr,
      cpc,
      cpm,
      leads: totalLeads,
      conversions: totalConversions,
      impressions: totalImpressions,
      clicks: totalClicks
    },
    needsAttention: needsAttention.slice(0, 3),
    opportunities: opportunities.slice(0, 3),
    topPerformers,
    executiveSummary,
    aiRecommendations
  };
}
