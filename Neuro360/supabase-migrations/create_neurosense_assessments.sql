-- ========================================
-- NeuroSense Assessments Table
-- Manages assessment/service cards on the NeuroSense booking page
-- ========================================
-- Execute this SQL in Supabase Dashboard > SQL Editor

-- Create neurosense_assessments table
CREATE TABLE IF NOT EXISTS neurosense_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT,                                      -- JotForm or external assessment link
  is_free BOOLEAN DEFAULT FALSE,
  is_inquire BOOLEAN DEFAULT FALSE,               -- Shows "Inquire Now" instead of payment
  original_price_usd NUMERIC(10,2) DEFAULT 0,
  sale_price_usd NUMERIC(10,2) DEFAULT 0,
  original_price_aed NUMERIC(10,2),
  sale_price_aed NUMERIC(10,2),
  original_price_inr NUMERIC(10,2),
  sale_price_inr NUMERIC(10,2),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  category TEXT DEFAULT 'individual' CHECK (category IN ('individual', 'bundle')),
  bundle_includes TEXT[],                         -- Array of assessment names included in bundle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Indexes
-- ========================================

-- Index on display_order and is_active for efficient sorting and filtering
CREATE INDEX IF NOT EXISTS idx_neurosense_assessments_display_order
  ON neurosense_assessments (display_order);

CREATE INDEX IF NOT EXISTS idx_neurosense_assessments_is_active
  ON neurosense_assessments (is_active);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

-- Enable RLS on the table
ALTER TABLE neurosense_assessments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow full read access (anon + authenticated)
CREATE POLICY "Allow public read access"
ON neurosense_assessments
FOR SELECT
TO anon, authenticated
USING (TRUE);

-- Policy: Allow insert (anon + authenticated - app handles auth)
CREATE POLICY "Allow insert"
ON neurosense_assessments
FOR INSERT
TO anon, authenticated
WITH CHECK (TRUE);

-- Policy: Allow update (anon + authenticated - app handles auth)
CREATE POLICY "Allow update"
ON neurosense_assessments
FOR UPDATE
TO anon, authenticated
USING (TRUE)
WITH CHECK (TRUE);

-- Policy: Allow delete (anon + authenticated - app handles auth)
CREATE POLICY "Allow delete"
ON neurosense_assessments
FOR DELETE
TO anon, authenticated
USING (TRUE);

-- ========================================
-- Seed Data: Individual Assessments
-- ========================================

INSERT INTO neurosense_assessments (title, description, link, is_free, is_inquire, original_price_usd, sale_price_usd, original_price_aed, sale_price_aed, original_price_inr, sale_price_inr, display_order, category) VALUES
(
  'Neuro Age Estimator',
  'Your Neuro Age Estimator compares how your brain is functioning today (attention, speed, memory, self-regulation) against typical patterns across age groups. It shows whether your brain is trending "younger," "on track," or "older" than your chronological age.',
  'https://form.jotform.com/252245065792056',
  false, false,
  19.99, 9.99,
  73, 37,
  1699, 849,
  1, 'individual'
),
(
  'Brain (Neuro) Fitness Score Advanced',
  'Your Brain (Neuro) Fitness Score Advanced is an at-a-glance score that summarizes how efficiently your brain is operating across key systems like focus, resilience, recovery, and cognitive stamina.',
  'https://form.jotform.com/232184893262057',
  true, false,
  9.99, 0,
  37, 0,
  849, 0,
  2, 'individual'
),
(
  'Brain (Neuro) Performance Score',
  'Your Brain (Neuro) Performance Score captures how strongly your brain is currently showing up for real-world demands like clarity, speed, mental stamina, focus consistency, and emotional steadiness under pressure.',
  'https://form.jotform.com/260034749079159',
  false, false,
  19.99, 9.99,
  73, 37,
  1699, 849,
  3, 'individual'
),
(
  'Brain (Neuro) Burnout Score',
  'Your Brain (Neuro) Burnout Score reflects the load your brain and nervous system are carrying, how strained you are, how well you''re recovering, and whether stress is showing up as fog, irritability, low motivation, or reduced focus.',
  'https://form.jotform.com/260117244562148',
  false, false,
  19.99, 9.99,
  73, 37,
  1699, 849,
  4, 'individual'
),
(
  'Brain Health Optimization Report',
  'Your NeuroSense QEEG Assessment decodes how your brain is functioning beneath the surface across attention, stress regulation, emotional processing, and cognitive efficiency using a 22-channel brain map.',
  NULL,
  false, true,
  999, 499,
  NULL, NULL,
  NULL, NULL,
  5, 'individual'
),
(
  'Expert Integrative Neurology Consultation',
  'Your comprehensive consultation includes a detailed neurological evaluation along with expert guidance on neuromodulation strategies and integrative brain health methods. We assess your symptoms, brain function, stress patterns, sleep, mood, and cognitive performance, and design a personalized roadmap using medical and holistic approaches for optimal outcomes.',
  NULL,
  false, true,
  69.99, 49.99,
  NULL, NULL,
  NULL, NULL,
  6, 'individual'
);

-- ========================================
-- Seed Data: Bundle Assessment
-- ========================================

INSERT INTO neurosense_assessments (title, description, link, is_free, is_inquire, original_price_usd, sale_price_usd, display_order, category, bundle_includes) VALUES
(
  'Digital Platinum Brain Check',
  'A comprehensive brain assessment bundle that includes Neuro Age Estimator, Brain (Neuro) Fitness Score Advanced, Brain (Neuro) Burnout Score, and Brain (Neuro) Performance Score. Get a complete picture of your brain health with this all-in-one package.',
  NULL,
  false, false,
  36, 25,
  0, 'bundle',
  ARRAY['Neuro Age Estimator', 'Brain (Neuro) Fitness Score Advanced', 'Brain (Neuro) Burnout Score', 'Brain (Neuro) Performance Score']
);
