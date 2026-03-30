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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts to leads (for the public quote form)
CREATE POLICY "Allow public lead inserts"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated reads on all tables (for admin)
CREATE POLICY "Allow authenticated read leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated all on customers"
  ON customers FOR ALL
  TO authenticated
  USING (true);

-- Also allow anon to read/write for now (simple auth)
CREATE POLICY "Allow anon read leads"
  ON leads FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon all customers"
  ON customers FOR ALL
  TO anon
  USING (true);

-- Index for common queries
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_customers_schedule ON customers(schedule_day);
CREATE INDEX idx_customers_active ON customers(is_active);