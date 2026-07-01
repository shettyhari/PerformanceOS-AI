import { env } from '@/lib/env';
import type {
  WindsorApiResponse,
  WindsorConnectedAccount,
  WindsorConnectorInfo,
  WindsorDataRow,
  WindsorSyncField,
} from '@/features/windsor/types';

export class WindsorApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'WindsorApiError';
  }
}

interface FetchOptions {
  apiKey: string;
  path: string;
  params?: Record<string, string | number | undefined>;
  baseUrl?: string;
  retries?: number;
}

interface ConnectorDataOptions {
  apiKey: string;
  connector: string;
  fields: WindsorSyncField[];
  datePreset?: string;
  dateFrom?: string;
  dateTo?: string;
  maxRows?: number;
}

const USER_AGENT = 'PerformanceOS/1.0 Windsor/1.0';

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function windsorFetch<T>({
  apiKey,
  path,
  params = {},
  baseUrl = env.WINDSOR_API_BASE_URL,
  retries = 3,
}: FetchOptions): Promise<T> {
  const url = new URL(path, baseUrl);
  url.searchParams.set('api_key', apiKey);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': USER_AGENT,
        },
        cache: 'no-store',
      });

      const body = (await response.json()) as T & WindsorApiResponse;

      if (!response.ok) {
        const errorBody = body as WindsorApiResponse;
        const message =
          errorBody.error?.message ??
          `Windsor API request failed with status ${response.status}`;
        const code = errorBody.error?.code;

        if (response.status === 429 && attempt < retries - 1) {
          const retryAfter = Number(response.headers.get('Retry-After') ?? 5);
          await sleep(retryAfter * 1000);
          continue;
        }

        throw new WindsorApiError(message, response.status, code);
      }

      if ((body as WindsorApiResponse).error) {
        const err = (body as WindsorApiResponse).error!;
        throw new WindsorApiError(
          err.message ?? 'Windsor API error',
          response.status,
          err.code,
        );
      }

      return body;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof WindsorApiError && error.statusCode < 500) {
        throw error;
      }

      if (attempt < retries - 1) {
        await sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }

  throw lastError ?? new WindsorApiError('Windsor API request failed', 500);
}

export class WindsorClient {
  constructor(
    private readonly apiKey: string,
    private readonly connectorsBaseUrl = env.WINDSOR_API_BASE_URL,
    private readonly onboardBaseUrl = env.WINDSOR_ONBOARD_BASE_URL,
  ) {}

  async listConnectors(): Promise<WindsorConnectorInfo[]> {
    const result = await windsorFetch<WindsorConnectorInfo[] | { data: WindsorConnectorInfo[] }>({
      apiKey: this.apiKey,
      path: '/list_connectors',
      baseUrl: this.connectorsBaseUrl,
    });

    if (Array.isArray(result)) return result;
    if ('data' in result && Array.isArray(result.data)) return result.data;
    return [];
  }

  async fetchConnectorData(
    options: Omit<ConnectorDataOptions, 'apiKey'>,
  ): Promise<WindsorDataRow[]> {
    const result = await windsorFetch<WindsorApiResponse>({
      apiKey: this.apiKey,
      path: `/${options.connector}`,
      baseUrl: this.connectorsBaseUrl,
      params: {
        fields: options.fields.join(','),
        date_preset: options.datePreset,
        date_from: options.dateFrom,
        date_to: options.dateTo,
        _max_rows: options.maxRows ?? 50_000,
        _renderer: 'json',
      },
    });

    return result.data ?? [];
  }

  async validateApiKey(): Promise<{ valid: boolean; connectorCount: number }> {
    const connectors = await this.listConnectors();
    return { valid: true, connectorCount: connectors.length };
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now();
    await this.fetchConnectorData({
      connector: 'all',
      fields: ['date', 'source'],
      datePreset: 'last_7d',
      maxRows: 1,
    });
    return { healthy: true, latencyMs: Date.now() - start };
  }

  async listConnectedAccounts(): Promise<WindsorConnectedAccount[]> {
    const url = new URL('/api/common/ds-accounts', this.onboardBaseUrl);
    url.searchParams.set('datasource', 'all');
    url.searchParams.set('api_key', this.apiKey);

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new WindsorApiError(
        `Failed to list connected accounts: ${response.status}`,
        response.status,
      );
    }

    const data = (await response.json()) as WindsorConnectedAccount[];
    return Array.isArray(data) ? data : [];
  }
}

export function createWindsorClient(apiKey: string): WindsorClient {
  return new WindsorClient(apiKey);
}
