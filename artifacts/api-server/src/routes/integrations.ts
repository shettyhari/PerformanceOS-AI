import { Router } from "express";
import { db, windsorConnectionsTable, syncLogsTable, campaignMetricsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("ENCRYPTION_KEY environment variable is required in production");
  }
}
const _encKey = ENCRYPTION_KEY || "dev-encryption-key-not-for-prod!";

function encrypt(text: string): string {
  const key = Buffer.from(_encKey.padEnd(32).slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text: string): string {
  const [ivHex, encrypted] = text.split(":");
  const key = Buffer.from(_encKey.padEnd(32).slice(0, 32));
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

async function generateMockCampaignData(orgId: string): Promise<number> {
  const platforms = ["GOOGLE_ADS", "META_ADS", "LINKEDIN_ADS", "MICROSOFT_ADS"];
  const campaigns = [
    { id: "camp_001", name: "Brand Awareness - Google", platform: "GOOGLE_ADS", baseSpend: 450, baseRevenue: 1800 },
    { id: "camp_002", name: "Lead Gen - Meta", platform: "META_ADS", baseSpend: 320, baseRevenue: 640 },
    { id: "camp_003", name: "Retargeting - Meta", platform: "META_ADS", baseSpend: 180, baseRevenue: 810 },
    { id: "camp_004", name: "B2B Outreach - LinkedIn", platform: "LINKEDIN_ADS", baseSpend: 600, baseRevenue: 900 },
    { id: "camp_005", name: "Search - Google Performance Max", platform: "GOOGLE_ADS", baseSpend: 520, baseRevenue: 2340 },
    { id: "camp_006", name: "Display - Microsoft Ads", platform: "MICROSOFT_ADS", baseSpend: 120, baseRevenue: 96 },
    { id: "camp_007", name: "Conversion - Meta Advantage+", platform: "META_ADS", baseSpend: 280, baseRevenue: 1120 },
    { id: "camp_008", name: "Remarketing - Google", platform: "GOOGLE_ADS", baseSpend: 190, baseRevenue: 855 },
  ];

  const rows: any[] = [];
  const today = new Date();
  
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split("T")[0];

    for (const c of campaigns) {
      const variance = 0.7 + Math.random() * 0.6;
      const spend = c.baseSpend * variance / 30;
      const revenueVariance = 0.8 + Math.random() * 0.4;
      const revenue = c.baseRevenue * revenueVariance / 30;
      const impressions = Math.floor(spend * (80 + Math.random() * 40));
      const clicks = Math.floor(impressions * (0.02 + Math.random() * 0.03));
      const conversions = Math.floor(clicks * (0.03 + Math.random() * 0.05));
      const leads = Math.floor(conversions * (0.5 + Math.random()));

      rows.push({
        orgId,
        campaignId: c.id,
        name: c.name,
        platform: c.platform,
        date: dateStr,
        spend,
        revenue,
        impressions,
        clicks,
        conversions,
        leads,
      });
    }
  }

  await db.insert(campaignMetricsTable).values(rows);
  return rows.length;
}

router.get("/windsor", requireAuth, async (req: any, res) => {
  try {
    const { orgId } = req.dbUser;

    const [connection] = await db.select()
      .from(windsorConnectionsTable)
      .where(eq(windsorConnectionsTable.orgId, orgId))
      .limit(1);

    if (!connection) {
      return res.json({ connected: false, syncStatus: null, lastSyncAt: null, createdAt: null, syncLogs: [] });
    }

    const syncLogs = await db.select()
      .from(syncLogsTable)
      .where(eq(syncLogsTable.connectionId, connection.id));

    return res.json({
      connected: true,
      syncStatus: connection.syncStatus,
      lastSyncAt: connection.lastSyncAt?.toISOString() || null,
      createdAt: connection.createdAt.toISOString(),
      syncLogs: syncLogs.map((l) => ({
        id: l.id,
        status: l.status,
        errorMessage: l.errorMessage,
        rowsSynced: l.rowsSynced,
        timestamp: l.timestamp.toISOString(),
      })),
    });
  } catch (err: any) {
    req.log.error({ err }, "Get windsor error");
    return res.status(500).json({ error: "Failed to get connection" });
  }
});

router.post("/windsor", requireAuth, async (req: any, res) => {
  try {
    const { orgId } = req.dbUser;
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: "API key required" });
    }

    if (apiKey.length < 8) {
      return res.status(400).json({ error: "Invalid Windsor.ai API Key. Connection failed." });
    }

    const encryptedKey = encrypt(apiKey);

    const existing = await db.select()
      .from(windsorConnectionsTable)
      .where(eq(windsorConnectionsTable.orgId, orgId))
      .limit(1);

    let connection;
    if (existing.length > 0) {
      [connection] = await db.update(windsorConnectionsTable)
        .set({ apiKeyEncrypted: encryptedKey, syncStatus: "PENDING" })
        .where(eq(windsorConnectionsTable.orgId, orgId))
        .returning();
    } else {
      [connection] = await db.insert(windsorConnectionsTable)
        .values({ orgId, apiKeyEncrypted: encryptedKey, syncStatus: "PENDING" })
        .returning();
    }

    return res.json({
      connected: true,
      syncStatus: connection.syncStatus,
      lastSyncAt: null,
      createdAt: connection.createdAt.toISOString(),
      syncLogs: [],
    });
  } catch (err: any) {
    req.log.error({ err }, "Connect windsor error");
    return res.status(500).json({ error: "Failed to connect" });
  }
});

router.delete("/windsor", requireAuth, async (req: any, res) => {
  try {
    const { orgId } = req.dbUser;

    const [connection] = await db.select()
      .from(windsorConnectionsTable)
      .where(eq(windsorConnectionsTable.orgId, orgId))
      .limit(1);

    if (connection) {
      await db.delete(syncLogsTable)
        .where(eq(syncLogsTable.connectionId, connection.id));
      await db.delete(windsorConnectionsTable)
        .where(eq(windsorConnectionsTable.orgId, orgId));
    }

    return res.json({ success: true });
  } catch (err: any) {
    req.log.error({ err }, "Disconnect windsor error");
    return res.status(500).json({ error: "Failed to disconnect" });
  }
});

router.post("/windsor/sync", requireAuth, async (req: any, res) => {
  try {
    const { orgId } = req.dbUser;

    const [connection] = await db.select()
      .from(windsorConnectionsTable)
      .where(eq(windsorConnectionsTable.orgId, orgId))
      .limit(1);

    if (!connection) {
      return res.status(400).json({ error: "No connection found" });
    }

    await db.update(windsorConnectionsTable)
      .set({ syncStatus: "SYNCING" })
      .where(eq(windsorConnectionsTable.orgId, orgId));

    const existingMetrics = await db.select()
      .from(campaignMetricsTable)
      .where(eq(campaignMetricsTable.orgId, orgId))
      .limit(1);

    let rowsSynced = 0;
    if (existingMetrics.length === 0) {
      rowsSynced = await generateMockCampaignData(orgId);
    } else {
      rowsSynced = existingMetrics.length;
    }

    await db.update(windsorConnectionsTable)
      .set({ syncStatus: "SYNCED", lastSyncAt: new Date() })
      .where(eq(windsorConnectionsTable.orgId, orgId));

    await db.insert(syncLogsTable).values({
      connectionId: connection.id,
      status: "SUCCESS",
      rowsSynced,
    });

    return res.json({ rowsSynced });
  } catch (err: any) {
    req.log.error({ err }, "Sync error");
    return res.status(500).json({ error: "Sync failed" });
  }
});

export default router;
