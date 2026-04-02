import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const adminEmail = process.env.ADMIN_EMAIL || 'redtopscoopers@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD;
    const sessionSecret = process.env.SESSION_SECRET;

    if (!adminPassword || !sessionSecret) {
      return NextResponse.json({ success: false, error: 'Server misconfigured' }, { status: 500 });
    }

    if (email === adminEmail && password === adminPassword) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('rts_session', sessionSecret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
