import type { Campaign, CampaignMetric, CampaignStatus } from '@prisma/client';
import type { NormalizedCampaignMetric } from '@/features/windsor/types';

export interface UpsertCampaignInput {
  organizationId: string;
  externalId: string;
  source: string;
  name: string;
  status: CampaignStatus;
  channel: string | null;
  platform: string | null;
}

export interface UpsertMetricInput {
  organizationId: string;
  campaignId: string;
  date: Date;
  impressions: bigint;
  clicks: bigint;
  spend: number;
  conversions: number;
  revenue: number;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  cpc: number | null;
}

export interface ICampaignRepository {
  upsertCampaign(input: UpsertCampaignInput): Promise<Campaign>;
  upsertMetric(input: UpsertMetricInput): Promise<CampaignMetric>;
  upsertMetricsBatch(inputs: UpsertMetricInput[]): Promise<number>;
  syncFromNormalized(
    organizationId: string,
    rows: NormalizedCampaignMetric[],
  ): Promise<{ campaigns: number; metrics: number }>;
  countByOrganization(organizationId: string): Promise<number>;
}
