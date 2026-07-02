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

// Map Windsor.ai "source" field to our internal platform enum
function mapSource(source: string): string {
  const s = (source || "").toLowerCase().trim();
  if (s.includes("google")) return "GOOGLE_ADS";
  if (s.includes("facebook") || s.includes("meta") || s.includes("fb_")) return "META_ADS";
  if (s.includes("linkedin")) return "LINKEDIN_ADS";
  if (s.includes("bing") || s.includes("microsoft")) return "MICROSOFT_ADS";
  if (s.includes("tiktok")) return "TIKTOK_ADS";
  if (s.includes("twitter") || s.includes("x_ads")) return "TWITTER_ADS";
  if (s.includes("pinterest")) return "PINTEREST_ADS";
  if (s.includes("snapchat")) return "SNAPCHAT_ADS";
  return source.toUpperCase().replace(/\s+/g, "_");
}

// Fetch real campaign data from Windsor.ai
async function fetchWindsorData(apiKey: string, dateFrom: string, dateTo: string): Promise<any[]> {
  const fields = [
    "date",
    "campaign",
    "campaign_id",
    "source",
    "clicks",
    "impressions",
    "spend",
    "conversions",
    "revenue",
    "leads",
  ].join(",");

  const params = new URLSearchParams({
    api_key: apiKey,
    date_from: dateFrom,
    date_to: dateTo,
    fields,
    _renderer: "json",
  });

  // Try the main Windsor.ai connectors endpoint
  const url = `https://connectors.windsor.ai/all?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Windsor.ai API error ${response.status}: ${body.slice(0, 200)}`);
  }

  const json = await response.json() as any;

  // Windsor.ai returns either { data: [...] } or an array directly
  if (Array.isArray(json)) return json;
  if (json?.data && Array.isArray(json.data)) return json.data;
  if (json?.results && Array.isArray(json.results)) return json.results;

  throw new Error("Windsor.ai returned an unexpected response format");
}

// Convert Windsor.ai rows into DB rows for a given org
function buildDbRows(orgId: string, rows: any[]): any[] {
  const dbRows: any[] = [];

  for (const row of rows) {
    const dateRaw = row.date || row.Date;
    if (!dateRaw) continue;

    // Normalise date to YYYY-MM-DD
    const date = String(dateRaw).slice(0, 10);

    const campaignName = String(row.campaign || row.Campaign || row.campaign_name || "Unknown Campaign").trim();
    const campaignIdRaw = row.campaign_id || row.campaign_id_external || row.ad_campaign_id;
    const campaignId = campaignIdRaw
      ? String(campaignIdRaw)
      : `${orgId}_${campaignName}_${row.source || "unknown"}`.replace(/\s+/g, "_").slice(0, 128);

    const source = mapSource(String(row.source || row.Source || row.channel || "unknown"));

    dbRows.push({
      orgId,
      campaignId,
      name: campaignName,
      platform: source,
      date,
      spend: Number(row.spend ?? row.cost ?? 0) || 0,
      revenue: Number(row.revenue ?? row.conversion_value ?? 0) || 0,
      impressions: Math.round(Number(row.impressions ?? 0) || 0),
      clicks: Math.round(Number(row.clicks ?? 0) || 0),
      conversions: Math.round(Number(row.conversions ?? row.all_conversions ?? 0) || 0),
      leads: Math.round(Number(row.leads ?? 0) || 0),
    });
  }

  return dbRows;
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

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 8) {
      return res.status(400).json({ error: "A valid Windsor.ai API key is required (minimum 8 characters)." });
    }

    // Validate the key with a lightweight test call (last 1 day, minimal fields)
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().slice(0, 10);
      const testParams = new URLSearchParams({
        api_key: apiKey.trim(),
        date_from: dateStr,
        date_to: dateStr,
        fields: "date,campaign,source,spend",
        _renderer: "json",
      });
      const testRes = await fetch(`https://connectors.windsor.ai/all?${testParams.toString()}`, {
        signal: AbortSignal.timeout(10000),
        headers: { Accept: "application/json" },
      });
      if (testRes.status === 401 || testRes.status === 403) {
        return res.status(400).json({ error: "Invalid Windsor.ai API key. Please check your key and try again." });
      }
    } catch (fetchErr: any) {
      // If the validation request times out or network is down, still allow saving
      req.log.warn({ fetchErr }, "Windsor.ai key validation request failed — proceeding anyway");
    }

    const encryptedKey = encrypt(apiKey.trim());

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
      await db.delete(campaignMetricsTable)
        .where(eq(campaignMetricsTable.orgId, orgId));
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
      return res.status(400).json({ error: "No Windsor.ai connection found. Please connect first." });
    }

    await db.update(windsorConnectionsTable)
      .set({ syncStatus: "SYNCING" })
      .where(eq(windsorConnectionsTable.orgId, orgId));

    let apiKey: string;
    try {
      apiKey = decrypt(connection.apiKeyEncrypted);
    } catch (decryptErr: any) {
      await db.update(windsorConnectionsTable)
        .set({ syncStatus: "FAILED" })
        .where(eq(windsorConnectionsTable.orgId, orgId));
      await db.insert(syncLogsTable).values({
        connectionId: connection.id,
        status: "FAILED",
        errorMessage: "Failed to decrypt stored API key. Please reconnect your Windsor.ai account.",
        rowsSynced: 0,
      });
      return res.status(500).json({ error: "Failed to decrypt API key. Please reconnect your Windsor.ai account." });
    }

    // Fetch last 90 days by default
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateTo.getDate() - 89);
    const dateFromStr = dateFrom.toISOString().slice(0, 10);
    const dateToStr = dateTo.toISOString().slice(0, 10);

    let rawRows: any[];
    try {
      rawRows = await fetchWindsorData(apiKey, dateFromStr, dateToStr);
    } catch (apiErr: any) {
      req.log.error({ apiErr }, "Windsor.ai fetch error");
      await db.update(windsorConnectionsTable)
        .set({ syncStatus: "FAILED" })
        .where(eq(windsorConnectionsTable.orgId, orgId));
      await db.insert(syncLogsTable).values({
        connectionId: connection.id,
        status: "FAILED",
        errorMessage: apiErr.message || "Windsor.ai API request failed",
        rowsSynced: 0,
      });
      return res.status(502).json({ error: `Windsor.ai sync failed: ${apiErr.message}` });
    }

    if (!rawRows || rawRows.length === 0) {
      await db.update(windsorConnectionsTable)
        .set({ syncStatus: "SYNCED", lastSyncAt: new Date() })
        .where(eq(windsorConnectionsTable.orgId, orgId));
      await db.insert(syncLogsTable).values({
        connectionId: connection.id,
        status: "SUCCESS",
        errorMessage: "Windsor.ai returned 0 rows. Make sure at least one data source is connected in your Windsor.ai dashboard.",
        rowsSynced: 0,
      });
      return res.json({ rowsSynced: 0, message: "Sync successful but no data was returned. Check that your ad accounts are connected in Windsor.ai." });
    }

    const dbRows = buildDbRows(orgId, rawRows);

    // Clear existing metrics for this org before inserting fresh data
    await db.delete(campaignMetricsTable)
      .where(eq(campaignMetricsTable.orgId, orgId));

    // Insert in batches of 500 to avoid query size limits
    const BATCH = 500;
    for (let i = 0; i < dbRows.length; i += BATCH) {
      await db.insert(campaignMetricsTable).values(dbRows.slice(i, i + BATCH));
    }

    await db.update(windsorConnectionsTable)
      .set({ syncStatus: "SYNCED", lastSyncAt: new Date() })
      .where(eq(windsorConnectionsTable.orgId, orgId));

    await db.insert(syncLogsTable).values({
      connectionId: connection.id,
      status: "SUCCESS",
      rowsSynced: dbRows.length,
    });

    req.log.info({ orgId, rowsSynced: dbRows.length }, "Windsor.ai sync complete");
    return res.json({ rowsSynced: dbRows.length });
  } catch (err: any) {
    req.log.error({ err }, "Sync error");
    return res.status(500).json({ error: "Sync failed unexpectedly. Please try again." });
  }
});

export default router;
