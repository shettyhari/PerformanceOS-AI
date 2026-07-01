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
  updateOrganization,
  type UpdateOrganizationState,
} from '@/features/organizations/actions/organization.actions';

interface OrganizationSettingsFormProps {
  organization: {
    name: string;
    slug: string;
    timezone: string;
    currency: string;
  };
}

const initialState: UpdateOrganizationState = { success: false };

export function OrganizationSettingsForm({
  organization,
}: OrganizationSettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    updateOrganization,
    initialState,
  );

  return (
    <Card className="glass border-0">
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>
          Manage your organization profile and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={organization.name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={organization.slug} disabled />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={organization.timezone}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={organization.currency}
                maxLength={3}
                required
              />
            </div>
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state.success && (
            <p className="text-sm text-green-600">Settings saved successfully.</p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
