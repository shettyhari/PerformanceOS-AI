import { Router } from "express";
import { db, alertsTable, campaignMetricsTable, windsorConnectionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

async function checkAndCreateAlerts(orgId: string) {
  const metrics = await db.select()
    .from(campaignMetricsTable)
    .where(eq(campaignMetricsTable.orgId, orgId));

  if (metrics.length === 0) return;

  const campaignMap = new Map<string, any>();
  for (const m of metrics) {
    if (!campaignMap.has(m.campaignId)) {
      campaignMap.set(m.campaignId, { id: m.campaignId, name: m.name, platform: m.platform, spend: 0, revenue: 0, conversions: 0 });
    }
    const c = campaignMap.get(m.campaignId)!;
    c.spend += m.spend;
    c.revenue += m.revenue;
    c.conversions += m.conversions;
  }

  const existing = await db.select().from(alertsTable)
    .where(and(eq(alertsTable.orgId, orgId), eq(alertsTable.isResolved, false)));
  
  const existingMessages = new Set(existing.map((a) => a.message));

  for (const c of campaignMap.values()) {
    const roas = c.spend > 0 ? c.revenue / c.spend : 0;
    if (roas < 1 && c.spend > 200) {
      const msg = `${c.name} (${c.platform}) has ROAS below 1x — actively losing money at $${c.spend.toFixed(0)} spend`;
      if (!existingMessages.has(msg)) {
        await db.insert(alertsTable).values({
          orgId,
          type: "ROAS_CRITICAL",
          severity: "CRITICAL",
          message: msg,
          isResolved: false,
        });
      }
    } else if (roas < 1.5 && c.spend > 100) {
      const msg = `${c.name} (${c.platform}) ROAS of ${roas.toFixed(2)}x is below the 1.5x target threshold`;
      if (!existingMessages.has(msg)) {
        await db.insert(alertsTable).values({
          orgId,
          type: "ROAS_WARNING",
          severity: "WARNING",
          message: msg,
          isResolved: false,
        });
      }
    }
  }
}

router.get("/", requireAuth, async (req: any, res) => {
  try {
    const { orgId } = req.dbUser;

    const connection = await db.select()
      .from(windsorConnectionsTable)
      .where(eq(windsorConnectionsTable.orgId, orgId))
      .limit(1);

    if (connection.length > 0) {
      await checkAndCreateAlerts(orgId);
    }

    const alerts = await db.select()
      .from(alertsTable)
      .where(eq(alertsTable.orgId, orgId));

    return res.json(alerts.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })));
  } catch (err: any) {
    req.log.error({ err }, "Alerts error");
    return res.status(500).json({ error: "Failed to load alerts" });
  }
});

router.post("/:id/resolve", requireAuth, async (req: any, res) => {
  try {
    const { orgId } = req.dbUser;
    const { id } = req.params;

    const [alert] = await db.select().from(alertsTable)
      .where(and(eq(alertsTable.id, id), eq(alertsTable.orgId, orgId)))
      .limit(1);

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    const [updated] = await db.update(alertsTable)
      .set({ isResolved: true })
      .where(eq(alertsTable.id, id))
      .returning();

    return res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err: any) {
    req.log.error({ err }, "Resolve alert error");
    return res.status(500).json({ error: "Failed to resolve alert" });
  }
});

export default router;
