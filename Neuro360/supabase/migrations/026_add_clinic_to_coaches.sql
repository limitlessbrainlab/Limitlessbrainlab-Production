-- Migration: Add clinic_id to coaches table
-- Description: Each clinic has their own independent coaches

-- Add clinic_id column to coaches table
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);

-- Create index for faster clinic-based queries
CREATE INDEX IF NOT EXISTS idx_coaches_clinic ON coaches(clinic_id);

-- Comment on column
COMMENT ON COLUMN coaches.clinic_id IS 'Links coach to a specific clinic. Each clinic manages their own coaches independently.';
