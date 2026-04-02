import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Let the login page through always
  if (pathname === '/admin/login') return NextResponse.next();

  const session = request.cookies.get('rts_session');
  const secret = process.env.SESSION_SECRET;

  if (!session?.value || !secret || session.value !== secret) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
