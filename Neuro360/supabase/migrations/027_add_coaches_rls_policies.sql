-- Migration: Add RLS policies for coaches table
-- Description: Allow clinic admins to manage their own coaches

-- Enable RLS on coaches table
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Super admins can manage all coaches" ON coaches;
DROP POLICY IF EXISTS "Clinic admins can view their coaches" ON coaches;
DROP POLICY IF EXISTS "Clinic admins can insert coaches" ON coaches;
DROP POLICY IF EXISTS "Clinic admins can update their coaches" ON coaches;
DROP POLICY IF EXISTS "Clinic admins can delete their coaches" ON coaches;
DROP POLICY IF EXISTS "Patients can view their clinic coaches" ON coaches;
DROP POLICY IF EXISTS "Authenticated users can view active coaches" ON coaches;

-- Drop old function if exists
DROP FUNCTION IF EXISTS get_user_clinic_id(TEXT);
DROP FUNCTION IF EXISTS is_clinic_admin_for(TEXT, UUID);

-- Helper function to get clinic_id from user email (clinics.email column)
CREATE OR REPLACE FUNCTION get_user_clinic_id(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  clinic_uuid UUID;
BEGIN
  SELECT id INTO clinic_uuid
  FROM clinics
  WHERE email = user_email
  LIMIT 1;
  RETURN clinic_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy 1: Clinic admins can view coaches from their clinic
CREATE POLICY "Clinic admins can view their coaches" ON coaches
  FOR SELECT USING (
    clinic_id = get_user_clinic_id(auth.jwt() ->> 'email')
  );

-- Policy 3: Clinic admins can insert coaches for their clinic
CREATE POLICY "Clinic admins can insert coaches" ON coaches
  FOR INSERT WITH CHECK (
    clinic_id = get_user_clinic_id(auth.jwt() ->> 'email')
  );

-- Policy 4: Clinic admins can update coaches from their clinic
CREATE POLICY "Clinic admins can update their coaches" ON coaches
  FOR UPDATE USING (
    clinic_id = get_user_clinic_id(auth.jwt() ->> 'email')
  );

-- Policy 5: Clinic admins can delete coaches from their clinic
CREATE POLICY "Clinic admins can delete their coaches" ON coaches
  FOR DELETE USING (
    clinic_id = get_user_clinic_id(auth.jwt() ->> 'email')
  );

-- Policy 6: Patients can view active coaches from their clinic
CREATE POLICY "Patients can view their clinic coaches" ON coaches
  FOR SELECT USING (
    is_active = true AND
    clinic_id IN (
      SELECT p.clinic_id FROM patients p
      WHERE p.email = auth.jwt() ->> 'email'
    )
  );

-- Policy 7: Anyone authenticated can view active coaches (fallback for general browsing)
CREATE POLICY "Authenticated users can view active coaches" ON coaches
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND is_active = true
  );
