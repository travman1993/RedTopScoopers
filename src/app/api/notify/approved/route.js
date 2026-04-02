import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth';

export async function POST(request) {
  if (!validateAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return NextResponse.json({ ok: true, skipped: 'Resend not configured' });
  }

  try {
    const { firstName, email, frequency } = await request.json();

    if (!email) {
      return NextResponse.json({ ok: true, skipped: 'No email on file' });
    }

    const isRecurring = frequency !== 'onetime' && frequency !== 'deodorizing_only';

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: "You're approved! — Red Top Scoopers",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#1a1a1a">Great news, ${firstName}! 🐾</h2>
          <p style="color:#444">
            Your Red Top Scoopers service has been approved.
            ${isRecurring
              ? "Travis will be in touch shortly to confirm your schedule and send you a secure billing link."
              : "Travis will be in touch shortly to confirm your appointment date and send you a secure payment link."
            }
          </p>
          <p style="color:#444">
            In the meantime, feel free to reach out anytime:
          </p>
          <p style="margin:16px 0">
            <a href="tel:4046494654" style="background:#2d6a2d;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">
              Call or Text 404-649-4654
            </a>
          </p>
          <p style="color:#888;font-size:13px;margin-top:32px">Red Top Scoopers — We Handle the Dirty Work</p>
        </div>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Approval notification email failed:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
