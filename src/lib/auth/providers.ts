import 'server-only';

import { env } from '@/lib/env';
import type { OAuthProvider } from '@/features/auth/components/oauth-buttons';

export function getConfiguredOAuthProviders(): OAuthProvider[] {
  const providers: OAuthProvider[] = [];

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.push('google');
  }
  if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
    providers.push('facebook');
  }
  if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET) {
    providers.push('linkedin');
  }
  if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
    providers.push('azure-ad');
  }

  return providers;
}
