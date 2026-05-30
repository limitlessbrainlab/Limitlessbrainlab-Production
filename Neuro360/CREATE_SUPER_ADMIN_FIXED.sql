-- =====================================================
-- CREATE SUPER ADMIN - FIXED VERSION
-- =====================================================
-- This version handles the unique constraint issue
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- METHOD 1: Simple Direct Insert (No conflict handling)
-- =====================================================

DO $$
DECLARE
  admin_id UUID := uuid_generate_v4();
  admin_email TEXT := 'admin@neuro360.com';  -- CHANGE THIS
  admin_password TEXT := 'SuperAdmin@123';    -- CHANGE THIS
  admin_name TEXT := 'Super Admin';
  user_exists BOOLEAN;
BEGIN
  -- Check if user already exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = admin_email
  ) INTO user_exists;

  IF user_exists THEN
    RAISE NOTICE 'User with email % already exists!', admin_email;
    RAISE NOTICE 'Use METHOD 2 below to update existing user to super admin';
  ELSE
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
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
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
      'authenticated',
      '',
      '',
      '',
      ''
    );

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
    );

    RAISE NOTICE '✅ Super Admin Created Successfully!';
    RAISE NOTICE 'ID: %', admin_id;
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Password: %', admin_password;
    RAISE NOTICE 'Role: super_admin';
  END IF;
END $$;

-- Verify creation
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.full_name,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'admin@neuro360.com'
OR p.role = 'super_admin';
