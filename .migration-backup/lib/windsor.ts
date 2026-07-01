import axios from "axios";

export interface WindsorMetricRaw {
  date: string;
  source: string;
  campaign: string;
  campaign_id?: string;
  clicks: string | number;
  impressions: string | number;
  spend: string | number;
  conversions: string | number;
  revenue: string | number;
  account_id?: string;
  account_name?: string;
}

export interface WindsorNormalizedMetric {
  date: Date;
  platform: string;
  accountExternalId: string;
  accountName: string;
  campaignExternalId: string;
  campaignName: string;
  clicks: number;
  impressions: number;
  spend: number;
  conversions: number;
  revenue: number;
}

const WINDSOR_BASE_URL = "https://api.windsor.ai/v1";

/**
 * Validates the Windsor API key by performing a lightweight fetch of the connector metadata.
 */
export async function validateWindsorApiKey(apiKey: string): Promise<boolean> {
  try {
    const url = `${WINDSOR_BASE_URL}/connectors?api_key=${apiKey}`;
    const response = await axios.get(url, { timeout: 10000 });
    
    // If the call succeeds, the API key is valid
    return response.status === 200;
  } catch (err: any) {
    console.error("Windsor API Validation Error:", err.response?.data || err.message);
    return false;
  }
}

/**
 * Fetches campaign performance statistics from Windsor.ai for a given date range.
 */
export async function fetchWindsorData(
  apiKey: string,
  dateFrom: string,
  dateTo: string
): Promise<WindsorNormalizedMetric[]> {
  try {
    // Standard fields requested to construct comprehensive multi-channel dashboard
    const fields = [
      "date",
      "source",
      "campaign",
      "campaign_id",
      "clicks",
      "impressions",
      "spend",
      "conversions",
      "revenue",
      "account_id",
      "account_name"
    ].join(",");

    const url = `${WINDSOR_BASE_URL}/performance?api_key=${apiKey}&date_from=${dateFrom}&date_to=${dateTo}&fields=${fields}`;
    const response = await axios.get(url, { timeout: 30000 });

    if (response.status !== 200 || !response.data || !Array.isArray(response.data.data)) {
      throw new Error(`Invalid response from Windsor API: ${response.statusText}`);
    }

    const rawData: WindsorMetricRaw[] = response.data.data;

    // Map platforms to our system enums and clean numeric conversions
    return rawData.map((item) => {
      const platformRaw = item.source?.toLowerCase() || "";
      let platform = "UNKNOWN";
      if (platformRaw.includes("google") || platformRaw.includes("gads")) {
        platform = "GOOGLE_ADS";
      } else if (platformRaw.includes("facebook") || platformRaw.includes("meta")) {
        platform = "META_ADS";
      } else if (platformRaw.includes("linkedin")) {
        platform = "LINKEDIN_ADS";
      } else if (platformRaw.includes("bing") || platformRaw.includes("microsoft")) {
        platform = "MS_ADS";
      } else if (platformRaw.includes("analytics") || platformRaw.includes("ga4")) {
        platform = "GA4";
      }

      return {
        date: new Date(item.date),
        platform,
        accountExternalId: item.account_id || "default_account",
        accountName: item.account_name || `${platform} Account`,
        campaignExternalId: item.campaign_id || `camp_${Math.random().toString(36).substr(2, 9)}`,
        campaignName: item.campaign || "Unnamed Campaign",
        clicks: Math.max(0, parseInt(String(item.clicks || 0), 10)),
        impressions: Math.max(0, parseInt(String(item.impressions || 0), 10)),
        spend: Math.max(0, parseFloat(String(item.spend || 0))),
        conversions: Math.max(0, parseInt(String(item.conversions || 0), 10)),
        revenue: Math.max(0, parseFloat(String(item.revenue || 0))),
      };
    });
  } catch (err: any) {
    console.error("Failed to fetch data from Windsor.ai:", err.response?.data || err.message);
    throw err;
  }
}
