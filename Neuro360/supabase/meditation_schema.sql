-- =====================================================
-- Meditation Favorites & Sessions Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create meditation_favorites table
CREATE TABLE IF NOT EXISTS meditation_favorites (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
patient_email VARCHAR(255) NOT NULL,
meditation_id VARCHAR(50) NOT NULL, -- e.g., 'morning', 'stress', 'focus', etc.
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

-- Unique constraint to prevent duplicate favorites
UNIQUE(patient_email, meditation_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_med_favorites_email ON meditation_favorites(patient_email);
CREATE INDEX IF NOT EXISTS idx_med_favorites_meditation ON meditation_favorites(meditation_id);

-- Enable Row Level Security
ALTER TABLE meditation_favorites ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert meditation_favorites" ON meditation_favorites
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view meditation_favorites" ON meditation_favorites
FOR SELECT USING (true);

CREATE POLICY "Anyone can delete meditation_favorites" ON meditation_favorites
FOR DELETE USING (true);

-- =====================================================
-- Meditation Sessions Table (for tracking practice)
-- =====================================================

CREATE TABLE IF NOT EXISTS meditation_sessions (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
patient_email VARCHAR(255) NOT NULL,
meditation_id VARCHAR(50) NOT NULL, -- e.g., 'morning', 'stress', 'focus', etc.
duration_minutes INTEGER DEFAULT 10,
session_date DATE DEFAULT CURRENT_DATE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_med_sessions_email ON meditation_sessions(patient_email);
CREATE INDEX IF NOT EXISTS idx_med_sessions_date ON meditation_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_med_sessions_meditation ON meditation_sessions(meditation_id);

-- Enable Row Level Security
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert meditation_sessions" ON meditation_sessions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view meditation_sessions" ON meditation_sessions
FOR SELECT USING (true);

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get favorites for a patient
-- SELECT * FROM meditation_favorites WHERE patient_email = 'patient@email.com';

-- Get meditation sessions for a patient
-- SELECT * FROM meditation_sessions WHERE patient_email = 'patient@email.com' ORDER BY created_at DESC;

-- Get session stats for last 7 days
-- SELECT meditation_id, COUNT(*) as session_count, SUM(duration_minutes) as total_minutes
-- FROM meditation_sessions
-- WHERE patient_email = 'patient@email.com'
-- AND session_date >= CURRENT_DATE - INTERVAL '7 days'
-- GROUP BY meditation_id;

-- Get meditation streak (consecutive days)
-- WITH daily_sessions AS (
--   SELECT DISTINCT session_date FROM meditation_sessions
--   WHERE patient_email = 'patient@email.com'
-- )
-- SELECT COUNT(*) as streak FROM (
--   SELECT session_date,
--          session_date - (ROW_NUMBER() OVER (ORDER BY session_date))::int AS grp
--   FROM daily_sessions
-- ) t WHERE grp = (SELECT MAX(grp) FROM (
--   SELECT session_date,
--          session_date - (ROW_NUMBER() OVER (ORDER BY session_date))::int AS grp
--   FROM daily_sessions) t2);

-- Get most practiced meditation for a patient
-- SELECT meditation_id, COUNT(*) as count
-- FROM meditation_sessions
-- WHERE patient_email = 'patient@email.com'
-- GROUP BY meditation_id
-- ORDER BY count DESC
-- LIMIT 1;
