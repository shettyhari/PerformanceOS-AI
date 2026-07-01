import { Router } from "express";
import { db, campaignMetricsTable, windsorConnectionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/data", requireAuth, async (req: any, res) => {
  try {
    const { orgId } = req.dbUser;

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

    // Build time series by date
    const dateMap = new Map<string, { spend: number; revenue: number }>();
    for (const m of metrics) {
      if (!dateMap.has(m.date)) {
        dateMap.set(m.date, { spend: 0, revenue: 0 });
      }
      const d = dateMap.get(m.date)!;
      d.spend += m.spend;
      d.revenue += m.revenue;
    }
    const timeSeries = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        spend: d.spend,
        revenue: d.revenue,
        roas: d.spend > 0 ? d.revenue / d.spend : 0,
      }));

    // Build campaigns table
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

    // Platform summary
    const platformMap = new Map<string, any>();
    for (const c of campaigns) {
      if (!platformMap.has(c.platform)) {
        platformMap.set(c.platform, { platform: c.platform, spend: 0, revenue: 0, conversions: 0 });
      }
      const p = platformMap.get(c.platform)!;
      p.spend += c.spend;
      p.revenue += c.revenue;
      p.conversions += c.conversions;
    }
    const platformsSummary = Array.from(platformMap.values()).map((p) => ({
      ...p,
      roas: p.spend > 0 ? p.revenue / p.spend : 0,
    }));

    return res.json({ timeSeries, campaigns, platformsSummary });
  } catch (err: any) {
    req.log.error({ err }, "Analytics error");
    return res.status(500).json({ error: "Failed to load analytics" });
  }
});

export default router;
