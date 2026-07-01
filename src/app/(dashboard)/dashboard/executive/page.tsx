import Link from 'next/link';
import { requireAuthContext } from '@/lib/auth/session';
import { analyticsService } from '@/server/services';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MetricCard,
  formatMetricValue,
} from '@/components/charts/metric-card';
import { ChannelBarChart } from '@/components/charts/metric-charts';
import { Brain, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function ExecutivePage() {
  const auth = await requireAuthContext();
  const summary = await analyticsService.getExecutiveSummary(
    auth.organizationId,
    '30d',
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Executive Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">{summary.periodLabel}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/athena">
            <Brain className="mr-2 h-4 w-4" />
            Ask Athena
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Spend"
          value={formatMetricValue('currency', summary.spend)}
          icon={DollarSign}
          trend={summary.spendChangePercent}
        />
        <MetricCard
          title="Revenue"
          value={formatMetricValue('currency', summary.revenue)}
          icon={TrendingUp}
          trend={summary.revenueChangePercent}
        />
        <MetricCard
          title="ROAS"
          value={formatMetricValue('roas', summary.roas)}
          icon={TrendingUp}
        />
        <MetricCard
          title="Campaigns"
          value={formatMetricValue('number', summary.campaignCount)}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle>Top Channels</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.topChannels.length > 0 ? (
              <ChannelBarChart data={summary.topChannels} />
            ) : (
              <p className="text-sm text-muted-foreground">No channel data</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader>
            <CardTitle>Top Campaigns by Spend</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.topCampaigns.length > 0 ? (
              <ul className="space-y-3">
                {summary.topCampaigns.map((c, i) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {c.channel ?? c.source}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{formatCurrency(c.spend)}</p>
                      <p className="text-muted-foreground">
                        {c.roas ? `${c.roas.toFixed(2)}x ROAS` : '—'} ·{' '}
                        {formatNumber(c.conversions)} conv.
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No campaigns yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
