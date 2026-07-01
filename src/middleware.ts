import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuthPage =
      req.nextUrl.pathname.startsWith('/login') ||
      req.nextUrl.pathname.startsWith('/register');

    if (isAuthPage && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage =
          req.nextUrl.pathname.startsWith('/login') ||
          req.nextUrl.pathname.startsWith('/register');
        const isPublic =
          req.nextUrl.pathname === '/' ||
          req.nextUrl.pathname.startsWith('/api/health') ||
          req.nextUrl.pathname.startsWith('/api/auth');

        if (isPublic || isAuthPage) return true;
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
