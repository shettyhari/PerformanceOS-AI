import { Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { OAuthButtons } from '@/features/auth/components/oauth-buttons';
import { getConfiguredOAuthProviders } from '@/lib/auth/providers';
import { env } from '@/lib/env';

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: 'Error starting OAuth sign-in. Check provider configuration.',
  OAuthCallback: 'Error during OAuth callback. Please try again.',
  OAuthCreateAccount: 'Could not create account. Please contact support.',
  Callback: 'Authentication callback error.',
  AccessDenied: 'Access denied. You may not have permission.',
  Configuration: 'Server configuration error. Contact administrator.',
  Default: 'An authentication error occurred. Please try again.',
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const providers = getConfiguredOAuthProviders();
  const callbackUrl = params.callbackUrl ?? '/dashboard';
  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? ERROR_MESSAGES.Default)
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to {env.NEXT_PUBLIC_APP_NAME}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your marketing dashboard
          </p>
        </div>

        <Card className="glass border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Use your work account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}
            <OAuthButtons providers={providers} callbackUrl={callbackUrl} />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
