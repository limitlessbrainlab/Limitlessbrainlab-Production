-- =====================================================
-- CREATE SUPER ADMIN: harithavr@outlook.com
-- =====================================================
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
  admin_id     UUID;
  admin_email  TEXT := 'harithavr@outlook.com';
  admin_pass   TEXT := 'harita@123';
  admin_name   TEXT := 'Haritha VR';
  user_exists  BOOLEAN;
BEGIN

  -- Check if user already exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = admin_email
  ) INTO user_exists;

  IF user_exists THEN
    -- ── User already exists: just get their ID and upgrade role ──
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;

    -- Update password in auth.users
    UPDATE auth.users
    SET
      encrypted_password  = crypt(admin_pass, gen_salt('bf')),
      raw_app_meta_data   = jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', 'super_admin'),
      raw_user_meta_data  = jsonb_build_object('full_name', admin_name, 'role', 'super_admin'),
      email_confirmed_at  = COALESCE(email_confirmed_at, NOW()),
      updated_at          = NOW()
    WHERE id = admin_id;

    -- Upsert profiles row
    INSERT INTO profiles (id, role, full_name, email, created_at, updated_at)
    VALUES (admin_id, 'super_admin', admin_name, admin_email, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE
      SET role       = 'super_admin',
          full_name  = admin_name,
          email      = admin_email,
          updated_at = NOW();

    RAISE NOTICE '✅ Existing user upgraded to super_admin';
    RAISE NOTICE '   ID    : %', admin_id;
    RAISE NOTICE '   Email : %', admin_email;

  ELSE
    -- ── User does not exist: create fresh ──
    admin_id := uuid_generate_v4();

    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token,
      email_change_token_new, email_change
    )
    VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      admin_email,
      crypt(admin_pass, gen_salt('bf')),
      NOW(), NOW(), NOW(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', 'super_admin'),
      jsonb_build_object('full_name', admin_name, 'role', 'super_admin'),
      false, 'authenticated', 'authenticated',
      '', '', '', ''
    );

    INSERT INTO profiles (id, role, full_name, email, created_at, updated_at)
    VALUES (admin_id, 'super_admin', admin_name, admin_email, NOW(), NOW());

    RAISE NOTICE '✅ New super_admin created';
    RAISE NOTICE '   ID    : %', admin_id;
    RAISE NOTICE '   Email : %', admin_email;
    RAISE NOTICE '   Pass  : %', admin_pass;
  END IF;

END $$;

-- =====================================================
-- Verify
-- =====================================================
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.full_name,
  u.updated_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'harithavr@outlook.com';
