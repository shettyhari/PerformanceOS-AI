import Link from 'next/link';
import { requireAuthContext } from '@/lib/auth/session';
import { analyticsService } from '@/server/services';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CampaignsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function CampaignsPage({
  searchParams,
}: CampaignsPageProps) {
  const auth = await requireAuthContext();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));

  const data = await analyticsService.listCampaigns(
    auth.organizationId,
    '30d',
    page,
    20,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
        <p className="mt-1 text-muted-foreground">
          {data.total} campaigns · Last 30 days performance
        </p>
      </div>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle>All campaigns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.items.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No campaigns synced yet.{' '}
              <Link
                href="/dashboard/settings/integrations"
                className="text-primary underline"
              >
                Connect Windsor.ai
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-6 py-3 font-medium">Campaign</th>
                      <th className="px-6 py-3 font-medium">Channel</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 text-right font-medium">Spend</th>
                      <th className="px-6 py-3 text-right font-medium">Revenue</th>
                      <th className="px-6 py-3 text-right font-medium">ROAS</th>
                      <th className="px-6 py-3 text-right font-medium">
                        Conv.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((c) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="px-6 py-4 font-medium">{c.name}</td>
                        <td className="px-6 py-4 capitalize text-muted-foreground">
                          {c.channel ?? c.source}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatCurrency(c.spend)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatCurrency(c.revenue)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {c.roas ? `${c.roas.toFixed(2)}x` : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatNumber(c.conversions)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-6 py-4">
                  <p className="text-sm text-muted-foreground">
                    Page {data.page} of {data.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      asChild={page > 1}
                    >
                      {page > 1 ? (
                        <Link href={`/dashboard/campaigns?page=${page - 1}`}>
                          <ChevronLeft className="mr-1 h-4 w-4" />
                          Previous
                        </Link>
                      ) : (
                        <span>
                          <ChevronLeft className="mr-1 h-4 w-4" />
                          Previous
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.totalPages}
                      asChild={page < data.totalPages}
                    >
                      {page < data.totalPages ? (
                        <Link href={`/dashboard/campaigns?page=${page + 1}`}>
                          Next
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      ) : (
                        <span>
                          Next
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    PAUSED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    ARCHIVED: 'bg-muted text-muted-foreground',
    UNKNOWN: 'bg-muted text-muted-foreground',
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-muted text-muted-foreground'}`}
    >
      {status.toLowerCase()}
    </span>
  );
}
