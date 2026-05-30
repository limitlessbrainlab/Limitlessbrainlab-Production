-- =====================================================
-- Photobiomodulation (PBM) Sessions Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create pbm_sessions table (for tracking PBM therapy sess     ions)
CREATE TABLE IF NOT EXISTS pbm_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) NOT NULL,
    target_area VARCHAR(100) NOT NULL, -- e.g., 'Full Head', 'Prefrontal Cortex', 'Temporal', etc.
    wavelength VARCHAR(100) NOT NULL, -- e.g., '810nm (Near-Infrared)', '660nm (Red)', etc.
    duration_minutes INTEGER DEFAULT 20,
    session_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    rating INTEGER DEFAULT 4 CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pbm_sessions_email ON pbm_sessions(patient_email);
CREATE INDEX IF NOT EXISTS idx_pbm_sessions_date ON pbm_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_pbm_sessions_target ON pbm_sessions(target_area);
CREATE INDEX IF NOT EXISTS idx_pbm_sessions_wavelength ON pbm_sessions(wavelength);

-- Enable Row Level Security
ALTER TABLE pbm_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert pbm_sessions" ON pbm_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view pbm_sessions" ON pbm_sessions
    FOR SELECT USING (true);

-- =====================================================
-- PBM Bookings Table (for booking consultations)
-- =====================================================

CREATE TABLE IF NOT EXISTS pbm_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_email VARCHAR(255) NOT NULL,
    patient_name VARCHAR(255),
    booking_date DATE NOT NULL,
    booking_time VARCHAR(20) NOT NULL, -- e.g., '10:00 AM'
    session_type VARCHAR(20) DEFAULT 'in-person', -- 'online', 'in-person'
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
    specialist_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pbm_bookings_email ON pbm_bookings(patient_email);
CREATE INDEX IF NOT EXISTS idx_pbm_bookings_date ON pbm_bookings(booking_date DESC);
CREATE INDEX IF NOT EXISTS idx_pbm_bookings_status ON pbm_bookings(status);

-- Enable Row Level Security
ALTER TABLE pbm_bookings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert pbm_bookings" ON pbm_bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view pbm_bookings" ON pbm_bookings
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update pbm_bookings" ON pbm_bookings
    FOR UPDATE USING (true);

-- =====================================================
-- Function to update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_pbm_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_pbm_bookings_updated_at ON pbm_bookings;
CREATE TRIGGER trigger_pbm_bookings_updated_at
    BEFORE UPDATE ON pbm_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_pbm_bookings_updated_at();

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get sessions for a patient
-- SELECT * FROM pbm_sessions WHERE patient_email = 'patient@email.com' ORDER BY session_date DESC;

-- Get session stats for a patient
-- SELECT
--   COUNT(*) as total_sessions,
--   SUM(duration_minutes) as total_minutes,
--   AVG(rating) as avg_rating
-- FROM pbm_sessions
-- WHERE patient_email = 'patient@email.com';

-- Get sessions by target area
-- SELECT target_area, COUNT(*) as count, SUM(duration_minutes) as total_minutes
-- FROM pbm_sessions
-- WHERE patient_email = 'patient@email.com'
-- GROUP BY target_area
-- ORDER BY count DESC;

-- Get sessions by wavelength
-- SELECT wavelength, COUNT(*) as count, AVG(rating) as avg_rating
-- FROM pbm_sessions
-- WHERE patient_email = 'patient@email.com'
-- GROUP BY wavelength
-- ORDER BY count DESC;

-- Get pending bookings
-- SELECT * FROM pbm_bookings WHERE status = 'pending' ORDER BY booking_date ASC;

-- Get patient's booking history
-- SELECT * FROM pbm_bookings WHERE patient_email = 'patient@email.com' ORDER BY created_at DESC;

-- Get monthly session summary
-- SELECT
--   DATE_TRUNC('month', session_date) as month,
--   COUNT(*) as sessions,
--   SUM(duration_minutes) as total_minutes
-- FROM pbm_sessions
-- WHERE patient_email = 'patient@email.com'
-- GROUP BY DATE_TRUNC('month', session_date)
-- ORDER BY month DESC;

