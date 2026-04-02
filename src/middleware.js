import { NextResponse } from 'next/server';
import crypto from 'crypto';

function createSessionToken(secret) {
  return crypto.createHmac('sha256', secret).update('rts-admin-v1').digest('hex');
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') return NextResponse.next();

  const session = request.cookies.get('rts_session');
  const secret = process.env.SESSION_SECRET;

  if (!session?.value || !secret) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    const expected = Buffer.from(createSessionToken(secret));
    const actual = Buffer.from(session.value);
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
