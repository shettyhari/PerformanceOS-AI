import { CampaignStatus } from '@prisma/client';
import type { WindsorDataRow } from '@/features/windsor/types';
import type { NormalizedCampaignMetric } from '@/features/windsor/types';

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function toBigInt(value: unknown): bigint {
  const num = Math.floor(toNumber(value));
  return BigInt(Math.max(0, num));
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function mapCampaignStatus(status: string | undefined): CampaignStatus {
  if (!status) return CampaignStatus.UNKNOWN;
  const normalized = status.toLowerCase();
  if (normalized.includes('active') || normalized === 'enabled') {
    return CampaignStatus.ACTIVE;
  }
  if (normalized.includes('pause')) return CampaignStatus.PAUSED;
  if (normalized.includes('archiv')) return CampaignStatus.ARCHIVED;
  return CampaignStatus.UNKNOWN;
}

function buildExternalId(
  source: string,
  campaignId: string | undefined,
  campaignName: string,
): string {
  if (campaignId) return `${source}:${campaignId}`;
  return `${source}:${campaignName.toLowerCase().replace(/\s+/g, '-')}`;
}

export function normalizeWindsorRow(
  row: WindsorDataRow,
  connector: string,
): NormalizedCampaignMetric | null {
  const date = parseDate(row.date);
  const campaignName = row.campaign?.trim();
  const source = (row.source ?? row.datasource ?? connector).toLowerCase();

  if (!date || !campaignName) return null;

  const externalId = buildExternalId(
    source,
    row.campaign_id?.toString(),
    campaignName,
  );

  const spend = toNumber(row.spend);
  const conversions = toNumber(row.conversions ?? row.actions);
  const revenue = toNumber(row.revenue);

  return {
    externalId,
    source,
    campaignName,
    channel: source,
    platform: connector,
    status: row.campaign_status ?? null,
    date,
    impressions: toBigInt(row.impressions),
    clicks: toBigInt(row.clicks),
    spend,
    conversions,
    revenue,
  };
}

export function computeDerivedMetrics(
  spend: number,
  conversions: number,
  revenue: number,
  clicks: bigint,
  impressions: bigint,
) {
  const roas = spend > 0 ? revenue / spend : null;
  const cpa = conversions > 0 ? spend / conversions : null;
  const ctr =
    impressions > 0n ? (Number(clicks) / Number(impressions)) * 100 : null;
  const cpc = Number(clicks) > 0 ? spend / Number(clicks) : null;

  return { roas, cpa, ctr, cpc };
}

export { mapCampaignStatus };
