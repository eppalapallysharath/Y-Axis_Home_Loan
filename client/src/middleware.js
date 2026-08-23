import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || 'yaxis_home_loan_access_secret_key_32bytes_min!'
);

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ['/', '/login'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip static assets, next internal files, and API proxy routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;

  // Check if current route is a public route (/ or /login)
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (isPublicRoute) {
    if (accessToken) {
      try {
        await jwtVerify(accessToken, JWT_ACCESS_SECRET);
        // Already logged in with valid token -> redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch {
        // Token invalid/expired -> allow viewing public page
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // Protected route check: if no token -> redirect to login
  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(accessToken, JWT_ACCESS_SECRET);

    // Role-based route protection: /admin paths require ADMIN role
    if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
      const dashboardUrl = new URL('/dashboard', request.url);
      dashboardUrl.searchParams.set('error', 'forbidden');
      return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
  } catch (err) {
    // Token expired or invalid -> redirect to login preserving destination
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    loginUrl.searchParams.set('reason', 'session_expired');
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|images|icons).*)',
  ],
};
