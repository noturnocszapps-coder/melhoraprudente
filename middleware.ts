import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Check if subdomain is "midia"
  const isMidiaSubdomain = hostname.startsWith('midia.') || hostname === 'midia.localhost:3000';
  const isMidiaPath = url.pathname.startsWith('/midia');

  // Inject header to denote if this is a midia.roxou.com.br page request
  const requestHeaders = new Headers(request.headers);
  if (isMidiaSubdomain || isMidiaPath) {
    requestHeaders.set('x-is-midia', 'true');
  }

  // If visiting the root of the midia subdomain, rewrite to /midia
  if (isMidiaSubdomain && url.pathname === '/') {
    url.pathname = '/midia';
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      }
    });
  }

  // Continue with the modified headers for path matches too
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
}

export const config = {
  matcher: [
    // Match all paths except api, static files, favicon, public folder assets
    '/((?!api|_next/static|_next/image|favicon.ico|assets|public|.*\\..*).*)',
  ],
};
