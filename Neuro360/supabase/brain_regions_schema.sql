-- =====================================================
-- Brain Regions Table Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create brain_regions table
CREATE TABLE IF NOT EXISTS brain_regions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'frontal', 'parietal'
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20), -- Hex color e.g., '#FF6B6B'
    position JSONB, -- { top, left, width, height }
    responsibilities TEXT[] DEFAULT '{}',
    strengthen TEXT[] DEFAULT '{}',
    description TEXT,
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create brain_quotes table
CREATE TABLE IF NOT EXISTS brain_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote TEXT NOT NULL,
    author VARCHAR(255),
    category VARCHAR(50), -- 'philosophy', 'science', 'motivation'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create brain_tips table
CREATE TABLE IF NOT EXISTS brain_tips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'exercise', 'nutrition', 'sleep', 'mental'
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_brain_regions_region_id ON brain_regions(region_id);
CREATE INDEX IF NOT EXISTS idx_brain_regions_active ON brain_regions(is_active);
CREATE INDEX IF NOT EXISTS idx_brain_quotes_active ON brain_quotes(is_active);
CREATE INDEX IF NOT EXISTS idx_brain_tips_category ON brain_tips(category);

-- Enable Row Level Security
ALTER TABLE brain_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_tips ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to brain regions" ON brain_regions
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access to brain quotes" ON brain_quotes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access to brain tips" ON brain_tips
    FOR SELECT USING (is_active = true);

-- =====================================================
-- INSERT BRAIN REGIONS DATA
-- =====================================================

INSERT INTO brain_regions (region_id, name, color, position, responsibilities, strengthen, description, display_order, is_active)
VALUES
(
    'frontal',
    'Frontal Lobe',
    '#FF6B6B',
    '{"top": "15%", "left": "35%", "width": "30%", "height": "25%"}',
    ARRAY[
        'Executive functions and decision making',
        'Problem solving and planning',
        'Emotional regulation',
        'Personality and behavior',
        'Speech production (Broca''s area)',
        'Motor control and movement'
    ],
    ARRAY[
        'Practice mindfulness meditation',
        'Learn a new skill or language',
        'Play strategy games like chess',
        'Set and work towards goals',
        'Practice impulse control exercises',
        'Engage in physical exercise'
    ],
    'The frontal lobe is the largest lobe of the brain and is responsible for higher cognitive functions.',
    1,
    true
),
(
    'parietal',
    'Parietal Lobe',
    '#4ECDC4',
    '{"top": "10%", "left": "55%", "width": "25%", "height": "25%"}',
    ARRAY[
        'Sensory processing (touch, temperature, pain)',
        'Spatial awareness and navigation',
        'Hand-eye coordination',
        'Mathematical processing',
        'Reading and writing',
        'Body awareness'
    ],
    ARRAY[
        'Practice yoga or tai chi',
        'Do puzzles and spatial games',
        'Learn to play a musical instrument',
        'Practice math problems',
        'Engage in arts and crafts',
        'Try activities requiring coordination'
    ],
    'The parietal lobe integrates sensory information and is crucial for spatial awareness.',
    2,
    true
),
(
    'temporal',
    'Temporal Lobe',
    '#45B7D1',
    '{"top": "40%", "left": "15%", "width": "20%", "height": "25%"}',
    ARRAY[
        'Hearing and auditory processing',
        'Memory formation and storage',
        'Language comprehension (Wernicke''s area)',
        'Facial recognition',
        'Emotional responses',
        'Learning new information'
    ],
    ARRAY[
        'Listen to music and learn songs',
        'Practice memory exercises',
        'Learn a new language',
        'Read books regularly',
        'Engage in conversations',
        'Use mnemonic devices'
    ],
    'The temporal lobe is essential for processing auditory information and memory.',
    3,
    true
),
(
    'occipital',
    'Occipital Lobe',
    '#96CEB4',
    '{"top": "30%", "left": "70%", "width": "20%", "height": "25%"}',
    ARRAY[
        'Visual processing',
        'Color recognition',
        'Shape and pattern recognition',
        'Spatial processing',
        'Visual memory',
        'Reading comprehension'
    ],
    ARRAY[
        'Do visual puzzles and spot-the-difference',
        'Practice drawing or painting',
        'Play video games (in moderation)',
        'Bird watching or nature observation',
        'Photography as a hobby',
        'Memory games with visual cues'
    ],
    'The occipital lobe is the visual processing center of the brain.',
    4,
    true
),
(
    'cerebellum',
    'Cerebellum',
    '#DDA0DD',
    '{"top": "60%", "left": "55%", "width": "25%", "height": "20%"}',
    ARRAY[
        'Balance and coordination',
        'Fine motor control',
        'Motor learning',
        'Posture regulation',
        'Timing and rhythm',
        'Cognitive functions support'
    ],
    ARRAY[
        'Practice balance exercises',
        'Dance or rhythmic activities',
        'Play sports requiring coordination',
        'Learn juggling',
        'Practice handwriting',
        'Martial arts training'
    ],
    'The cerebellum coordinates voluntary movements and maintains balance.',
    5,
    true
),
(
    'brainstem',
    'Brain Stem',
    '#F4A460',
    '{"top": "65%", "left": "40%", "width": "15%", "height": "20%"}',
    ARRAY[
        'Breathing regulation',
        'Heart rate control',
        'Sleep-wake cycles',
        'Swallowing and digestion',
        'Alertness and consciousness',
        'Relay of sensory information'
    ],
    ARRAY[
        'Practice deep breathing exercises',
        'Maintain regular sleep schedule',
        'Reduce stress through relaxation',
        'Stay hydrated',
        'Avoid toxins and excessive alcohol',
        'Regular cardiovascular exercise'
    ],
    'The brain stem controls vital life functions and connects the brain to the spinal cord.',
    6,
    true
);

-- =====================================================
-- INSERT BRAIN QUOTES
-- =====================================================

INSERT INTO brain_quotes (quote, author, category, is_active)
VALUES
(
    'NeuroSense translates your signals into clear, actionable insights. Brain Age is your compass—track it, nudge it, and watch it improve.',
    'NeuroSense Philosophy',
    'philosophy',
    true
),
(
    'The brain is wider than the sky, for, put them side by side, the one the other will include, with ease, and you beside.',
    'Emily Dickinson',
    'philosophy',
    true
),
(
    'Your brain is the most powerful organ in your body. Take care of it.',
    'Dr. Shweta',
    'motivation',
    true
),
(
    'Neuroplasticity means your brain can change at any age. It''s never too late to improve.',
    'Neuroscience Research',
    'science',
    true
),
(
    'Every thought you have changes your brain chemistry. Choose your thoughts wisely.',
    'Brain Health Expert',
    'motivation',
    true
),
(
    'Sleep is when your brain consolidates memories and clears toxins. Prioritize it.',
    'Sleep Science',
    'science',
    true
),
(
    'Physical exercise is the single best thing you can do for your brain.',
    'Harvard Medical School',
    'science',
    true
),
(
    'Your brain creates 70,000 thoughts per day. Make them count.',
    'Cognitive Science',
    'motivation',
    true
);

-- =====================================================
-- INSERT BRAIN TIPS
-- =====================================================

INSERT INTO brain_tips (title, description, category, icon, display_order, is_active)
VALUES
(
    'Exercise Regularly',
    'Physical activity increases blood flow to the brain and promotes neurogenesis.',
    'exercise',
    'Activity',
    1,
    true
),
(
    'Eat Brain-Healthy Foods',
    'Include omega-3 fatty acids, antioxidants, and leafy greens in your diet.',
    'nutrition',
    'Apple',
    2,
    true
),
(
    'Get Quality Sleep',
    'Aim for 7-9 hours of sleep to allow your brain to consolidate memories and repair.',
    'sleep',
    'Moon',
    3,
    true
),
(
    'Practice Mindfulness',
    'Meditation reduces stress and improves focus, memory, and emotional regulation.',
    'mental',
    'Brain',
    4,
    true
),
(
    'Stay Socially Connected',
    'Social interaction stimulates the brain and reduces risk of cognitive decline.',
    'mental',
    'Users',
    5,
    true
),
(
    'Challenge Your Brain',
    'Learn new skills, do puzzles, and engage in mentally stimulating activities.',
    'mental',
    'Puzzle',
    6,
    true
),
(
    'Stay Hydrated',
    'Dehydration can impair cognitive function. Drink plenty of water throughout the day.',
    'nutrition',
    'Droplet',
    7,
    true
),
(
    'Manage Stress',
    'Chronic stress damages the brain. Practice relaxation techniques regularly.',
    'mental',
    'Heart',
    8,
    true
);

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get all brain regions
-- SELECT * FROM brain_regions WHERE is_active = true ORDER BY display_order;

-- Get all quotes
-- SELECT * FROM brain_quotes WHERE is_active = true;

-- Get tips by category
-- SELECT * FROM brain_tips WHERE is_active = true AND category = 'mental';
