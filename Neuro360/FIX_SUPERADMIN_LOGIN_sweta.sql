-- Fix super_admin login loop for sweta.adatia@gmail.com
--
-- Actual DB state discovered:
--   * profiles has a super_admin row for sweta.adatia@gmail.com
--       (id a543f63a-6faf-4432-9454-5d3cb6bb6bff) with profiles.password set.
--   * auth.users has NO row for sweta.adatia@gmail.com at all.
--
-- So login had no real Supabase Auth credential to sign in against, while the
-- populated profiles.password diverted login onto a session-less local check
-- -> the /login refresh loop ("token not matching").
--
-- Fix: create the Supabase Auth user + identity using the SAME id as the
-- existing profiles row, then clear profiles.password so login establishes a
-- real Supabase session.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_id    UUID := 'a543f63a-6faf-4432-9454-5d3cb6bb6bff';  -- existing profiles.id
  admin_email TEXT := 'sweta.adatia@gmail.com';
  admin_pass  TEXT := 'Neuro@Staging2026';
  admin_name  TEXT := 'Sweta Adatia';
BEGIN
  -- 1) Supabase Auth user, keyed to the existing profiles.id
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
  )
  ON CONFLICT (id) DO UPDATE
    SET encrypted_password = EXCLUDED.encrypted_password,
        email              = EXCLUDED.email,
        email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW()),
        updated_at         = NOW();

  -- 2) Email identity (this GoTrue version requires an auth.identities row)
  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = admin_id AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at, email
    )
    VALUES (
      gen_random_uuid(),
      admin_id::text,
      admin_id,
      jsonb_build_object('sub', admin_id::text, 'email', admin_email,
                         'email_verified', true, 'phone_verified', false),
      'email',
      NOW(), NOW(), NOW(), admin_email
    );
  END IF;

  -- 3) Clear the diverting custom column so login uses Supabase Auth
  UPDATE profiles SET password = NULL, updated_at = NOW() WHERE id = admin_id;
END $$;

-- Verify: role=super_admin, profile_id == auth_id, profile password cleared, auth pw set
SELECT p.id AS profile_id, u.id AS auth_id, p.email, p.role,
       (p.password IS NOT NULL) AS profile_pw_set,
       (u.encrypted_password IS NOT NULL) AS auth_pw_set,
       u.email_confirmed_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.email = 'sweta.adatia@gmail.com';
