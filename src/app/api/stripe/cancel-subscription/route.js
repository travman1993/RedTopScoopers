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
    const { customerId, immediately = false } = await request.json();

    const { data: customer, error } = await supabase
      .from('customers')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', customerId)
      .single();

    if (error || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (customer.stripe_subscription_id) {
      if (immediately) {
        await stripe.subscriptions.cancel(customer.stripe_subscription_id);
      } else {
        await stripe.subscriptions.update(customer.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      }
    }

    await supabase
      .from('customers')
      .update({ stripe_subscription_id: null, payment_status: 'removed' })
      .eq('id', customerId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Stripe cancel-subscription error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
