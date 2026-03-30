import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();

    if (!isSupabaseConfigured()) {
      console.log('New lead (Supabase not configured):', body);
      return NextResponse.json({ success: true, message: 'Lead received (offline mode)' });
    }

    const { data, error } = await supabase.from('leads').insert([
      {
        first_name: body.firstName,
        last_name: body.lastName,
        phone: body.phone,
        email: body.email || null,
        address: body.address,
        dogs: body.dogs,
        yard_size: body.yardSize,
        frequency: body.frequency,
        deodorizing: body.deodorizing,
        preferred_day: body.preferredDay || null,
        heard_about: body.heardAbout || null,
        last_cleaned: body.lastCleaned,
        notes: body.notes || null,
        quoted_monthly: body.quotedMonthly,
        quoted_weekly: body.quotedWeekly,
        is_heavy_cleanup: body.isHeavyCleanup,
        status: 'new',
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}