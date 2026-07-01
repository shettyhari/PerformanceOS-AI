import 'server-only';

import { z } from 'zod';
import type { AnalyticsPeriod } from '@/features/analytics/types';
import { analyticsService } from '@/server/services';
import { prisma } from '@/lib/db/prisma';

export interface McpToolContext {
  organizationId: string;
  userId: string;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodType<Record<string, unknown>>;
}

const periodSchema = z.enum(['7d', '30d', '90d']).default('30d');

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'get_campaign_metrics',
    description:
      'Get aggregated campaign metrics including spend, impressions, clicks, conversions, and revenue for a date period.',
    parameters: z.object({ period: periodSchema }),
  },
  {
    name: 'get_revenue_metrics',
    description: 'Get revenue, ROAS, and conversion totals for a date period.',
    parameters: z.object({ period: periodSchema }),
  },
  {
    name: 'get_spend_summary',
    description: 'Get total ad spend broken down by marketing channel.',
    parameters: z.object({ period: periodSchema }),
  },
  {
    name: 'get_conversions',
    description: 'Get conversion counts and CPA across all campaigns.',
    parameters: z.object({ period: periodSchema }),
  },
  {
    name: 'get_roas',
    description: 'Get return on ad spend (ROAS) summary and daily trend.',
    parameters: z.object({ period: periodSchema }),
  },
  {
    name: 'get_cpa',
    description: 'Get cost per acquisition (CPA) and spend efficiency metrics.',
    parameters: z.object({ period: periodSchema }),
  },
  {
    name: 'get_forecasts',
    description: 'Get stored forecast data for marketing metrics.',
    parameters: z.object({
      metricType: z.string().default('revenue'),
      days: z.number().int().min(1).max(90).default(30),
    }),
  },
  {
    name: 'query_crm',
    description: 'Query CRM contacts and deals pipeline summary.',
    parameters: z.object({
      stage: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(10),
    }),
  },
  {
    name: 'generate_report',
    description: 'List available reports or trigger report generation.',
    parameters: z.object({
      action: z.enum(['list', 'status']).default('list'),
    }),
  },
  {
    name: 'detect_anomalies',
    description:
      'Detect statistical anomalies in daily spend compared to the rolling average.',
    parameters: z.object({ period: periodSchema }),
  },
];

export async function executeMcpTool(
  toolName: string,
  args: Record<string, unknown>,
  context: McpToolContext,
): Promise<unknown> {
  const tool = MCP_TOOLS.find((t) => t.name === toolName);
  if (!tool) throw new Error(`Unknown tool: ${toolName}`);

  const parsed = tool.parameters.parse(args);
  const period = (parsed.period as AnalyticsPeriod | undefined) ?? '30d';
  const { organizationId } = context;

  switch (toolName) {
    case 'get_campaign_metrics': {
      const summary = await analyticsService.getDashboardSummary(
        organizationId,
        period,
      );
      const daily = await analyticsService.getDailyMetrics(
        organizationId,
        period,
      );
      return { summary, dailyMetrics: daily };
    }

    case 'get_revenue_metrics': {
      const summary = await analyticsService.getDashboardSummary(
        organizationId,
        period,
      );
      return {
        revenue: summary.revenue,
        roas: summary.roas,
        conversions: summary.conversions,
        period,
      };
    }

    case 'get_spend_summary': {
      const channels = await analyticsService.getChannelMetrics(
        organizationId,
        period,
      );
      const total = channels.reduce((s, c) => s + c.spend, 0);
      return { totalSpend: total, byChannel: channels, period };
    }

    case 'get_conversions': {
      const summary = await analyticsService.getDashboardSummary(
        organizationId,
        period,
      );
      return {
        conversions: summary.conversions,
        cpa: summary.cpa,
        clicks: summary.clicks,
        ctr: summary.ctr,
        period,
      };
    }

    case 'get_roas': {
      const summary = await analyticsService.getDashboardSummary(
        organizationId,
        period,
      );
      const daily = await analyticsService.getDailyMetrics(
        organizationId,
        period,
      );
      const roasTrend = daily.map((d) => ({
        date: d.date,
        roas: d.spend > 0 ? d.revenue / d.spend : 0,
      }));
      return { roas: summary.roas, trend: roasTrend, period };
    }

    case 'get_cpa': {
      const summary = await analyticsService.getDashboardSummary(
        organizationId,
        period,
      );
      return {
        cpa: summary.cpa,
        spend: summary.spend,
        conversions: summary.conversions,
        period,
      };
    }

    case 'get_forecasts': {
      const metricType = (parsed.metricType as string) ?? 'revenue';
      const days = (parsed.days as number) ?? 30;
      const from = new Date();
      from.setUTCDate(from.getUTCDate() - days);
      const forecasts = await prisma.forecast.findMany({
        where: {
          organizationId,
          metricType,
          forecastDate: { gte: from },
        },
        orderBy: { forecastDate: 'asc' },
        take: 90,
      });
      return { metricType, forecasts };
    }

    case 'query_crm': {
      const stage = parsed.stage as string | undefined;
      const limit = (parsed.limit as number) ?? 10;
      const [contacts, deals, pipeline] = await Promise.all([
        prisma.crmContact.count({
          where: { organizationId, deletedAt: null },
        }),
        prisma.crmDeal.findMany({
          where: {
            organizationId,
            deletedAt: null,
            ...(stage ? { stage: stage as never } : {}),
          },
          take: limit,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            name: true,
            value: true,
            stage: true,
            probability: true,
          },
        }),
        prisma.crmDeal.groupBy({
          by: ['stage'],
          where: { organizationId, deletedAt: null },
          _count: true,
          _sum: { value: true },
        }),
      ]);
      return { contactCount: contacts, deals, pipeline };
    }

    case 'generate_report': {
      const reports = await prisma.report.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          format: true,
          status: true,
          generatedAt: true,
        },
      });
      return { reports };
    }

    case 'detect_anomalies': {
      const daily = await analyticsService.getDailyMetrics(
        organizationId,
        period,
      );
      if (daily.length < 3) return { anomalies: [], message: 'Insufficient data' };

      const spends = daily.map((d) => d.spend);
      const mean = spends.reduce((a, b) => a + b, 0) / spends.length;
      const variance =
        spends.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / spends.length;
      const stdDev = Math.sqrt(variance);
      const threshold = mean + 2 * stdDev;

      const anomalies = daily
        .filter((d) => d.spend > threshold || (stdDev > 0 && d.spend < mean - 2 * stdDev))
        .map((d) => ({
          date: d.date,
          spend: d.spend,
          deviation: stdDev > 0 ? (d.spend - mean) / stdDev : 0,
          type: d.spend > threshold ? 'spike' : 'drop',
        }));

      return { mean, stdDev, threshold, anomalies, period };
    }

    default:
      throw new Error(`Tool not implemented: ${toolName}`);
  }
}

export function getGeminiFunctionDeclarations() {
  return MCP_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object' as const,
      properties: zodToGeminiProperties(tool.parameters),
      required: [],
    },
  }));
}

function zodToGeminiProperties(
  schema: z.ZodType<Record<string, unknown>>,
): Record<string, { type: string; description?: string; enum?: string[] }> {
  if (!(schema instanceof z.ZodObject)) return {};

  const shape = schema.shape;
  const properties: Record<
    string,
    { type: string; description?: string; enum?: string[] }
  > = {};

  for (const [key, value] of Object.entries(shape)) {
    if (value instanceof z.ZodEnum) {
      properties[key] = { type: 'string', enum: value.options as string[] };
    } else if (value instanceof z.ZodNumber) {
      properties[key] = { type: 'number' };
    } else if (value instanceof z.ZodString) {
      properties[key] = { type: 'string' };
    } else if (value instanceof z.ZodDefault) {
      const inner = value._def.innerType;
      if (inner instanceof z.ZodEnum) {
        properties[key] = { type: 'string', enum: inner.options as string[] };
      } else if (inner instanceof z.ZodNumber) {
        properties[key] = { type: 'number' };
      } else {
        properties[key] = { type: 'string' };
      }
    }
  }

  return properties;
}
