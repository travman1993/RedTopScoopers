import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { validateAdminSession } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  if (!validateAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { customerId } = await request.json();

    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Reuse existing Stripe customer if already created
    let stripeCustomerId = customer.stripe_customer_id;
    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email || undefined,
        phone: customer.phone || undefined,
        metadata: { supabase_id: String(customerId) },
      });
      stripeCustomerId = stripeCustomer.id;
    }

    const isOnetime = customer.frequency === 'onetime' || customer.frequency === 'deodorizing_only';
    const amount = (customer.monthly_rate || customer.quoted_monthly || 0) * 100; // cents
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://redtopscoopers.com';
    const serviceLabel = isOnetime
      ? 'One-Time Cleanup'
      : customer.frequency === 'weekly'
      ? 'Weekly Service — Monthly Billing'
      : 'Bi-Weekly Service — Monthly Billing';

    // Bill subscriptions on the 1st of next month
    const now = new Date();
    const nextFirst = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const billingAnchor = Math.floor(nextFirst.getTime() / 1000);

    let checkoutSession;

    if (isOnetime) {
      checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: `Red Top Scoopers — ${serviceLabel}` },
            unit_amount: amount,
          },
          quantity: 1,
        }],
        success_url: `${baseUrl}/billing-success`,
        cancel_url: `${baseUrl}/admin?billing=cancelled`,
        metadata: { supabase_id: String(customerId), type: 'onetime', business: 'redtopscoopers' },
      });
    } else {
      checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: `Red Top Scoopers — ${serviceLabel}` },
            recurring: { interval: 'month' },
            unit_amount: amount,
          },
          quantity: 1,
        }],
        subscription_data: { billing_cycle_anchor: billingAnchor },
        success_url: `${baseUrl}/billing-success`,
        cancel_url: `${baseUrl}/admin?billing=cancelled`,
        metadata: { supabase_id: String(customerId), type: 'subscription', business: 'redtopscoopers' },
      });
    }

    // Save Stripe customer ID to Supabase (only updates if it changed)
    await supabase
      .from('customers')
      .update({ stripe_customer_id: stripeCustomerId, payment_status: 'pending' })
      .eq('id', customerId);

    return NextResponse.json({ checkoutUrl: checkoutSession.url, stripeCustomerId });
  } catch (err) {
    console.error('Stripe create-customer error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
