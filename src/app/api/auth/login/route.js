import { NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/auth';

// Rate limit: 5 attempts per 15 minutes per IP
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkLoginRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (!checkLoginRateLimit(ip)) {
    return NextResponse.json({ success: false, error: 'Too many login attempts. Try again in 15 minutes.' }, { status: 429 });
  }

  try {
    const { email, password } = await request.json();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const sessionSecret = process.env.SESSION_SECRET;

    if (!adminEmail || !adminPassword || !sessionSecret) {
      console.error('[auth] Missing required env vars: ADMIN_EMAIL, ADMIN_PASSWORD, or SESSION_SECRET');
      return NextResponse.json({ success: false, error: 'Server misconfigured' }, { status: 500 });
    }

    if (email === adminEmail && password === adminPassword) {
      // Store a derived HMAC token — never the raw secret
      const sessionToken = createSessionToken(sessionSecret);
      const response = NextResponse.json({ success: true });
      response.cookies.set('rts_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    }

    // Slow down brute force — artificial delay on failure
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
