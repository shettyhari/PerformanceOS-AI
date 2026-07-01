import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: number | null;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('glass border-0', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend !== undefined && trend !== null && (
          <p
            className={cn(
              'mt-1 text-xs font-medium',
              trend >= 0 ? 'text-green-600' : 'text-destructive',
            )}
          >
            {trend >= 0 ? '+' : ''}
            {trend.toFixed(1)}% vs prior period
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function formatMetricValue(
  type: 'currency' | 'number' | 'percent' | 'roas',
  value: number | null,
): string {
  if (value === null || value === undefined) return '—';
  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return formatPercent(value);
    case 'roas':
      return `${value.toFixed(2)}x`;
    default:
      return formatNumber(value);
  }
}
