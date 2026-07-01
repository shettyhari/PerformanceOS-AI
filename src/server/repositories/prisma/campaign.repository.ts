import 'server-only';

import { prisma } from '@/lib/db/prisma';
import {
  computeDerivedMetrics,
  mapCampaignStatus,
} from '@/lib/infrastructure/windsor/normalizer';
import type { NormalizedCampaignMetric } from '@/features/windsor/types';
import type {
  ICampaignRepository,
  UpsertCampaignInput,
  UpsertMetricInput,
} from '@/server/repositories/interfaces/campaign.repository';

const BATCH_SIZE = 250;

export class PrismaCampaignRepository implements ICampaignRepository {
  async upsertCampaign(input: UpsertCampaignInput) {
    return prisma.campaign.upsert({
      where: {
        organizationId_externalId_source: {
          organizationId: input.organizationId,
          externalId: input.externalId,
          source: input.source,
        },
      },
      create: {
        organizationId: input.organizationId,
        externalId: input.externalId,
        source: input.source,
        name: input.name,
        status: input.status,
        channel: input.channel,
        platform: input.platform,
        lastSyncedAt: new Date(),
      },
      update: {
        name: input.name,
        status: input.status,
        channel: input.channel,
        platform: input.platform,
        lastSyncedAt: new Date(),
      },
    });
  }

  async upsertMetric(input: UpsertMetricInput) {
    return prisma.campaignMetric.upsert({
      where: {
        organizationId_campaignId_date: {
          organizationId: input.organizationId,
          campaignId: input.campaignId,
          date: input.date,
        },
      },
      create: {
        organizationId: input.organizationId,
        campaignId: input.campaignId,
        date: input.date,
        impressions: input.impressions,
        clicks: input.clicks,
        spend: input.spend,
        conversions: input.conversions,
        revenue: input.revenue,
        roas: input.roas,
        cpa: input.cpa,
        ctr: input.ctr,
        cpc: input.cpc,
      },
      update: {
        impressions: input.impressions,
        clicks: input.clicks,
        spend: input.spend,
        conversions: input.conversions,
        revenue: input.revenue,
        roas: input.roas,
        cpa: input.cpa,
        ctr: input.ctr,
        cpc: input.cpc,
      },
    });
  }

  async upsertMetricsBatch(inputs: UpsertMetricInput[]): Promise<number> {
    let processed = 0;

    for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
      const batch = inputs.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((input) =>
          prisma.campaignMetric.upsert({
            where: {
              organizationId_campaignId_date: {
                organizationId: input.organizationId,
                campaignId: input.campaignId,
                date: input.date,
              },
            },
            create: {
              organizationId: input.organizationId,
              campaignId: input.campaignId,
              date: input.date,
              impressions: input.impressions,
              clicks: input.clicks,
              spend: input.spend,
              conversions: input.conversions,
              revenue: input.revenue,
              roas: input.roas,
              cpa: input.cpa,
              ctr: input.ctr,
              cpc: input.cpc,
            },
            update: {
              impressions: input.impressions,
              clicks: input.clicks,
              spend: input.spend,
              conversions: input.conversions,
              revenue: input.revenue,
              roas: input.roas,
              cpa: input.cpa,
              ctr: input.ctr,
              cpc: input.cpc,
            },
          }),
        ),
      );
      processed += batch.length;
    }

    return processed;
  }

  async syncFromNormalized(
    organizationId: string,
    rows: NormalizedCampaignMetric[],
  ): Promise<{ campaigns: number; metrics: number }> {
    const campaignIdMap = new Map<string, string>();
    const uniqueCampaigns = new Map<string, NormalizedCampaignMetric>();

    for (const row of rows) {
      const key = `${row.source}:${row.externalId}`;
      if (!uniqueCampaigns.has(key)) uniqueCampaigns.set(key, row);
    }

    for (const row of uniqueCampaigns.values()) {
      const campaign = await this.upsertCampaign({
        organizationId,
        externalId: row.externalId,
        source: row.source,
        name: row.campaignName,
        status: mapCampaignStatus(row.status ?? undefined),
        channel: row.channel,
        platform: row.platform,
      });
      campaignIdMap.set(`${row.source}:${row.externalId}`, campaign.id);
    }

    const metricInputs: UpsertMetricInput[] = [];

    for (const row of rows) {
      const campaignId = campaignIdMap.get(`${row.source}:${row.externalId}`);
      if (!campaignId) continue;

      const derived = computeDerivedMetrics(
        row.spend,
        row.conversions,
        row.revenue,
        row.clicks,
        row.impressions,
      );

      metricInputs.push({
        organizationId,
        campaignId,
        date: row.date,
        impressions: row.impressions,
        clicks: row.clicks,
        spend: row.spend,
        conversions: row.conversions,
        revenue: row.revenue,
        roas: derived.roas,
        cpa: derived.cpa,
        ctr: derived.ctr,
        cpc: derived.cpc,
      });
    }

    const metrics = await this.upsertMetricsBatch(metricInputs);

    return { campaigns: uniqueCampaigns.size, metrics };
  }

  countByOrganization(organizationId: string) {
    return prisma.campaign.count({ where: { organizationId } });
  }
}

export const campaignRepository = new PrismaCampaignRepository();
