'use client';

import { useTransition } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  deleteWindsorConnection,
  triggerWindsorSync,
  validateWindsorConnection,
} from '@/features/windsor/actions/windsor.actions';
import type {
  WindsorConnectionView,
  WindsorConnectionLogView,
  WindsorSyncJobView,
} from '@/features/windsor/types';
import { cn } from '@/lib/utils';

interface WindsorConnectionCardProps {
  connection: WindsorConnectionView;
  syncJobs: WindsorSyncJobView[];
  logs: WindsorConnectionLogView[];
}

const HEALTH_COLORS: Record<string, string> = {
  HEALTHY: 'text-green-600',
  DEGRADED: 'text-yellow-600',
  UNHEALTHY: 'text-destructive',
  UNKNOWN: 'text-muted-foreground',
};

export function WindsorConnectionCard({
  connection,
  syncJobs,
  logs,
}: WindsorConnectionCardProps) {
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    startTransition(async () => {
      await triggerWindsorSync(connection.id);
      window.location.reload();
    });
  }

  function handleValidate() {
    startTransition(async () => {
      await validateWindsorConnection(connection.id);
      window.location.reload();
    });
  }

  function handleDelete() {
    if (!confirm('Delete this Windsor connection? This cannot be undone.')) {
      return;
    }
    startTransition(async () => {
      await deleteWindsorConnection(connection.id);
      window.location.reload();
    });
  }

  const latestJob = syncJobs[0];

  return (
    <Card className="glass border-0">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            {connection.name}
            {connection.isActive ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            )}
          </CardTitle>
          <CardDescription>
            {connection.workspaceId
              ? `Workspace: ${connection.workspaceId}`
              : 'Windsor.ai connection'}
          </CardDescription>
        </div>
        <span
          className={cn(
            'text-xs font-medium uppercase',
            HEALTH_COLORS[connection.healthStatus] ?? HEALTH_COLORS.UNKNOWN,
          )}
        >
          {connection.healthStatus.toLowerCase()}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Last sync</dt>
            <dd className="font-medium">
              {connection.lastSyncAt
                ? new Date(connection.lastSyncAt).toLocaleString()
                : 'Never'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Auto-sync</dt>
            <dd className="font-medium">
              {connection.autoSyncEnabled
                ? `Every ${connection.syncIntervalMin}m`
                : 'Disabled'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Channels</dt>
            <dd className="font-medium">
              {connection.config.connectors.length} connected
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Latest job</dt>
            <dd className="font-medium">
              {latestJob?.status.toLowerCase() ?? '—'}
              {latestJob?.recordsProcessed
                ? ` (${latestJob.recordsProcessed} rows)`
                : ''}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isPending || connection.pendingSync}
          >
            <RefreshCw
              className={cn('mr-2 h-4 w-4', isPending && 'animate-spin')}
            />
            {connection.pendingSync ? 'Syncing...' : 'Sync now'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleValidate}
            disabled={isPending}
          >
            <Activity className="mr-2 h-4 w-4" />
            Validate
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>

        {logs.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Recent activity
            </p>
            <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
              {logs.slice(0, 5).map((log) => (
                <li key={log.id} className="flex justify-between gap-2">
                  <span
                    className={cn(
                      log.level === 'error' && 'text-destructive',
                      log.level === 'warn' && 'text-yellow-600',
                    )}
                  >
                    {log.message}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
