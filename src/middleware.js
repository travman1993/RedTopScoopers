import { NextResponse } from 'next/server';

// Web Crypto API version of createSessionToken — compatible with the Edge runtime.
// Produces the same HMAC-SHA256 output as the Node.js version in auth.js.
async function createSessionToken(secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode('rts-admin-v1'));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Constant-time string comparison (no Buffer needed in Edge runtime)
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') return NextResponse.next();

  const session = request.cookies.get('rts_session');
  const secret = process.env.SESSION_SECRET;

  if (!session?.value || !secret) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    const expected = await createSessionToken(secret);
    if (!timingSafeEqual(session.value, expected)) {
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
