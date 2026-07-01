import { Router } from "express";
import { db, campaignMetricsTable, windsorConnectionsTable } from "@workspace/db";
import { eq, desc, sum, avg } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

router.get("/summary", requireAuth, async (req: any, res) => {
  try {
    const { orgId } = (req.session as any).user;

    const connection = await db.select()
      .from(windsorConnectionsTable)
      .where(eq(windsorConnectionsTable.orgId, orgId))
      .limit(1);

    if (connection.length === 0) {
      return res.status(200).json(null);
    }

    const metrics = await db.select()
      .from(campaignMetricsTable)
      .where(eq(campaignMetricsTable.orgId, orgId));

    if (metrics.length === 0) {
      return res.status(200).json(null);
    }

    const totalSpend = metrics.reduce((s, m) => s + m.spend, 0);
    const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0);
    const totalConversions = metrics.reduce((s, m) => s + m.conversions, 0);
    const totalLeads = metrics.reduce((s, m) => s + m.leads, 0);
    const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0);
    const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0);

    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

    // Group campaigns by campaignId
    const campaignMap = new Map<string, any>();
    for (const m of metrics) {
      if (!campaignMap.has(m.campaignId)) {
        campaignMap.set(m.campaignId, {
          id: m.campaignId,
          name: m.name,
          platform: m.platform,
          spend: 0,
          revenue: 0,
          conversions: 0,
          clicks: 0,
          impressions: 0,
        });
      }
      const c = campaignMap.get(m.campaignId)!;
      c.spend += m.spend;
      c.revenue += m.revenue;
      c.conversions += m.conversions;
      c.clicks += m.clicks;
      c.impressions += m.impressions;
    }

    const campaigns = Array.from(campaignMap.values()).map((c) => ({
      ...c,
      roas: c.spend > 0 ? c.revenue / c.spend : 0,
    }));

    const needsAttention = campaigns
      .filter((c) => c.roas < 1.5 && c.spend > 100)
      .map((c) => ({
        id: c.id,
        name: c.name,
        platform: c.platform,
        spend: c.spend,
        roas: c.roas,
        issue: c.roas < 1 ? "ROAS below breakeven — campaign losing money" : "ROAS below target threshold of 1.5x",
      }))
      .slice(0, 5);

    const opportunities = campaigns
      .filter((c) => c.roas > 3)
      .map((c) => ({
        id: c.id,
        name: c.name,
        platform: c.platform,
        roas: c.roas,
        conversions: c.conversions,
        suggestion: `High ROAS of ${c.roas.toFixed(1)}x — consider increasing budget by 20-30%`,
      }))
      .slice(0, 5);

    const topPerformers = [...campaigns].sort((a, b) => b.roas - a.roas).slice(0, 5);

    return res.json({
      kpis: { spend: totalSpend, revenue: totalRevenue, roas, cpa, cpl, ctr, cpc, cpm, leads: totalLeads, conversions: totalConversions },
      needsAttention,
      opportunities,
      topPerformers,
      executiveSummary: `Your campaigns generated $${totalRevenue.toFixed(0)} in revenue on $${totalSpend.toFixed(0)} spend (${roas.toFixed(2)}x ROAS) with ${totalConversions} total conversions. ${needsAttention.length > 0 ? `${needsAttention.length} campaign(s) need attention.` : "All campaigns are performing within acceptable thresholds."}`,
      aiRecommendations: [
        roas < 2 ? "Focus budget on top-performing campaigns to improve overall ROAS above 2x." : "Maintain current budget allocation — ROAS is healthy.",
        cpa > 50 ? `CPA of $${cpa.toFixed(0)} is high — review targeting and landing page conversion rates.` : "CPA is within acceptable range.",
        opportunities.length > 0 ? `Scale up ${opportunities[0]?.name || "top performers"} with additional budget allocation.` : "No scaling opportunities detected at this time.",
        totalImpressions > 10000 ? `CTR of ${ctr.toFixed(2)}% — A/B test ad creative for higher click-through rates.` : "Increase reach by expanding targeting audience segments.",
      ],
    });
  } catch (err: any) {
    req.log.error({ err }, "Dashboard summary error");
    return res.status(500).json({ error: "Failed to load dashboard" });
  }
});

export default router;
