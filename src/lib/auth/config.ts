import 'server-only';

import { PrismaAdapter } from '@auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import LinkedInProvider from 'next-auth/providers/linkedin';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { env } from '@/lib/env';
import { prisma } from '@/lib/db/prisma';
import { authService } from '@/server/services';

function buildProviders() {
  const providers: NextAuthOptions['providers'] = [];

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        authorization: { params: { prompt: 'consent', access_type: 'offline' } },
      }),
    );
  }

  if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
    providers.push(
      FacebookProvider({
        clientId: env.FACEBOOK_CLIENT_ID,
        clientSecret: env.FACEBOOK_CLIENT_SECRET,
      }),
    );
  }

  if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET) {
    providers.push(
      LinkedInProvider({
        clientId: env.LINKEDIN_CLIENT_ID,
        clientSecret: env.LINKEDIN_CLIENT_SECRET,
        authorization: { params: { scope: 'openid profile email' } },
      }),
    );
  }

  if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
    providers.push(
      AzureADProvider({
        clientId: env.MICROSOFT_CLIENT_ID,
        clientSecret: env.MICROSOFT_CLIENT_SECRET,
        tenantId: env.MICROSOFT_TENANT_ID,
      }),
    );
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: buildProviders(),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      if (!account) return true;

      const context = await authService.provisionOAuthUser({
        email: user.email,
        name: user.name,
        image: user.image,
      });

      user.id = context.userId;
      user.organizationId = context.organizationId;
      user.organizationSlug = context.organizationSlug;
      user.role = context.role;

      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.organizationId = user.organizationId ?? '';
        token.organizationSlug = user.organizationSlug ?? '';
        token.role = user.role ?? 'VIEWER';
      }

      if (trigger === 'update' || (token.id && !token.organizationId)) {
        const context = await authService.resolveSessionContext(token.id);
        if (context) {
          token.organizationId = context.organizationId;
          token.organizationSlug = context.organizationSlug;
          token.role = context.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.organizationId = token.organizationId;
        session.user.organizationSlug = token.organizationSlug;
        session.user.role = token.role;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id && user.organizationId) {
        await authService.logAuthEvent('LOGIN', user.id, user.organizationId, {
          provider: 'oauth',
        });
      }
    },
    async signOut({ token }) {
      if (token?.id && token?.organizationId) {
        await authService.logAuthEvent(
          'LOGOUT',
          token.id as string,
          token.organizationId as string,
        );
      }
    },
  },
  secret: env.NEXTAUTH_SECRET,
  debug: env.NODE_ENV === 'development',
};
