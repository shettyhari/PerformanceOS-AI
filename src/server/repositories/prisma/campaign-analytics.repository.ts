import 'server-only';

import { prisma } from '@/lib/db/prisma';
import type { ICampaignAnalyticsRepository } from '@/server/repositories/interfaces/campaign-analytics.repository';
import type {
  CampaignListItem,
  ChannelMetric,
  DailyMetricPoint,
  DashboardSummary,
} from '@/features/analytics/types';

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function buildSummary(
  agg: {
    _sum: {
      spend: unknown;
      revenue: unknown;
      impressions: unknown;
      clicks: unknown;
      conversions: unknown;
    };
  },
  campaignCount: number,
): Omit<DashboardSummary, 'campaignCount'> & { campaignCount?: number } {
  const spend = toNumber(agg._sum.spend);
  const revenue = toNumber(agg._sum.revenue);
  const impressions = toNumber(agg._sum.impressions);
  const clicks = toNumber(agg._sum.clicks);
  const conversions = toNumber(agg._sum.conversions);

  return {
    spend,
    revenue,
    impressions,
    clicks,
    conversions,
    roas: spend > 0 ? revenue / spend : null,
    cpa: conversions > 0 ? spend / conversions : null,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : null,
    campaignCount,
  };
}

export class PrismaCampaignAnalyticsRepository
  implements ICampaignAnalyticsRepository
{
  async getSummary(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DashboardSummary> {
    const [agg, campaignCount] = await Promise.all([
      prisma.campaignMetric.aggregate({
        where: {
          organizationId,
          date: { gte: startDate, lte: endDate },
        },
        _sum: {
          spend: true,
          revenue: true,
          impressions: true,
          clicks: true,
          conversions: true,
        },
      }),
      prisma.campaign.count({ where: { organizationId } }),
    ]);

    return { ...buildSummary(agg, campaignCount), campaignCount };
  }

  async getDailyMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyMetricPoint[]> {
    const rows = await prisma.campaignMetric.groupBy({
      by: ['date'],
      where: {
        organizationId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        spend: true,
        revenue: true,
        impressions: true,
        clicks: true,
        conversions: true,
      },
      orderBy: { date: 'asc' },
    });

    return rows.map((row) => ({
      date: row.date.toISOString().split('T')[0] ?? '',
      spend: toNumber(row._sum.spend),
      revenue: toNumber(row._sum.revenue),
      impressions: toNumber(row._sum.impressions),
      clicks: toNumber(row._sum.clicks),
      conversions: toNumber(row._sum.conversions),
    }));
  }

  async getChannelMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ChannelMetric[]> {
    const campaigns = await prisma.campaign.findMany({
      where: { organizationId },
      select: {
        id: true,
        channel: true,
        source: true,
        metrics: {
          where: { date: { gte: startDate, lte: endDate } },
          select: { spend: true, revenue: true, conversions: true },
        },
      },
    });

    const channelMap = new Map<
      string,
      { spend: number; revenue: number; conversions: number }
    >();

    for (const campaign of campaigns) {
      const channel = campaign.channel ?? campaign.source ?? 'unknown';
      const current = channelMap.get(channel) ?? {
        spend: 0,
        revenue: 0,
        conversions: 0,
      };

      for (const metric of campaign.metrics) {
        current.spend += toNumber(metric.spend);
        current.revenue += toNumber(metric.revenue);
        current.conversions += toNumber(metric.conversions);
      }

      channelMap.set(channel, current);
    }

    return Array.from(channelMap.entries())
      .map(([channel, data]) => ({
        channel,
        spend: data.spend,
        revenue: data.revenue,
        conversions: data.conversions,
        roas: data.spend > 0 ? data.revenue / data.spend : null,
      }))
      .sort((a, b) => b.spend - a.spend);
  }

  async listCampaigns(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    page: number,
    pageSize: number,
  ) {
    const total = await prisma.campaign.count({ where: { organizationId } });
    const campaigns = await prisma.campaign.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        metrics: {
          where: { date: { gte: startDate, lte: endDate } },
          select: { spend: true, revenue: true, conversions: true },
        },
      },
    });

    const items: CampaignListItem[] = campaigns.map((c) => {
      const spend = c.metrics.reduce((s, m) => s + toNumber(m.spend), 0);
      const revenue = c.metrics.reduce((s, m) => s + toNumber(m.revenue), 0);
      const conversions = c.metrics.reduce(
        (s, m) => s + toNumber(m.conversions),
        0,
      );
      return {
        id: c.id,
        name: c.name,
        source: c.source,
        channel: c.channel,
        platform: c.platform,
        status: c.status,
        spend,
        revenue,
        conversions,
        roas: spend > 0 ? revenue / spend : null,
        lastSyncedAt: c.lastSyncedAt,
      };
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getTopCampaigns(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    limit: number,
  ): Promise<CampaignListItem[]> {
    const result = await this.listCampaigns(
      organizationId,
      startDate,
      endDate,
      1,
      100,
    );
    return result.items
      .sort((a, b) => b.spend - a.spend)
      .slice(0, limit);
  }
}

export const campaignAnalyticsRepository =
  new PrismaCampaignAnalyticsRepository();
