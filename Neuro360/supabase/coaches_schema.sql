-- =====================================================
-- Brain Coaches Table Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create coaches table
CREATE TABLE IF NOT EXISTS coaches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    photo TEXT,
    credentials TEXT,
    specialties TEXT[] DEFAULT '{}',
    modalities TEXT[] DEFAULT '{}',
    rating DECIMAL(2,1) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT false,
    is_in_person BOOLEAN DEFAULT false,
    price INTEGER, -- Price in rupees
    price_display VARCHAR(50), -- e.g., "₹2,500/session"
    bio TEXT,
    languages TEXT[] DEFAULT ARRAY['English'],
    experience VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    city VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    whatsapp VARCHAR(20),
    next_slots TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calendly_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add calendly_url column if table already exists
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS calendly_url TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_coaches_is_active ON coaches(is_active);
CREATE INDEX IF NOT EXISTS idx_coaches_rating ON coaches(rating DESC);
CREATE INDEX IF NOT EXISTS idx_coaches_specialties ON coaches USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_coaches_is_online ON coaches(is_online);
CREATE INDEX IF NOT EXISTS idx_coaches_is_in_person ON coaches(is_in_person);

-- Create coach_connection_requests table for tracking inquiries
CREATE TABLE IF NOT EXISTS coach_connection_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
    patient_id UUID,
    patient_name VARCHAR(255),
    patient_email VARCHAR(255),
    patient_phone VARCHAR(20),
    message TEXT,
    request_type VARCHAR(50), -- 'booking', 'message', 'callback'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'contacted', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for connection requests
CREATE INDEX IF NOT EXISTS idx_connection_requests_coach ON coach_connection_requests(coach_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON coach_connection_requests(status);

-- Enable Row Level Security
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_connection_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for coaches table (public read)
CREATE POLICY "Allow public read access to active coaches" ON coaches
    FOR SELECT
    USING (is_active = true);

-- Create policies for connection requests
CREATE POLICY "Allow authenticated users to create connection requests" ON coach_connection_requests
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow users to view their own connection requests" ON coach_connection_requests
    FOR SELECT
    USING (true);

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

INSERT INTO coaches (name, photo, credentials, specialties, modalities, rating, reviews_count, is_online, is_in_person, price, price_display, bio, languages, experience, latitude, longitude, city, phone, email, whatsapp, next_slots, is_active)
VALUES
(
    'Dr. Priya Sharma',
    NULL,
    'PhD Neuroscience, Certified Brain Health Coach',
    ARRAY['Cognitive Enhancement', 'Stress Management', 'Focus Training'],
    ARRAY['Neurofeedback', 'Mindfulness', 'Cognitive Behavioral Coaching'],
    4.9,
    127,
    true,
    true,
    2500,
    '₹2,500/session',
    'Specialized in helping professionals optimize cognitive performance and manage work-related stress through evidence-based techniques.',
    ARRAY['English', 'Hindi'],
    '12 years',
    19.0760,
    72.8777,
    'Mumbai',
    '+91 98765 43210',
    'priya.sharma@example.com',
    '+91 98765 43210',
    ARRAY['Today 4:00 PM', 'Tomorrow 10:00 AM', 'Tomorrow 2:00 PM'],
    true
),
(
    'Rajesh Kumar',
    NULL,
    'MSc Psychology, ICF Certified Coach',
    ARRAY['Memory Improvement', 'Learning Optimization', 'ADHD Support'],
    ARRAY['Brain Training Games', 'Study Techniques', 'Habit Formation'],
    4.7,
    89,
    true,
    true,
    1800,
    '₹1,800/session',
    'Helping students and professionals enhance memory and learning capabilities through scientifically-backed methods.',
    ARRAY['English', 'Hindi', 'Tamil'],
    '8 years',
    13.0827,
    80.2707,
    'Chennai',
    '+91 87654 32109',
    'rajesh.kumar@example.com',
    '+91 87654 32109',
    ARRAY['Today 6:00 PM', 'Wed 11:00 AM', 'Thu 3:00 PM'],
    true
),
(
    'Dr. Ananya Patel',
    NULL,
    'MD Psychiatry, Brain Health Specialist',
    ARRAY['Anxiety Management', 'Sleep Optimization', 'Emotional Regulation'],
    ARRAY['Biofeedback', 'Breathwork', 'Sleep Coaching'],
    4.8,
    203,
    true,
    false,
    3000,
    '₹3,000/session',
    'Online-only practice focused on helping clients manage anxiety and optimize sleep through holistic brain health approaches.',
    ARRAY['English', 'Gujarati'],
    '15 years',
    NULL,
    NULL,
    NULL,
    '+91 76543 21098',
    'ananya.patel@example.com',
    '+91 76543 21098',
    ARRAY['Tomorrow 9:00 AM', 'Wed 4:00 PM', 'Fri 10:00 AM'],
    true
),
(
    'Meera Krishnan',
    NULL,
    'BSc Neuroscience, Certified Wellness Coach',
    ARRAY['Burnout Recovery', 'Work-Life Balance', 'Mental Clarity'],
    ARRAY['Lifestyle Coaching', 'Nutrition for Brain', 'Exercise Planning'],
    4.6,
    56,
    true,
    true,
    1500,
    '₹1,500/session',
    'Specializing in helping burnt-out professionals rebuild their energy and mental clarity through lifestyle optimization.',
    ARRAY['English', 'Malayalam', 'Hindi'],
    '5 years',
    12.9716,
    77.5946,
    'Bangalore',
    '+91 65432 10987',
    'meera.krishnan@example.com',
    '+91 65432 10987',
    ARRAY['Thu 11:00 AM', 'Fri 2:00 PM', 'Sat 10:00 AM'],
    true
),
(
    'Dr. Vikram Singh',
    NULL,
    'PhD Cognitive Science, Executive Coach',
    ARRAY['Executive Function', 'Decision Making', 'Leadership Brain'],
    ARRAY['Executive Coaching', 'Strategic Thinking', 'Performance Optimization'],
    4.9,
    167,
    true,
    true,
    5000,
    '₹5,000/session',
    'Working with C-suite executives and entrepreneurs to enhance cognitive performance and decision-making capabilities.',
    ARRAY['English', 'Hindi', 'Punjabi'],
    '18 years',
    28.6139,
    77.2090,
    'Delhi',
    '+91 54321 09876',
    'vikram.singh@example.com',
    '+91 54321 09876',
    ARRAY['Mon 9:00 AM', 'Tue 3:00 PM', 'Wed 11:00 AM'],
    true
),
(
    'Dr. Sneha Reddy',
    NULL,
    'PhD Clinical Psychology, Mindfulness Expert',
    ARRAY['Mindfulness', 'Meditation', 'Stress Management'],
    ARRAY['MBSR', 'Guided Meditation', 'Breathwork'],
    4.8,
    145,
    true,
    true,
    2200,
    '₹2,200/session',
    'Helping individuals find inner peace and clarity through mindfulness-based interventions and meditation practices.',
    ARRAY['English', 'Telugu', 'Hindi'],
    '10 years',
    17.3850,
    78.4867,
    'Hyderabad',
    '+91 43210 98765',
    'sneha.reddy@example.com',
    '+91 43210 98765',
    ARRAY['Today 5:00 PM', 'Tomorrow 11:00 AM', 'Fri 3:00 PM'],
    true
),
(
    'Amit Joshi',
    NULL,
    'MSc Neuroscience, Performance Coach',
    ARRAY['Peak Performance', 'Focus Training', 'Cognitive Enhancement'],
    ARRAY['Flow State Training', 'Peak Performance Coaching', 'Mental Conditioning'],
    4.7,
    98,
    true,
    true,
    2800,
    '₹2,800/session',
    'Specialized in helping athletes and high performers achieve peak mental performance and flow states.',
    ARRAY['English', 'Marathi', 'Hindi'],
    '7 years',
    18.5204,
    73.8567,
    'Pune',
    '+91 32109 87654',
    'amit.joshi@example.com',
    '+91 32109 87654',
    ARRAY['Wed 10:00 AM', 'Thu 4:00 PM', 'Sat 11:00 AM'],
    true
);

-- =====================================================
-- Coach Reviews Table
-- =====================================================

CREATE TABLE IF NOT EXISTS coach_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
    patient_email VARCHAR(255) NOT NULL,
    patient_name VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for reviews
CREATE INDEX IF NOT EXISTS idx_coach_reviews_coach ON coach_reviews(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_reviews_rating ON coach_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_coach_reviews_visible ON coach_reviews(is_visible);

-- Enable Row Level Security
ALTER TABLE coach_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for reviews
CREATE POLICY "Anyone can view visible reviews" ON coach_reviews
    FOR SELECT USING (is_visible = true);

CREATE POLICY "Patients can create reviews" ON coach_reviews
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- Function to auto-update coach rating
-- =====================================================

CREATE OR REPLACE FUNCTION update_coach_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE coaches
    SET
        rating = (
            SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
            FROM coach_reviews
            WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id) AND is_visible = true
        ),
        reviews_count = (
            SELECT COUNT(*)
            FROM coach_reviews
            WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id) AND is_visible = true
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.coach_id, OLD.coach_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating rating
DROP TRIGGER IF EXISTS trigger_update_coach_rating ON coach_reviews;
CREATE TRIGGER trigger_update_coach_rating
    AFTER INSERT OR UPDATE OR DELETE ON coach_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_coach_rating();

-- =====================================================
-- Function to update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_coaches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_coaches_updated_at ON coaches;
CREATE TRIGGER trigger_coaches_updated_at
    BEFORE UPDATE ON coaches
    FOR EACH ROW
    EXECUTE FUNCTION update_coaches_updated_at();

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get all active coaches
-- SELECT * FROM coaches WHERE is_active = true ORDER BY rating DESC;

-- Get coaches with specific specialty
-- SELECT * FROM coaches WHERE is_active = true AND 'Stress Management' = ANY(specialties);

-- Get online-only coaches
-- SELECT * FROM coaches WHERE is_active = true AND is_online = true AND is_in_person = false;

-- Get coaches in a specific city
-- SELECT * FROM coaches WHERE is_active = true AND city = 'Mumbai';

-- Get connection requests for a coach
-- SELECT * FROM coach_connection_requests WHERE coach_id = 'coach-uuid' ORDER BY created_at DESC;

-- Get reviews for a coach
-- SELECT * FROM coach_reviews WHERE coach_id = 'coach-uuid' AND is_visible = true ORDER BY created_at DESC;
