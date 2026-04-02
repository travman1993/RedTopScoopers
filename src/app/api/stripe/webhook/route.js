import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {

      // Subscription checkout completed — customer entered card, billing starts
      case 'checkout.session.completed': {
        const session = event.data.object;
        const supabaseId = session.metadata?.supabase_id;
        if (!supabaseId) break;

        const updates = { payment_status: 'pending' };
        if (session.subscription) updates.stripe_subscription_id = session.subscription;

        await supabase.from('customers').update(updates).eq('id', supabaseId);

        // Send welcome billing email if customer has email
        const { data: customer } = await supabase
          .from('customers')
          .select('first_name, email, monthly_rate, frequency')
          .eq('id', supabaseId)
          .single();

        if (customer?.email && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
          const isRecurring = customer.frequency !== 'onetime' && customer.frequency !== 'deodorizing_only';
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL,
            to: customer.email,
            subject: 'Billing set up — Red Top Scoopers',
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
                <h2 style="color:#1a1a1a">You&apos;re all set, ${customer.first_name}! 🐾</h2>
                <p style="color:#444">Your billing has been set up with Red Top Scoopers.</p>
                ${isRecurring
                  ? `<p style="color:#444">Your card will be charged <strong>$${customer.monthly_rate}/month</strong> automatically. You&apos;ll receive a receipt each month.</p>`
                  : `<p style="color:#444">Your one-time payment of <strong>$${customer.monthly_rate}</strong> has been received. Thank you!</p>`
                }
                <p style="color:#444">Questions? Text or call us at <a href="tel:4046494654" style="color:#2d6a2d">404-649-4654</a>.</p>
                <p style="color:#888;font-size:13px;margin-top:32px">Red Top Scoopers — Pet Waste Removal</p>
              </div>`,
          });
        }
        break;
      }

      // Invoice paid — mark customer as paid
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const stripeCustomerId = invoice.customer;
        if (stripeCustomerId) {
          await supabase
            .from('customers')
            .update({ payment_status: 'paid' })
            .eq('stripe_customer_id', stripeCustomerId);
        }
        break;
      }

      // Invoice failed — mark customer as overdue
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const stripeCustomerId = invoice.customer;
        if (stripeCustomerId) {
          await supabase
            .from('customers')
            .update({ payment_status: 'overdue' })
            .eq('stripe_customer_id', stripeCustomerId);
        }
        break;
      }

      // Subscription cancelled (via Stripe dashboard or API)
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await supabase
          .from('customers')
          .update({ stripe_subscription_id: null, payment_status: 'removed' })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      // One-time payment succeeded
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const supabaseId = pi.metadata?.supabase_id;
        if (supabaseId && pi.metadata?.type === 'onetime_charge') {
          await supabase
            .from('customers')
            .update({ payment_status: 'paid' })
            .eq('id', supabaseId);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

// Required: disable body parsing so we can read raw body for signature verification
export const config = {
  api: { bodyParser: false },
};
