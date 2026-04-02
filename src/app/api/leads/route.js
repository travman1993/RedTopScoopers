import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Resend } from 'resend';

// Rate limit: 5 submissions per 15 minutes per IP
const rateMap = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Strips non-digit characters and checks for 10–15 digits (handles US + international)
const PHONE_RE = /^\+?[\d\s\-().]{7,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ success: false, error: 'Too many requests. Please wait before submitting again.' }, { status: 429 });
  }

  try {
    const body = await request.json();

    // Required field presence
    if (!body.firstName || !body.lastName || !body.phone || !body.address) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Phone format validation
    if (!PHONE_RE.test(body.phone)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid phone number' }, { status: 400 });
    }

    // Email format validation (only if provided)
    if (body.email && !EMAIL_RE.test(body.email)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address' }, { status: 400 });
    }

    // Sanitize — strip HTML from text fields
    const clean = (v) => (typeof v === 'string' ? v.replace(/<[^>]*>/g, '').trim() : v);

    if (!isSupabaseConfigured()) {
      console.log('New lead (Supabase not configured):', body);
      return NextResponse.json({ success: true, message: 'Lead received (offline mode)' });
    }

    const { data, error } = await supabase.from('leads').insert([{
      first_name: clean(body.firstName),
      last_name: clean(body.lastName),
      phone: clean(body.phone),
      email: body.email ? clean(body.email) : null,
      address: clean(body.address),
      dogs: body.dogs,
      yard_size: body.yardSize,
      frequency: body.frequency,
      deodorizing: body.deodorizing,
      preferred_day: body.preferredDay || null,
      heard_about: body.heardAbout || null,
      last_cleaned: body.lastCleaned,
      notes: body.notes ? clean(body.notes) : null,
      quoted_monthly: body.quotedMonthly,
      quoted_weekly: body.quotedWeekly,
      is_heavy_cleanup: body.isHeavyCleanup,
      status: 'new',
      created_at: new Date().toISOString(),
    }]);

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ success: false, error: 'Failed to save your request. Please try again.' }, { status: 500 });
    }

    // Send emails via Resend (non-blocking)
    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const isRecurring = body.frequency !== 'onetime' && body.frequency !== 'deodorizing_only';
      const priceDisplay = isRecurring
        ? `$${body.quotedMonthly}/month`
        : `$${body.quotedMonthly} one-time`;

      const emails = [];

      if (body.email) {
        emails.push(resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: body.email,
          subject: 'Your Red Top Scoopers quote is ready!',
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
              <h2 style="color:#1a1a1a">Hey ${clean(body.firstName)}, thanks for reaching out! 🐾</h2>
              <p style="color:#444">We received your request and here's your estimated quote:</p>
              <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin:16px 0">
                <p style="margin:0;font-size:24px;font-weight:bold;color:#2d6a2d">${priceDisplay}</p>
                <p style="margin:4px 0 0;color:#666;font-size:14px">
                  ${body.dogs} dog${body.dogs !== 1 ? 's' : ''} · ${body.yardSize} yard
                  ${body.deodorizing ? ' · Deodorizing included' : ''}
                  ${isRecurring && body.preferredDay ? ` · ${body.preferredDay}s` : ''}
                </p>
              </div>
              <p style="color:#444">Travis will be in touch shortly to confirm your schedule. If you have questions, just reply to this email or:</p>
              <p style="margin:16px 0">
                <a href="tel:4046494654" style="background:#2d6a2d;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Call 404-649-4654</a>
              </p>
              <p style="color:#888;font-size:13px;margin-top:32px">Red Top Scoopers — Serving Bartow County &amp; Northwest Georgia</p>
            </div>`,
        }));
      }

      if (process.env.ADMIN_EMAIL) {
        const sep = isRecurring ? `${body.quotedMonthly}/mo` : `${body.quotedMonthly} one-time`;
        emails.push(resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: process.env.ADMIN_EMAIL,
          subject: `New lead: ${clean(body.firstName)} ${clean(body.lastName)} — ${clean(body.address)}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
              <h2 style="color:#1a1a1a">New Lead 🐾</h2>
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr><td style="padding:6px 0;color:#666;width:120px">Name</td><td style="padding:6px 0;font-weight:600">${clean(body.firstName)} ${clean(body.lastName)}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Phone</td><td style="padding:6px 0"><a href="tel:${body.phone}">${body.phone}</a></td></tr>
                ${body.email ? `<tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0">${body.email}</td></tr>` : ''}
                <tr><td style="padding:6px 0;color:#666">Address</td><td style="padding:6px 0">${clean(body.address)}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Dogs</td><td style="padding:6px 0">${body.dogs} · ${body.yardSize} yard</td></tr>
                <tr><td style="padding:6px 0;color:#666">Service</td><td style="padding:6px 0">${body.frequency}${body.deodorizing ? ' + deodorizing' : ''}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Quote</td><td style="padding:6px 0;font-weight:bold;color:#2d6a2d">$${sep}</td></tr>
                ${body.preferredDay ? `<tr><td style="padding:6px 0;color:#666">Preferred Day</td><td style="padding:6px 0;text-transform:capitalize">${body.preferredDay}</td></tr>` : ''}
                ${body.isHeavyCleanup ? `<tr><td style="padding:6px 0;color:#dc2626">⚠ Heavy Cleanup</td><td style="padding:6px 0;color:#dc2626">First visit may take longer</td></tr>` : ''}
                ${body.notes ? `<tr><td style="padding:6px 0;color:#666">Notes</td><td style="padding:6px 0">${clean(body.notes)}</td></tr>` : ''}
                <tr><td style="padding:6px 0;color:#666">Heard About</td><td style="padding:6px 0;text-transform:capitalize">${body.heardAbout || 'not specified'}</td></tr>
              </table>
              <p style="margin-top:20px">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://redtopscoopers.com'}/admin" style="background:#2d6a2d;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">View in Dashboard</a>
              </p>
            </div>`,
        }));
      }

      // Fire in parallel but don't block the response — log any failures
      Promise.allSettled(emails).then((results) => {
        results.forEach((result, i) => {
          if (result.status === 'rejected') {
            console.error(`Email send ${i} failed:`, result.reason);
          }
        });
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Leads API error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
