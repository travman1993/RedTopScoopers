-- =============================================
-- Red Top Scoopers — Supabase Database Setup
-- Run this in your Supabase SQL Editor
-- =============================================

-- Leads table (form submissions)
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  dogs INTEGER NOT NULL DEFAULT 1,
  yard_size TEXT NOT NULL DEFAULT 'small',
  frequency TEXT NOT NULL DEFAULT 'weekly',
  deodorizing BOOLEAN DEFAULT FALSE,
  preferred_day TEXT,
  heard_about TEXT,
  last_cleaned TEXT,
  notes TEXT,
  quoted_monthly INTEGER,
  quoted_weekly INTEGER,
  is_heavy_cleanup BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table (approved leads)
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT REFERENCES leads(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  dogs INTEGER NOT NULL DEFAULT 1,
  yard_size TEXT NOT NULL DEFAULT 'small',
  frequency TEXT NOT NULL DEFAULT 'weekly',
  deodorizing BOOLEAN DEFAULT FALSE,
  schedule_day TEXT,
  start_date DATE,
  monthly_rate INTEGER,
  weekly_rate INTEGER,
  payment_status TEXT DEFAULT 'pending',
  route_order INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  -- Stripe integration
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  -- Service tracking
  last_service_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing tables (safe to run on existing DBs)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_service_date DATE;

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ─── LEADS POLICIES ──────────────────────────────────────────────────────────
-- Public can submit the quote form
CREATE POLICY IF NOT EXISTS "anon_insert_leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- Service role (used by API routes with supabaseAdmin) bypasses RLS automatically.
-- Authenticated role policies are kept for future Supabase Auth integration.
CREATE POLICY IF NOT EXISTS "authenticated_all_leads"
  ON leads FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── CUSTOMERS POLICIES ───────────────────────────────────────────────────────
-- Service role bypasses RLS automatically (no anon access needed for customers).
CREATE POLICY IF NOT EXISTS "authenticated_all_customers"
  ON customers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Schedule overrides table (one-time reschedules for recurring stops)
CREATE TABLE IF NOT EXISTS schedule_overrides (
  id BIGSERIAL PRIMARY KEY,
  customer_id TEXT NOT NULL,
  original_date DATE NOT NULL,
  new_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (customer_id, original_date)
);

ALTER TABLE schedule_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "authenticated_all_schedule_overrides"
  ON schedule_overrides FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_schedule_overrides_customer ON schedule_overrides(customer_id);
CREATE INDEX IF NOT EXISTS idx_schedule_overrides_new_date ON schedule_overrides(new_date);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_schedule ON customers(schedule_day);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_stripe ON customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_sub ON customers(stripe_subscription_id);
