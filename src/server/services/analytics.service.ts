import 'server-only';

import { cacheGet, cacheSet } from '@/lib/cache/redis';
import { campaignAnalyticsRepository } from '@/server/repositories/prisma/campaign-analytics.repository';
import type {
  AnalyticsPeriod,
  ExecutiveSummary,
  PaginatedCampaigns,
} from '@/features/analytics/types';
import {
  getDateRange,
  periodToDays,
  type ChannelMetric,
  type DailyMetricPoint,
  type DashboardSummary,
} from '@/features/analytics/types';

const CACHE_TTL = 300;

export class AnalyticsService {
  private cacheKey(orgId: string, suffix: string): string {
    return `metrics:${orgId}:${suffix}`;
  }

  async getDashboardSummary(
    organizationId: string,
    period: AnalyticsPeriod = '30d',
  ): Promise<DashboardSummary> {
    const key = this.cacheKey(organizationId, `summary:${period}`);
    const cached = await cacheGet<DashboardSummary>(key);
    if (cached) return cached;

    const { startDate, endDate } = getDateRange(period);
    const summary = await campaignAnalyticsRepository.getSummary(
      organizationId,
      startDate,
      endDate,
    );

    await cacheSet(key, summary, CACHE_TTL);
    return summary;
  }

  async getDailyMetrics(
    organizationId: string,
    period: AnalyticsPeriod = '30d',
  ): Promise<DailyMetricPoint[]> {
    const key = this.cacheKey(organizationId, `daily:${period}`);
    const cached = await cacheGet<DailyMetricPoint[]>(key);
    if (cached) return cached;

    const { startDate, endDate } = getDateRange(period);
    const data = await campaignAnalyticsRepository.getDailyMetrics(
      organizationId,
      startDate,
      endDate,
    );

    await cacheSet(key, data, CACHE_TTL);
    return data;
  }

  async getChannelMetrics(
    organizationId: string,
    period: AnalyticsPeriod = '30d',
  ): Promise<ChannelMetric[]> {
    const key = this.cacheKey(organizationId, `channels:${period}`);
    const cached = await cacheGet<ChannelMetric[]>(key);
    if (cached) return cached;

    const { startDate, endDate } = getDateRange(period);
    const data = await campaignAnalyticsRepository.getChannelMetrics(
      organizationId,
      startDate,
      endDate,
    );

    await cacheSet(key, data, CACHE_TTL);
    return data;
  }

  async listCampaigns(
    organizationId: string,
    period: AnalyticsPeriod = '30d',
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedCampaigns> {
    const { startDate, endDate } = getDateRange(period);
    return campaignAnalyticsRepository.listCampaigns(
      organizationId,
      startDate,
      endDate,
      page,
      pageSize,
    );
  }

  async getExecutiveSummary(
    organizationId: string,
    period: AnalyticsPeriod = '30d',
  ): Promise<ExecutiveSummary> {
    const key = this.cacheKey(organizationId, `executive:${period}`);
    const cached = await cacheGet<ExecutiveSummary>(key);
    if (cached) return cached;

    const { startDate, endDate } = getDateRange(period);
    const prevEnd = new Date(startDate);
    prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setUTCDate(
      prevStart.getUTCDate() - periodToDays(period) + 1,
    );

    const [current, previous, topChannels, topCampaigns] = await Promise.all([
      campaignAnalyticsRepository.getSummary(organizationId, startDate, endDate),
      campaignAnalyticsRepository.getSummary(
        organizationId,
        prevStart,
        prevEnd,
      ),
      campaignAnalyticsRepository.getChannelMetrics(
        organizationId,
        startDate,
        endDate,
      ),
      campaignAnalyticsRepository.getTopCampaigns(
        organizationId,
        startDate,
        endDate,
        5,
      ),
    ]);

    const spendChangePercent =
      previous.spend > 0
        ? ((current.spend - previous.spend) / previous.spend) * 100
        : null;
    const revenueChangePercent =
      previous.revenue > 0
        ? ((current.revenue - previous.revenue) / previous.revenue) * 100
        : null;

    const summary: ExecutiveSummary = {
      ...current,
      topChannels: topChannels.slice(0, 5),
      topCampaigns,
      periodLabel: `Last ${periodToDays(period)} days`,
      spendChangePercent,
      revenueChangePercent,
    };

    await cacheSet(key, summary, CACHE_TTL);
    return summary;
  }
}
