import {
  DollarSign,
  MousePointerClick,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MetricCard,
  formatMetricValue,
} from '@/components/charts/metric-card';
import {
  ChannelSpendChart,
  SpendRevenueChart,
} from '@/components/charts/metric-charts';
import { requireAuthContext } from '@/lib/auth/session';
import { analyticsService } from '@/server/services';

export default async function DashboardPage() {
  const auth = await requireAuthContext();
  const period = '30d' as const;

  const [summary, daily, channels] = await Promise.all([
    analyticsService.getDashboardSummary(auth.organizationId, period),
    analyticsService.getDailyMetrics(auth.organizationId, period),
    analyticsService.getChannelMetrics(auth.organizationId, period),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{auth.name ? `, ${auth.name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Marketing overview · Last 30 days
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Spend"
          value={formatMetricValue('currency', summary.spend)}
          icon={DollarSign}
          subtitle={`${summary.campaignCount} campaigns`}
        />
        <MetricCard
          title="Revenue"
          value={formatMetricValue('currency', summary.revenue)}
          icon={TrendingUp}
          subtitle={formatMetricValue('roas', summary.roas) + ' ROAS'}
        />
        <MetricCard
          title="Conversions"
          value={formatMetricValue('number', summary.conversions)}
          icon={Target}
          subtitle={formatMetricValue('currency', summary.cpa) + ' CPA'}
        />
        <MetricCard
          title="Clicks"
          value={formatMetricValue('number', summary.clicks)}
          icon={MousePointerClick}
          subtitle={formatMetricValue('percent', summary.ctr) + ' CTR'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Spend vs Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {daily.length > 0 ? (
              <SpendRevenueChart data={daily} />
            ) : (
              <EmptyChart message="Sync Windsor.ai to see performance trends" />
            )}
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader>
            <CardTitle>Spend by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            {channels.length > 0 ? (
              <ChannelSpendChart data={channels} />
            ) : (
              <EmptyChart message="No channel data yet" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
