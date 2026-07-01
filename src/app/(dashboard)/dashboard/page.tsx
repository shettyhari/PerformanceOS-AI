import { BarChart3, Brain, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAuthContext } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export default async function DashboardPage() {
  const auth = await requireAuthContext();

  const [memberCount, teamCount, campaignCount, windsorConnection] =
    await Promise.all([
    prisma.organizationMember.count({
      where: { organizationId: auth.organizationId },
    }),
    prisma.team.count({
      where: { organizationId: auth.organizationId, deletedAt: null },
    }),
    prisma.campaign.count({
      where: { organizationId: auth.organizationId },
    }),
    prisma.windsorConnection.findFirst({
      where: { organizationId: auth.organizationId, isActive: true },
      select: { lastSyncAt: true, healthStatus: true },
    }),
  ]);

  const stats = [
    {
      title: 'Team Members',
      value: memberCount.toString(),
      icon: Zap,
      description: 'Active organization members',
    },
    {
      title: 'Teams',
      value: teamCount.toString(),
      icon: BarChart3,
      description: 'Configured teams',
    },
    {
      title: 'Campaigns',
      value: campaignCount.toString(),
      icon: TrendingUp,
      description: windsorConnection
        ? `Last sync: ${windsorConnection.lastSyncAt ? new Date(windsorConnection.lastSyncAt).toLocaleDateString() : 'Pending'}`
        : 'Connect Windsor.ai to sync',
    },
    {
      title: 'Athena AI',
      value: 'Ready',
      icon: Brain,
      description: 'AI assistant available',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{auth.name ? `, ${auth.name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your marketing command center for {auth.organizationSlug}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            1. Connect your Windsor.ai account in Settings → Integrations
          </p>
          <p>2. Run your first data sync to populate campaign metrics</p>
          <p>3. Ask Athena AI for insights, forecasts, and recommendations</p>
        </CardContent>
      </Card>
    </div>
  );
}
