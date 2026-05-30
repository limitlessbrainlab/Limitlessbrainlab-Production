-- =====================================================
-- CREATE SUPER ADMIN USER
-- =====================================================
-- This creates a super admin with full access to the system
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: Enable Required Extensions
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 2: Create Super Admin Auth User
-- =====================================================
-- Change email and password as needed
DO $$
DECLARE
  admin_id UUID := uuid_generate_v4();
  admin_email TEXT := 'admin@neuro360.com';  -- CHANGE THIS
  admin_password TEXT := 'Admin@12345';      -- CHANGE THIS
  admin_name TEXT := 'Super Admin';
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
  )
  VALUES (
    admin_id,
    '00000000-0000-0000-0000-000000000000',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object(
      'provider', 'email',
      'providers', ARRAY['email'],
      'role', 'super_admin'
    ),
    jsonb_build_object(
      'full_name', admin_name,
      'role', 'super_admin'
    ),
    false,
    'authenticated',
    'authenticated'
  )
  ON CONFLICT (email) DO NOTHING;

  -- Insert into profiles
  INSERT INTO profiles (
    id,
    role,
    full_name,
    email,
    created_at,
    updated_at
  )
  VALUES (
    admin_id,
    'super_admin',
    admin_name,
    admin_email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    full_name = admin_name,
    email = admin_email,
    updated_at = NOW();

  RAISE NOTICE 'Super Admin Created Successfully!';
  RAISE NOTICE 'ID: %', admin_id;
  RAISE NOTICE 'Email: %', admin_email;
  RAISE NOTICE 'Password: %', admin_password;

END $$;

-- =====================================================
-- STEP 3: Verify Super Admin Creation
-- =====================================================
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.role = 'super_admin';
