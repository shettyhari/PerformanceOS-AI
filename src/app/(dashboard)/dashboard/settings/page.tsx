import Link from 'next/link';
import { Plug, ChevronRight } from 'lucide-react';
import { requireAuthContext } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { OrganizationSettingsForm } from '@/features/organizations/components/organization-settings-form';
import { getRoleLabel, hasPermission } from '@/lib/auth/rbac';

export default async function SettingsPage() {
  const auth = await requireAuthContext();

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: auth.organizationId },
    select: {
      name: true,
      slug: true,
      timezone: true,
      currency: true,
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account and organization preferences
        </p>
      </div>

      <OrganizationSettingsForm organization={organization} />

      {hasPermission(auth.role, 'integrations:read') && (
        <Link
          href="/dashboard/settings/integrations"
          className="flex items-center justify-between rounded-2xl border bg-card p-6 transition-colors hover:bg-accent/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Plug className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Integrations</h2>
              <p className="text-sm text-muted-foreground">
                Connect Windsor.ai and sync marketing channels
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      )}

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="font-semibold">Your account</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{auth.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Role</dt>
            <dd>{getRoleLabel(auth.role)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
