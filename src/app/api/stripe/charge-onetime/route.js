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
    const { customerId, amount, description } = await request.json();

    const { data: customer, error } = await supabase
      .from('customers')
      .select('first_name, last_name, email, phone, stripe_customer_id')
      .eq('id', customerId)
      .single();

    if (error || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    let stripeCustomerId = customer.stripe_customer_id;

    if (!stripeCustomerId) {
      const sc = await stripe.customers.create({
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email || undefined,
        phone: customer.phone || undefined,
        metadata: { supabase_id: String(customerId) },
      });
      stripeCustomerId = sc.id;
      await supabase.from('customers').update({ stripe_customer_id: stripeCustomerId }).eq('id', customerId);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://redtopscoopers.com';

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: description || 'Red Top Scoopers — One-Time Service' },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/billing-success`,
      cancel_url: `${baseUrl}/admin?billing=cancelled`,
      metadata: { supabase_id: String(customerId), type: 'onetime_charge' },
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (err) {
    console.error('Stripe charge-onetime error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
