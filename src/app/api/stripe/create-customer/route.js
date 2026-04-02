import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { customerId } = await request.json();

    // Fetch customer from Supabase
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      metadata: { supabase_id: String(customerId) },
    });

    const isOnetime = customer.frequency === 'onetime' || customer.frequency === 'deodorizing_only';
    const amount = (customer.monthly_rate || customer.quoted_monthly || 0) * 100; // cents
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://redtopscoopers.com';
    const serviceLabel = isOnetime
      ? 'One-Time Cleanup'
      : customer.frequency === 'weekly'
      ? 'Weekly Service — Monthly Billing'
      : 'Bi-Weekly Service — Monthly Billing';

    let checkoutSession;

    if (isOnetime) {
      // One-time payment checkout
      checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomer.id,
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
        success_url: `${baseUrl}/admin?billing=success`,
        cancel_url: `${baseUrl}/admin?billing=cancelled`,
        metadata: { supabase_id: String(customerId), type: 'onetime' },
      });
    } else {
      // Recurring subscription checkout
      checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomer.id,
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
        success_url: `${baseUrl}/admin?billing=success`,
        cancel_url: `${baseUrl}/admin?billing=cancelled`,
        metadata: { supabase_id: String(customerId), type: 'subscription' },
      });
    }

    // Save Stripe customer ID to Supabase
    await supabase
      .from('customers')
      .update({ stripe_customer_id: stripeCustomer.id, payment_status: 'pending' })
      .eq('id', customerId);

    return NextResponse.json({ checkoutUrl: checkoutSession.url, stripeCustomerId: stripeCustomer.id });
  } catch (err) {
    console.error('Stripe create-customer error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
