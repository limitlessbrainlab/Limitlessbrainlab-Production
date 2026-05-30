-- =====================================================
-- MOVERS Activities Table Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create movers_activities table
CREATE TABLE IF NOT EXISTS movers_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) NOT NULL,
    activity_id VARCHAR(100) NOT NULL, -- e.g., 'mind-meditation', 'exercise-yoga'
    category VARCHAR(50) NOT NULL, -- 'mind', 'oxygen', 'vitality', 'exercise', 'rest', 'social'
    points INTEGER DEFAULT 0,
    activity_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint to prevent duplicate activities on same day
    UNIQUE(patient_email, activity_id, activity_date)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_movers_patient_email ON movers_activities(patient_email);
CREATE INDEX IF NOT EXISTS idx_movers_activity_date ON movers_activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_movers_category ON movers_activities(category);

-- Enable Row Level Security
ALTER TABLE movers_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert activities
CREATE POLICY "Anyone can insert movers_activities" ON movers_activities
    FOR INSERT WITH CHECK (true);

-- Policy: Anyone can view their own activities
CREATE POLICY "Anyone can view movers_activities" ON movers_activities
    FOR SELECT USING (true);

-- Policy: Anyone can delete their own activities
CREATE POLICY "Anyone can delete movers_activities" ON movers_activities
    FOR DELETE USING (true);

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get today's completed activities for a patient
-- SELECT * FROM movers_activities
-- WHERE patient_email = 'patient@email.com' AND activity_date = CURRENT_DATE;

-- Get total points for today
-- SELECT SUM(points) as total_points FROM movers_activities
-- WHERE patient_email = 'patient@email.com' AND activity_date = CURRENT_DATE;

-- Get activities count by category for last 7 days
-- SELECT category, COUNT(*) as count FROM movers_activities
-- WHERE patient_email = 'patient@email.com'
-- AND activity_date >= CURRENT_DATE - INTERVAL '7 days'
-- GROUP BY category;

-- Get streak (consecutive days with at least one activity)
-- WITH daily_activities AS (
--   SELECT DISTINCT activity_date FROM movers_activities
--   WHERE patient_email = 'patient@email.com'
-- )
-- SELECT COUNT(*) as streak FROM (
--   SELECT activity_date,
--          activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date))::int AS grp
--   FROM daily_activities
-- ) t WHERE grp = (SELECT MAX(grp) FROM (
--   SELECT activity_date,
--          activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date))::int AS grp
--   FROM daily_activities) t2);
