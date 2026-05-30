-- =====================================================
-- Frequency Music Tables Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. FREQUENCY FAVORITES TABLE
-- Tracks which frequency packs users have favorited
-- =====================================================

CREATE TABLE IF NOT EXISTS frequency_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) NOT NULL,
    frequency_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate favorites
    UNIQUE(patient_email, frequency_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_frequency_favorites_email ON frequency_favorites(patient_email);
CREATE INDEX IF NOT EXISTS idx_frequency_favorites_frequency ON frequency_favorites(frequency_id);

-- Enable RLS
ALTER TABLE frequency_favorites ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert frequency_favorites" ON frequency_favorites
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view frequency_favorites" ON frequency_favorites
    FOR SELECT USING (true);

CREATE POLICY "Anyone can delete their frequency_favorites" ON frequency_favorites
    FOR DELETE USING (true);


-- =====================================================
-- 2. FREQUENCY SESSIONS TABLE
-- Tracks listening sessions for analytics
-- =====================================================

CREATE TABLE IF NOT EXISTS frequency_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) NOT NULL,
    frequency_id VARCHAR(50) NOT NULL,
    duration_minutes INTEGER DEFAULT 15,
    session_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_frequency_sessions_email ON frequency_sessions(patient_email);
CREATE INDEX IF NOT EXISTS idx_frequency_sessions_date ON frequency_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_frequency_sessions_created ON frequency_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE frequency_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert frequency_sessions" ON frequency_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view frequency_sessions" ON frequency_sessions
    FOR SELECT USING (true);


-- =====================================================
-- 3. FREQUENCY PURCHASES TABLE
-- Tracks Stripe purchases for frequency packs
-- =====================================================

CREATE TABLE IF NOT EXISTS frequency_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) NOT NULL,
    frequency_id VARCHAR(50) NOT NULL,  -- e.g., 'delta', 'theta', 'all_packs_bundle'
    is_bundle BOOLEAN DEFAULT false,

    -- Stripe payment details
    stripe_session_id VARCHAR(255),
    stripe_payment_intent VARCHAR(255),
    amount_paid DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,  -- e.g., 'INR', 'USD', 'EUR'

    -- Payment status
    payment_status VARCHAR(50) DEFAULT 'completed',  -- 'completed', 'refunded', 'disputed'

    -- Timestamps
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_frequency_purchases_email ON frequency_purchases(patient_email);
CREATE INDEX IF NOT EXISTS idx_frequency_purchases_frequency ON frequency_purchases(frequency_id);
CREATE INDEX IF NOT EXISTS idx_frequency_purchases_stripe ON frequency_purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_frequency_purchases_date ON frequency_purchases(purchased_at DESC);

-- Enable RLS
ALTER TABLE frequency_purchases ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role can insert frequency_purchases" ON frequency_purchases
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view frequency_purchases" ON frequency_purchases
    FOR SELECT USING (true);


-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get all purchases for a user
-- SELECT * FROM frequency_purchases WHERE patient_email = 'user@email.com';

-- Check if user owns a specific pack or bundle
-- SELECT EXISTS (
--   SELECT 1 FROM frequency_purchases
--   WHERE patient_email = 'user@email.com'
--   AND (frequency_id = 'delta' OR frequency_id = 'all_packs_bundle')
-- ) as owns_pack;

-- Get total revenue by currency
-- SELECT currency, SUM(amount_paid) as total_revenue, COUNT(*) as total_purchases
-- FROM frequency_purchases
-- WHERE payment_status = 'completed'
-- GROUP BY currency;

-- Get most popular frequency packs
-- SELECT frequency_id, COUNT(*) as purchase_count
-- FROM frequency_purchases
-- WHERE payment_status = 'completed' AND is_bundle = false
-- GROUP BY frequency_id
-- ORDER BY purchase_count DESC;

-- Get listening stats for a user
-- SELECT
--   frequency_id,
--   COUNT(*) as session_count,
--   SUM(duration_minutes) as total_minutes
-- FROM frequency_sessions
-- WHERE patient_email = 'user@email.com'
-- GROUP BY frequency_id
-- ORDER BY session_count DESC;

