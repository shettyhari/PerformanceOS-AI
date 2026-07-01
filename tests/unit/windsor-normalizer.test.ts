import { describe, it, expect } from 'vitest';
import {
  normalizeWindsorRow,
  computeDerivedMetrics,
  mapCampaignStatus,
} from '@/lib/infrastructure/windsor/normalizer';
import { CampaignStatus } from '@prisma/client';

describe('Windsor normalizer', () => {
  it('normalizes a valid Windsor row', () => {
    const result = normalizeWindsorRow(
      {
        date: '2025-06-01',
        campaign: 'Summer Sale',
        campaign_id: '12345',
        source: 'facebook',
        spend: '125.50',
        impressions: 10000,
        clicks: 250,
        conversions: 15,
        revenue: 1500,
      },
      'facebook',
    );

    expect(result).not.toBeNull();
    expect(result?.externalId).toBe('facebook:12345');
    expect(result?.campaignName).toBe('Summer Sale');
    expect(result?.spend).toBe(125.5);
    expect(result?.impressions).toBe(10000n);
  });

  it('returns null for rows missing required fields', () => {
    expect(normalizeWindsorRow({ spend: 100 }, 'facebook')).toBeNull();
    expect(
      normalizeWindsorRow({ date: '2025-06-01', campaign: '' }, 'facebook'),
    ).toBeNull();
  });

  it('computes derived metrics', () => {
    const derived = computeDerivedMetrics(100, 10, 500, 50n, 1000n);
    expect(derived.roas).toBe(5);
    expect(derived.cpa).toBe(10);
    expect(derived.ctr).toBe(5);
    expect(derived.cpc).toBe(2);
  });

  it('maps campaign status', () => {
    expect(mapCampaignStatus('ACTIVE')).toBe(CampaignStatus.ACTIVE);
    expect(mapCampaignStatus('paused')).toBe(CampaignStatus.PAUSED);
    expect(mapCampaignStatus(undefined)).toBe(CampaignStatus.UNKNOWN);
  });
});
