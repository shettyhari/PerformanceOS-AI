import { prisma } from "../lib/prisma";

export const mcpToolDefinitions = [
  {
    name: "get_overall_kpis",
    description: "Retrieves consolidated cross-channel marketing KPIs (Spend, Revenue, ROAS, Conversions, CPC, CTR) for the last 30 days.",
    parameters: {
      type: "OBJECT",
      properties: {},
      required: []
    }
  },
  {
    name: "get_campaign_performance",
    description: "Retrieves individual campaign statistics (Spend, Revenue, ROAS, Conversions, Status, Platform) for the organization.",
    parameters: {
      type: "OBJECT",
      properties: {
        platformFilter: {
          type: "STRING",
          description: "Optional platform filter (GOOGLE_ADS, META_ADS, LINKEDIN_ADS, MS_ADS)"
        }
      },
      required: []
    }
  },
  {
    name: "get_alerts_and_anomalies",
    description: "Retrieves active warnings and anomaly alerts (e.g. ROAS drop, CPA spikes) that need attention.",
    parameters: {
      type: "OBJECT",
      properties: {},
      required: []
    }
  },
  {
    name: "get_top_performers",
    description: "Retrieves platform breakdown comparisons (Google, Meta, LinkedIn, etc.) ranked by efficiency (ROAS).",
    parameters: {
      type: "OBJECT",
      properties: {},
      required: []
    }
  }
];

/**
 * Executes an MCP Tool in the secure context of an organization ID.
 */
export async function executeMcpTool(toolName: string, args: any, orgId: string): Promise<any> {
  console.log(`[MCP Tool Exec] Calling: ${toolName} for Org: ${orgId}`, args);

  switch (toolName) {
    case "get_overall_kpis": {
      const metrics = await prisma.metric.findMany({
        where: {
          campaign: {
            adAccount: { orgId }
          }
        }
      });

      let spend = 0;
      let revenue = 0;
      let conversions = 0;
      let clicks = 0;
      let impressions = 0;

      metrics.forEach((m) => {
        spend += Number(m.spend);
        revenue += Number(m.revenue);
        conversions += m.conversions;
        clicks += m.clicks;
        impressions += m.impressions;
      });

      return {
        spend,
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
        conversions,
        clicks,
        impressions,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
      };
    }

    case "get_campaign_performance": {
      const { platformFilter } = args;
      const campaigns = await prisma.campaign.findMany({
        where: {
          adAccount: {
            orgId,
            ...(platformFilter ? { platform: platformFilter } : {})
          }
        },
        include: {
          adAccount: true,
          metrics: true
        }
      });

      return campaigns.map((c) => {
        let spend = 0;
        let revenue = 0;
        let conversions = 0;
        c.metrics.forEach((m) => {
          spend += Number(m.spend);
          revenue += Number(m.revenue);
          conversions += m.conversions;
        });

        return {
          id: c.id,
          name: c.name,
          platform: c.adAccount.platform,
          status: c.status,
          spend,
          revenue,
          roas: spend > 0 ? revenue / spend : 0,
          conversions
        };
      });
    }

    case "get_alerts_and_anomalies": {
      const alerts = await prisma.alert.findMany({
        where: { orgId, isResolved: false },
        orderBy: { createdAt: "desc" }
      });
      return alerts;
    }

    case "get_top_performers": {
      const campaigns = await prisma.campaign.findMany({
        where: { adAccount: { orgId } },
        include: { adAccount: true, metrics: true }
      });

      const platforms: { [key: string]: { spend: number; revenue: number; conversions: number } } = {};

      campaigns.forEach((c) => {
        const plat = c.adAccount.platform;
        if (!platforms[plat]) platforms[plat] = { spend: 0, revenue: 0, conversions: 0 };
        
        c.metrics.forEach((m) => {
          platforms[plat].spend += Number(m.spend);
          platforms[plat].revenue += Number(m.revenue);
          platforms[plat].conversions += m.conversions;
        });
      });

      return Object.entries(platforms).map(([platform, data]) => ({
        platform,
        spend: data.spend,
        revenue: data.revenue,
        roas: data.spend > 0 ? data.revenue / data.spend : 0,
        conversions: data.conversions
      })).sort((a, b) => b.roas - a.roas);
    }

    default:
      throw new Error(`MCP Tool ${toolName} not found.`);
  }
}
