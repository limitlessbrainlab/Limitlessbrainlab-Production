/**
 * Create admin_notifications table in Supabase
 * Run: node create-admin-notifications-table.js
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  // Create the admin_notifications table via SQL
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        type VARCHAR(20) NOT NULL DEFAULT 'info',
        category VARCHAR(50) NOT NULL DEFAULT 'general',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
        clinic_name VARCHAR(255),
        patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
        patient_name VARCHAR(255),
        report_id UUID,
        action VARCHAR(50),
        action_data JSONB DEFAULT '{}',
        is_read BOOLEAN DEFAULT FALSE,
        created_by UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_category ON admin_notifications(category);

      ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

      CREATE POLICY IF NOT EXISTS "Super admins can manage notifications"
        ON admin_notifications FOR ALL
        USING (true)
        WITH CHECK (true);
    `
  });

  if (error) {
    // If rpc doesn't exist, try direct SQL via the REST API
    console.log('RPC not available, trying direct table creation...');

    // Try creating via direct insert to check if table exists
    const { error: checkError } = await supabase
      .from('admin_notifications')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('\nTable does not exist. Please run this SQL in the Supabase SQL Editor:\n');
      console.log(`
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'info',
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  clinic_name VARCHAR(255),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  patient_name VARCHAR(255),
  report_id UUID,
  action VARCHAR(50),
  action_data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_category ON admin_notifications(category);

-- Enable RLS but allow all (super admin only page)
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for admin_notifications" ON admin_notifications;
CREATE POLICY "Allow all for admin_notifications"
  ON admin_notifications FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
      `);
    } else if (!checkError) {
      console.log('Table admin_notifications already exists!');
    } else {
      console.error('Error:', checkError);
    }
  } else {
    console.log('Table created successfully!');
  }
}

createTable();
