import type {
  CampaignListItem,
  ChannelMetric,
  DailyMetricPoint,
  DashboardSummary,
  PaginatedCampaigns,
} from '@/features/analytics/types';

export interface ICampaignAnalyticsRepository {
  getSummary(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DashboardSummary>;
  getDailyMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyMetricPoint[]>;
  getChannelMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ChannelMetric[]>;
  listCampaigns(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    page: number,
    pageSize: number,
  ): Promise<PaginatedCampaigns>;
  getTopCampaigns(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    limit: number,
  ): Promise<CampaignListItem[]>;
}
