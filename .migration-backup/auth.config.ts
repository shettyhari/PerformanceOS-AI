import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import LinkedIn from "next-auth/providers/linkedin";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "dummy",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "dummy",
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID || "dummy",
      clientSecret: process.env.AUTH_FACEBOOK_SECRET || "dummy",
    }),
    LinkedIn({
      clientId: process.env.AUTH_LINKEDIN_ID || "dummy",
      clientSecret: process.env.AUTH_LINKEDIN_SECRET || "dummy",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard") || nextUrl.pathname === "/";
      
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn && (nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register"))) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
