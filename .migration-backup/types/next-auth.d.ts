import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    orgId: string;
    orgSlug: string;
    orgName: string;
    role: string;
    permissions: string[];
  }

  interface User {
    id?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    orgId?: string;
    orgSlug?: string;
    orgName?: string;
    role?: string;
    permissions?: string[];
  }
}
