-- =====================================================
-- ANS Sessions Table Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create ans_sessions table
CREATE TABLE IF NOT EXISTS ans_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    patient_email VARCHAR(255),

    -- Session details
    mode VARCHAR(10) NOT NULL, -- '1m', '3m', '5m'
    mode_name VARCHAR(50), -- 'Physiological Sigh', 'Box Breathing', 'Extended Exhale'
    duration_seconds INTEGER NOT NULL,
    completed BOOLEAN DEFAULT true,

    -- Pre-session check-in
    pre_stress INTEGER CHECK (pre_stress >= 0 AND pre_stress <= 10),
    pre_calm INTEGER CHECK (pre_calm >= 0 AND pre_calm <= 10),
    pre_focus INTEGER CHECK (pre_focus >= 0 AND pre_focus <= 10),

    -- Post-session check-in
    post_stress INTEGER CHECK (post_stress >= 0 AND post_stress <= 10),
    post_calm INTEGER CHECK (post_calm >= 0 AND post_calm <= 10),
    post_focus INTEGER CHECK (post_focus >= 0 AND post_focus <= 10),

    -- Delta calculations
    delta_stress INTEGER, -- pre_stress - post_stress (positive = improvement)
    delta_calm INTEGER, -- post_calm - pre_calm (positive = improvement)
    delta_focus INTEGER, -- post_focus - pre_focus (positive = improvement)

    -- Notes
    notes TEXT,

    -- Timestamps
    session_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ans_sessions_patient_id ON ans_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_ans_sessions_patient_email ON ans_sessions(patient_email);
CREATE INDEX IF NOT EXISTS idx_ans_sessions_session_date ON ans_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_ans_sessions_created_at ON ans_sessions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE ans_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert sessions
CREATE POLICY "Anyone can insert ans_sessions" ON ans_sessions
    FOR INSERT WITH CHECK (true);

-- Policy: Anyone can view their own sessions
CREATE POLICY "Anyone can view ans_sessions" ON ans_sessions
    FOR SELECT USING (true);

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get sessions for today for a patient
-- SELECT * FROM ans_sessions WHERE patient_email = 'patient@email.com' AND session_date = CURRENT_DATE;

-- Get session count for last 7 days
-- SELECT session_date, COUNT(*) as sessions FROM ans_sessions
-- WHERE patient_email = 'patient@email.com' AND session_date >= CURRENT_DATE - INTERVAL '7 days'
-- GROUP BY session_date ORDER BY session_date;

-- Get streak (consecutive days with sessions)
-- WITH daily_sessions AS (
--   SELECT DISTINCT session_date FROM ans_sessions WHERE patient_email = 'patient@email.com'
-- ),
-- streaks AS (
--   SELECT session_date, session_date - (ROW_NUMBER() OVER (ORDER BY session_date))::int AS streak_group
--   FROM daily_sessions
-- )
-- SELECT COUNT(*) as streak FROM streaks WHERE streak_group = (SELECT MAX(streak_group) FROM streaks);

-- Get average improvement per mode
-- SELECT mode, mode_name,
--   AVG(delta_stress) as avg_stress_improvement,
--   AVG(delta_calm) as avg_calm_improvement,
--   AVG(delta_focus) as avg_focus_improvement,
--   COUNT(*) as total_sessions
-- FROM ans_sessions WHERE patient_email = 'patient@email.com'
-- GROUP BY mode, mode_name;

-- =====================================================
-- ANS User Settings Table (for Reminders and Routines)
-- =====================================================

CREATE TABLE IF NOT EXISTS ans_user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) UNIQUE NOT NULL,
    patient_name VARCHAR(255),

    -- Reminder settings (stored as JSONB)
    -- Format: { "time": "09:00", "days": ["Mon", "Wed", "Fri"], "enabled": true }
    reminder JSONB,

    -- Routine settings (stored as JSONB)
    -- Format: { "mode": "3m", "headphonesOn": true, "hapticOn": true, "eyesClosed": false, "savedAt": "2024-01-01T00:00:00Z" }
    routine JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ans_user_settings_email ON ans_user_settings(patient_email);

-- Enable Row Level Security
ALTER TABLE ans_user_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert ans_user_settings" ON ans_user_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view ans_user_settings" ON ans_user_settings
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update ans_user_settings" ON ans_user_settings
    FOR UPDATE USING (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ans_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-update
DROP TRIGGER IF EXISTS trigger_ans_user_settings_updated_at ON ans_user_settings;
CREATE TRIGGER trigger_ans_user_settings_updated_at
    BEFORE UPDATE ON ans_user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_ans_user_settings_updated_at();
