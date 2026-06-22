import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "./lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });
        
        if (!user || !user.passwordHash) return null;
        
        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!isValid) return null;
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      }
    })
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!user.email) return false;
      
      if (account?.provider !== "credentials") {
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email }
        });
        
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "User",
            }
          });
        }
        
        const membership = await prisma.orgMember.findFirst({
          where: { userId: dbUser.id }
        });
        
        if (!membership) {
          const orgSlug = `${dbUser.name?.toLowerCase().replace(/[^a-z0-9]/g, "") || "org"}-${Math.floor(1000 + Math.random() * 9000)}`;
          const org = await prisma.organization.create({
            data: {
              name: `${dbUser.name || "User"}'s Workspace`,
              slug: orgSlug,
              settings: {
                create: {}
              }
            }
          });
          
          let ownerRole = await prisma.role.findFirst({
            where: { name: "OWNER" }
          });
          
          if (!ownerRole) {
            ownerRole = await prisma.role.create({
              data: { name: "OWNER" }
            });
          }
          
          await prisma.orgMember.create({
            data: {
              orgId: org.id,
              userId: dbUser.id,
              roleId: ownerRole.id,
            }
          });
        }
      }
      
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          include: {
            memberships: {
              include: {
                org: true,
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        });
        
        if (dbUser && dbUser.memberships.length > 0) {
          const activeMembership = dbUser.memberships[0];
          token.orgId = activeMembership.orgId;
          token.orgSlug = activeMembership.org.slug;
          token.orgName = activeMembership.org.name;
          token.role = activeMembership.role.name;
          token.permissions = activeMembership.role.permissions.map(rp => rp.permission.name);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.orgId = token.orgId as string;
        session.orgSlug = token.orgSlug as string;
        session.orgName = token.orgName as string;
        session.role = token.role as string;
        session.permissions = token.permissions as string[];
      }
      return session;
    }
  }
});
