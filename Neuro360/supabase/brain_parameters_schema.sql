-- =====================================================
-- Brain Parameters Table Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create brain_parameters table for sidebar menu items
CREATE TABLE IF NOT EXISTS brain_parameters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    param_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'cognition', 'stress'
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(50), -- Lucide icon name e.g., 'Lightbulb', 'Zap'
    description TEXT,
    intro TEXT, -- Introduction text for the parameter page
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_brain_parameters_param_id ON brain_parameters(param_id);
CREATE INDEX IF NOT EXISTS idx_brain_parameters_active ON brain_parameters(is_active);
CREATE INDEX IF NOT EXISTS idx_brain_parameters_order ON brain_parameters(display_order);

-- Enable Row Level Security
ALTER TABLE brain_parameters ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to brain parameters" ON brain_parameters
    FOR SELECT USING (is_active = true);

-- =====================================================
-- INSERT BRAIN PARAMETERS DATA
-- =====================================================

INSERT INTO brain_parameters (param_id, label, icon, description, intro, display_order, is_active)
VALUES
(
    'cognition',
    'Cognition',
    'Lightbulb',
    'Cognition refers to mental processes like thinking, memory, and problem-solving. Good cognitive health supports daily functioning and quality of life.',
    'Cognition encompasses your brain''s ability to process information, think critically, and make decisions. It''s the foundation of your mental performance, affecting everything from problem-solving to memory recall. Understanding your cognitive patterns helps optimize your mental capabilities.',
    1,
    true
),
(
    'stress',
    'Stress',
    'Zap',
    'Stress is your body''s response to challenges. While some stress can be beneficial, chronic stress can impact brain health and overall wellbeing.',
    'Stress affects every aspect of your brain function. Your stress response is controlled by the autonomic nervous system, and understanding how to manage it is key to optimal brain performance. Learn to identify your stress triggers and develop effective coping strategies.',
    2,
    true
),
(
    'focus-attention',
    'Focus and Attention',
    'Target',
    'Focus and attention are critical cognitive skills that allow you to concentrate on tasks and filter out distractions.',
    'Your ability to focus and maintain attention is fundamental to productivity and learning. In our distraction-filled world, attention has become one of the most valuable cognitive resources. Understanding your attention patterns helps you work more effectively.',
    3,
    true
),
(
    'burnout-fatigue',
    'Burnout and Fatigue',
    'Battery',
    'Burnout is a state of chronic stress that leads to physical and emotional exhaustion, cynicism, and feelings of ineffectiveness.',
    'Burnout and fatigue are warning signs that your brain needs rest and recovery. Recognizing the early signs of burnout allows you to take proactive steps to restore your energy and prevent long-term damage to your cognitive function and overall health.',
    4,
    true
),
(
    'emotional-regulation',
    'Emotional Regulation',
    'Smile',
    'Emotional regulation is the ability to manage and respond to emotional experiences in healthy ways.',
    'Your ability to regulate emotions affects decision-making, relationships, and mental health. The brain''s emotional centers work in concert with cognitive areas to help you respond appropriately to life''s challenges. Developing emotional intelligence is key to overall wellbeing.',
    5,
    true
),
(
    'learning',
    'Learning',
    'GraduationCap',
    'Learning is the process of acquiring new knowledge and skills through experience, study, or teaching.',
    'Your brain is designed for lifelong learning. Neuroplasticity allows your brain to form new neural connections throughout life, enabling continuous growth and adaptation. Understanding how you learn best helps optimize your cognitive development.',
    6,
    true
),
(
    'creativity',
    'Creativity',
    'Star',
    'Creativity is the ability to generate novel ideas and solutions. It involves connecting disparate concepts in new ways.',
    'Creativity is not just for artists—it''s a fundamental cognitive skill that helps solve problems and innovate. Your brain''s default mode network plays a crucial role in creative thinking. Learn to nurture and enhance your creative capabilities.',
    7,
    true
);

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get all active brain parameters ordered by display_order
-- SELECT * FROM brain_parameters WHERE is_active = true ORDER BY display_order;

-- Get a specific parameter by ID
-- SELECT * FROM brain_parameters WHERE param_id = 'cognition' AND is_active = true;
