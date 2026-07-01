import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requirePermission } from '@/lib/auth/session';
import { windsorService } from '@/server/services';
import { WindsorConnectionForm } from '@/features/windsor/components/windsor-connection-form';
import { WindsorConnectionCard } from '@/features/windsor/components/windsor-connection-card';

export default async function IntegrationsPage() {
  const session = await requirePermission('integrations:read');
  const organizationId = session.user.organizationId;
  const connections = await windsorService.listConnections(organizationId);

  const connectionDetails = await Promise.all(
    connections.map(async (connection) => {
      const [syncJobs, logs] = await Promise.all([
        windsorService.getSyncJobs(connection.id, organizationId),
        windsorService.getConnectionLogs(connection.id, organizationId),
      ]);
      return { connection, syncJobs, logs };
    }),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/dashboard/settings"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to settings
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="mt-1 text-muted-foreground">
          Connect Windsor.ai to sync marketing data from Meta, Google, LinkedIn,
          and Microsoft Ads.
        </p>
      </div>

      {connectionDetails.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Active connections</h2>
          {connectionDetails.map(({ connection, syncJobs, logs }) => (
            <WindsorConnectionCard
              key={connection.id}
              connection={connection}
              syncJobs={syncJobs}
              logs={logs}
            />
          ))}
        </div>
      )}

      <WindsorConnectionForm />
    </div>
  );
}
