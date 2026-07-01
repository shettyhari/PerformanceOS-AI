import { Router } from "express";
import { db, conversationsTable, messagesTable, campaignMetricsTable, windsorConnectionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

async function generateAthenaResponse(prompt: string, orgId: string): Promise<string> {
  const metrics = await db.select()
    .from(campaignMetricsTable)
    .where(eq(campaignMetricsTable.orgId, orgId));

  if (metrics.length === 0) {
    return "I don't have access to your campaign data yet. Please connect your Windsor.ai integration and run a sync first so I can analyze your marketing performance.";
  }

  const totalSpend = metrics.reduce((s, m) => s + m.spend, 0);
  const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0);
  const totalConversions = metrics.reduce((s, m) => s + m.conversions, 0);
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  const lp = prompt.toLowerCase();

  if (lp.includes("roas") || lp.includes("return on ad")) {
    return `Based on your last 30 days of data, your blended ROAS is **${roas.toFixed(2)}x** across $${totalSpend.toFixed(0)} in total spend. ${roas >= 3 ? "This is an excellent performance — you're generating strong returns." : roas >= 2 ? "This is solid performance, though there's room to optimize underperforming campaigns." : "This is below the industry benchmark of 3x. I recommend reviewing CPC and conversion rates across platforms."}`;
  }

  if (lp.includes("spend") || lp.includes("budget")) {
    return `Your total ad spend over the last 30 days is **$${totalSpend.toFixed(2)}**. This generated $${totalRevenue.toFixed(2)} in tracked revenue. ${totalSpend > 5000 ? "Consider reallocating budget from low-ROAS campaigns to your top performers." : "You have room to scale spend on high-ROAS campaigns to capture more conversions."}`;
  }

  if (lp.includes("conversion") || lp.includes("convert")) {
    const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
    return `Your campaigns generated **${totalConversions} total conversions** at an average CPA of $${cpa.toFixed(2)}. ${cpa < 20 ? "Your CPA is highly efficient." : cpa < 50 ? "CPA is within acceptable range. Focus on improving landing page conversion rates." : "CPA is elevated. Review your audience targeting and ad creative quality scores."}`;
  }

  if (lp.includes("meta") || lp.includes("facebook") || lp.includes("instagram")) {
    const metaMetrics = metrics.filter((m) => m.platform === "META_ADS");
    const metaSpend = metaMetrics.reduce((s, m) => s + m.spend, 0);
    const metaRevenue = metaMetrics.reduce((s, m) => s + m.revenue, 0);
    const metaRoas = metaSpend > 0 ? metaRevenue / metaSpend : 0;
    return `**Meta Ads Performance:** $${metaSpend.toFixed(0)} spend → $${metaRevenue.toFixed(0)} revenue (${metaRoas.toFixed(2)}x ROAS). ${metaRoas >= 2 ? "Meta is performing well for you." : "Consider testing new creative formats and Advantage+ campaigns to improve Meta performance."}`;
  }

  if (lp.includes("google")) {
    const googleMetrics = metrics.filter((m) => m.platform === "GOOGLE_ADS");
    const googleSpend = googleMetrics.reduce((s, m) => s + m.spend, 0);
    const googleRevenue = googleMetrics.reduce((s, m) => s + m.revenue, 0);
    const googleRoas = googleSpend > 0 ? googleRevenue / googleSpend : 0;
    return `**Google Ads Performance:** $${googleSpend.toFixed(0)} spend → $${googleRevenue.toFixed(0)} revenue (${googleRoas.toFixed(2)}x ROAS). ${googleRoas >= 3 ? "Google Ads is your strongest performing channel." : "Consider enabling Performance Max campaigns and Smart Bidding to improve Google results."}`;
  }

  if (lp.includes("waste") || lp.includes("inefficient") || lp.includes("underperform")) {
    const campaignMap = new Map<string, any>();
    for (const m of metrics) {
      if (!campaignMap.has(m.campaignId)) campaignMap.set(m.campaignId, { name: m.name, platform: m.platform, spend: 0, revenue: 0 });
      const c = campaignMap.get(m.campaignId)!;
      c.spend += m.spend;
      c.revenue += m.revenue;
    }
    const wasted = Array.from(campaignMap.values()).filter((c) => c.spend > 0 && c.revenue / c.spend < 1).slice(0, 3);
    if (wasted.length === 0) return "Great news — I don't see any campaigns with negative ROAS in your data. All campaigns are at least breaking even.";
    return `I identified **${wasted.length} campaign(s) with ROAS below 1x** (losing money): ${wasted.map((c) => `${c.name} ($${c.spend.toFixed(0)} spend)`).join(", ")}. I recommend pausing these and reallocating budget to your top performers.`;
  }

  // Generic summary response
  return `Based on your last 30 days: **$${totalSpend.toFixed(0)} total spend**, **$${totalRevenue.toFixed(0)} revenue**, **${roas.toFixed(2)}x blended ROAS**, and **${totalConversions} conversions**. Ask me about specific platforms, campaigns, or metrics and I'll give you a detailed breakdown and recommendations.`;
}

router.get("/conversations", requireAuth, async (req: any, res) => {
  try {
    const { orgId } = req.dbUser;
    const conversations = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.orgId, orgId));

    return res.json(conversations.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt.toISOString(),
    })));
  } catch (err: any) {
    req.log.error({ err }, "Get conversations error");
    return res.status(500).json({ error: "Failed to get conversations" });
  }
});

router.post("/conversations", requireAuth, async (req: any, res) => {
  try {
    const { orgId, id: userId } = req.dbUser;
    const { title } = req.body;

    const [conversation] = await db.insert(conversationsTable)
      .values({ orgId, userId, title: title || "New Conversation" })
      .returning();

    return res.status(201).json({
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt.toISOString(),
    });
  } catch (err: any) {
    req.log.error({ err }, "Create conversation error");
    return res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/conversations/:id/messages", requireAuth, async (req: any, res) => {
  try {
    const { orgId } = req.dbUser;
    const { id } = req.params;

    const [convo] = await db.select().from(conversationsTable)
      .where(and(eq(conversationsTable.id, id), eq(conversationsTable.orgId, orgId)))
      .limit(1);

    if (!convo) return res.status(404).json({ error: "Conversation not found" });

    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id));

    return res.json(messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })));
  } catch (err: any) {
    req.log.error({ err }, "Get messages error");
    return res.status(500).json({ error: "Failed to get messages" });
  }
});

router.post("/conversations/:id/messages", requireAuth, async (req: any, res) => {
  try {
    const { orgId } = req.dbUser;
    const { id } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ error: "Message content required" });

    const [convo] = await db.select().from(conversationsTable)
      .where(and(eq(conversationsTable.id, id), eq(conversationsTable.orgId, orgId)))
      .limit(1);

    if (!convo) return res.status(404).json({ error: "Conversation not found" });

    await db.insert(messagesTable).values({
      conversationId: id,
      role: "user",
      content,
    });

    const aiResponse = await generateAthenaResponse(content, orgId);

    const [aiMessage] = await db.insert(messagesTable).values({
      conversationId: id,
      role: "assistant",
      content: aiResponse,
    }).returning();

    if (convo.title === "New Conversation") {
      const words = content.split(" ").slice(0, 5).join(" ");
      await db.update(conversationsTable)
        .set({ title: words + "..." })
        .where(eq(conversationsTable.id, id));
    }

    return res.json({
      id: aiMessage.id,
      role: aiMessage.role,
      content: aiMessage.content,
      createdAt: aiMessage.createdAt.toISOString(),
    });
  } catch (err: any) {
    req.log.error({ err }, "Send message error");
    return res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
