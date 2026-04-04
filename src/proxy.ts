import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection middleware.
 * Redirects unauthenticated users to the login page (/).
 * Authentication is verified via the 'pin-token' cookie (httpOnly).
 */
export function middleware(request: NextRequest) {
  const pinToken = request.cookies.get('pin-token');

  // If no PIN cookie, redirect to login
  if (!pinToken?.value) {
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/accounts/:path*',
    '/allocation/:path*',
    '/performance/:path*',
    '/insights/:path*',
    '/journal/:path*',
    '/settings/:path*',
  ],
};
