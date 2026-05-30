-- Migration: Add subscription fields to patients table
-- Run this in Supabase SQL Editor

-- Add missing subscription columns to patients table
-- NOTE: full_name already exists, skipping it
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS dashboard_access BOOLEAN DEFAULT false;

-- Create payment_history table (used by Patient Subscriptions page)
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_email VARCHAR(255),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_type VARCHAR(50),         -- e.g. 'subscription', 'one_time'
  tier VARCHAR(50),                 -- e.g. 'free', 'basic', 'pro', 'premium'
  status VARCHAR(50) DEFAULT 'completed',  -- 'completed', 'failed', 'pending'
  payment_provider VARCHAR(100) DEFAULT 'Stripe',
  transaction_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by patient email
CREATE INDEX IF NOT EXISTS idx_payment_history_patient_email ON payment_history(patient_email);
CREATE INDEX IF NOT EXISTS idx_payment_history_patient_id ON payment_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at DESC);

-- RLS: allow all for now (same as patients table)
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on payment_history" ON payment_history;
CREATE POLICY "Allow all operations on payment_history" ON payment_history FOR ALL USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_payment_history_updated_at
  BEFORE UPDATE ON payment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
