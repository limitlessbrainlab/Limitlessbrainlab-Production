-- Add SMTP email configuration fields to clinics table
-- Allows each clinic to configure their own Gmail SMTP for sending patient emails
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS smtp_email VARCHAR(255);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS smtp_password VARCHAR(255);
