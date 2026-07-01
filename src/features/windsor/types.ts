export const WINDSOR_MARKETING_CONNECTORS = [
  'facebook',
  'google_ads',
  'linkedin',
  'bing',
] as const;

export type WindsorConnector = (typeof WINDSOR_MARKETING_CONNECTORS)[number];

export const WINDSOR_SYNC_FIELDS = [
  'date',
  'campaign',
  'campaign_id',
  'source',
  'datasource',
  'account_name',
  'spend',
  'impressions',
  'clicks',
  'conversions',
  'revenue',
  'actions',
  'campaign_status',
] as const;

export type WindsorSyncField = (typeof WINDSOR_SYNC_FIELDS)[number];

export interface WindsorConnectionConfig {
  connectors: WindsorConnector[];
  datePreset: string;
  dateFrom?: string;
  dateTo?: string;
}

export const DEFAULT_WINDSOR_CONFIG: WindsorConnectionConfig = {
  connectors: [...WINDSOR_MARKETING_CONNECTORS],
  datePreset: 'last_30d',
};

export type WindsorSyncJobType = 'full' | 'incremental' | 'manual';

export interface WindsorDataRow {
  date?: string;
  campaign?: string;
  campaign_id?: string;
  source?: string;
  datasource?: string;
  account_name?: string;
  spend?: number | string;
  impressions?: number | string;
  clicks?: number | string;
  conversions?: number | string;
  revenue?: number | string;
  actions?: number | string;
  campaign_status?: string;
  [key: string]: unknown;
}

export interface WindsorApiResponse {
  data?: WindsorDataRow[];
  error?: {
    code?: string;
    message?: string;
  };
}

export interface WindsorConnectorInfo {
  id: string;
  name?: string;
}

export interface WindsorConnectedAccount {
  datasource: string;
  account_name: string;
  account_id: string;
  status: string;
}

export interface NormalizedCampaignMetric {
  externalId: string;
  source: string;
  campaignName: string;
  channel: string | null;
  platform: string | null;
  status: string | null;
  date: Date;
  impressions: bigint;
  clicks: bigint;
  spend: number;
  conversions: number;
  revenue: number;
}

export interface WindsorConnectionView {
  id: string;
  name: string;
  workspaceId: string | null;
  isActive: boolean;
  healthStatus: string;
  lastHealthCheck: Date | null;
  lastSyncAt: Date | null;
  syncIntervalMin: number;
  autoSyncEnabled: boolean;
  config: WindsorConnectionConfig;
  createdAt: Date;
  pendingSync: boolean;
}

export interface WindsorSyncJobView {
  id: string;
  status: string;
  jobType: string;
  startedAt: Date | null;
  completedAt: Date | null;
  recordsProcessed: number;
  errorMessage: string | null;
  retryCount: number;
  createdAt: Date;
}

export interface WindsorConnectionLogView {
  id: string;
  level: string;
  message: string;
  createdAt: Date;
}
