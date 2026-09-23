import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Intercept API routes to normalize authentication headers
  if (pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers);
    const authHeader = requestHeaders.get('authorization');
    const cookieToken = request.cookies.get('repily_token')?.value;

    // If Authorization header is absent but legacy cookie is present,
    // normalize by injecting Authorization: Bearer header for downstream handlers
    if (!authHeader && cookieToken) {
      requestHeaders.set('authorization', `Bearer ${cookieToken}`);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
