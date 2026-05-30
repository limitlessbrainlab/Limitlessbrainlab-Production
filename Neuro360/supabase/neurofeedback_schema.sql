-- =====================================================
-- Neurofeedback Sessions & Bookings Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create neurofeedback_sessions table (for tracking completed sessions)
CREATE TABLE IF NOT EXISTS neurofeedback_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) NOT NULL,
    focus_area VARCHAR(100) NOT NULL, -- e.g., 'Stress & Calm', 'Focus & Attention', etc.
    duration_minutes INTEGER DEFAULT 30,
    session_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    rating INTEGER DEFAULT 4 CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nf_sessions_email ON neurofeedback_sessions(patient_email);
CREATE INDEX IF NOT EXISTS idx_nf_sessions_date ON neurofeedback_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_nf_sessions_focus ON neurofeedback_sessions(focus_area);

-- Enable Row Level Security
ALTER TABLE neurofeedback_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert neurofeedback_sessions" ON neurofeedback_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view neurofeedback_sessions" ON neurofeedback_sessions
    FOR SELECT USING (true);

-- =====================================================
-- Neurofeedback Bookings Table (for booking consultations)
-- =====================================================

CREATE TABLE IF NOT EXISTS neurofeedback_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) NOT NULL,
    patient_name VARCHAR(255),
    booking_date DATE NOT NULL,
    booking_time VARCHAR(20) NOT NULL, -- e.g., '10:00 AM'
    session_type VARCHAR(20) DEFAULT 'online', -- 'online', 'in-person'
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
    coach_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nf_bookings_email ON neurofeedback_bookings(patient_email);
CREATE INDEX IF NOT EXISTS idx_nf_bookings_date ON neurofeedback_bookings(booking_date DESC);
CREATE INDEX IF NOT EXISTS idx_nf_bookings_status ON neurofeedback_bookings(status);

-- Enable Row Level Security
ALTER TABLE neurofeedback_bookings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert neurofeedback_bookings" ON neurofeedback_bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view neurofeedback_bookings" ON neurofeedback_bookings
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update neurofeedback_bookings" ON neurofeedback_bookings
    FOR UPDATE USING (true);

-- =====================================================
-- Function to update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_nf_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_nf_bookings_updated_at ON neurofeedback_bookings;
CREATE TRIGGER trigger_nf_bookings_updated_at
    BEFORE UPDATE ON neurofeedback_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_nf_bookings_updated_at();

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get sessions for a patient
-- SELECT * FROM neurofeedback_sessions WHERE patient_email = 'patient@email.com' ORDER BY session_date DESC;

-- Get session stats for a patient
-- SELECT
--   COUNT(*) as total_sessions,
--   SUM(duration_minutes) as total_minutes,
--   AVG(rating) as avg_rating
-- FROM neurofeedback_sessions
-- WHERE patient_email = 'patient@email.com';

-- Get sessions by focus area
-- SELECT focus_area, COUNT(*) as count, SUM(duration_minutes) as total_minutes
-- FROM neurofeedback_sessions
-- WHERE patient_email = 'patient@email.com'
-- GROUP BY focus_area
-- ORDER BY count DESC;

-- Get pending bookings
-- SELECT * FROM neurofeedback_bookings WHERE status = 'pending' ORDER BY booking_date ASC;

-- Get patient's booking history
-- SELECT * FROM neurofeedback_bookings WHERE patient_email = 'patient@email.com' ORDER BY created_at DESC;

