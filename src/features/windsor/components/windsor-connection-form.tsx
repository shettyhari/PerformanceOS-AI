'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  createWindsorConnection,
  type ActionResult,
} from '@/features/windsor/actions/windsor.actions';
import { WINDSOR_MARKETING_CONNECTORS } from '@/features/windsor/types';

const CONNECTOR_LABELS: Record<string, string> = {
  facebook: 'Meta (Facebook) Ads',
  google_ads: 'Google Ads',
  linkedin: 'LinkedIn Ads',
  bing: 'Microsoft Ads',
};

const initialState: ActionResult<{ connectionId: string }> = { success: false };

export function WindsorConnectionForm() {
  const [state, formAction, pending] = useActionState(
    createWindsorConnection,
    initialState,
  );

  return (
    <Card className="glass border-0">
      <CardHeader>
        <CardTitle>Connect Windsor.ai</CardTitle>
        <CardDescription>
          Add your Windsor.ai API key to sync marketing data from all connected
          channels.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Connection name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Production Windsor"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API key</Label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              placeholder="Your Windsor.ai API key"
              required
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a
                href="https://onboard.windsor.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                onboard.windsor.ai
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspaceId">Workspace ID (optional)</Label>
            <Input id="workspaceId" name="workspaceId" placeholder="workspace-id" />
          </div>

          <div className="space-y-2">
            <Label>Channels to sync</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {WINDSOR_MARKETING_CONNECTORS.map((connector) => (
                <label
                  key={connector}
                  className="flex items-center gap-2 rounded-lg border p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    name={`connector_${connector}`}
                    defaultChecked
                    className="h-4 w-4 rounded border-input"
                  />
                  {CONNECTOR_LABELS[connector] ?? connector}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="datePreset">Date range</Label>
              <select
                id="datePreset"
                name="datePreset"
                defaultValue="last_30d"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="last_7d">Last 7 days</option>
                <option value="last_30d">Last 30 days</option>
                <option value="last_90d">Last 90 days</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="syncIntervalMin">Auto-sync interval (minutes)</Label>
              <Input
                id="syncIntervalMin"
                name="syncIntervalMin"
                type="number"
                min={15}
                max={1440}
                defaultValue={60}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="autoSyncEnabled"
              defaultChecked
              className="h-4 w-4 rounded border-input"
            />
            Enable automatic sync
          </label>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state.success && (
            <p className="text-sm text-green-600">
              Connection created. Initial sync started.
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? 'Connecting...' : 'Connect & sync'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
