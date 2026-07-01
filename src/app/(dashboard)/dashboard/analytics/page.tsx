import { requireAuthContext } from '@/lib/auth/session';
import { analyticsService } from '@/server/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MetricCard,
  formatMetricValue,
} from '@/components/charts/metric-card';
import {
  ChannelBarChart,
  RoasLineChart,
  SpendRevenueChart,
} from '@/components/charts/metric-charts';
import { BarChart3, DollarSign, Target, TrendingUp } from 'lucide-react';

export default async function AnalyticsPage() {
  const auth = await requireAuthContext();
  const period = '30d' as const;

  const [summary, daily, channels] = await Promise.all([
    analyticsService.getDashboardSummary(auth.organizationId, period),
    analyticsService.getDailyMetrics(auth.organizationId, period),
    analyticsService.getChannelMetrics(auth.organizationId, period),
  ]);

  const roasTrend = daily.map((d) => ({
    date: d.date,
    roas: d.spend > 0 ? d.revenue / d.spend : 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Deep dive into marketing performance · Last 30 days
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Impressions"
          value={formatMetricValue('number', summary.impressions)}
          icon={BarChart3}
        />
        <MetricCard
          title="Spend"
          value={formatMetricValue('currency', summary.spend)}
          icon={DollarSign}
        />
        <MetricCard
          title="ROAS"
          value={formatMetricValue('roas', summary.roas)}
          icon={TrendingUp}
        />
        <MetricCard
          title="CPA"
          value={formatMetricValue('currency', summary.cpa)}
          icon={Target}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle>Spend & Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {daily.length > 0 ? (
              <SpendRevenueChart data={daily} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No data available
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader>
            <CardTitle>ROAS Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {roasTrend.length > 0 ? (
              <RoasLineChart data={roasTrend} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No data available
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Channel Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {channels.length > 0 ? (
              <ChannelBarChart data={channels} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No channel data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
