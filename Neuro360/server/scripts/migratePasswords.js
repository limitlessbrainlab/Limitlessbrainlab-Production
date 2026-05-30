/**
 * Migration Script: Encrypt all existing plain-text passwords
 * Run this ONCE to convert all plain-text passwords to bcrypt hashes
 *
 * Usage: node server/scripts/migratePasswords.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const SALT_ROUNDS = 10;

function isAlreadyHashed(password) {
  if (!password) return true; // skip null/empty
  return password.startsWith('$2a$') || password.startsWith('$2b$');
}

async function migrateTable(tableName) {
  console.log(`\n=== Migrating ${tableName} passwords ===`);

  const { data: rows, error } = await supabase
    .from(tableName)
    .select('id, email, password');

  if (error) {
    console.error(`Error fetching ${tableName}:`, error.message);
    return { total: 0, migrated: 0, skipped: 0 };
  }

  if (!rows || rows.length === 0) {
    console.log(`No records found in ${tableName}`);
    return { total: 0, migrated: 0, skipped: 0 };
  }

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.password || isAlreadyHashed(row.password)) {
      console.log(`  [SKIP] ${row.email || row.id} - already hashed or no password`);
      skipped++;
      continue;
    }

    try {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(row.password, salt);

      const { error: updateError } = await supabase
        .from(tableName)
        .update({ password: hashedPassword })
        .eq('id', row.id);

      if (updateError) {
        console.error(`  [ERROR] ${row.email || row.id}: ${updateError.message}`);
      } else {
        console.log(`  [OK] ${row.email || row.id} - password encrypted`);
        migrated++;
      }
    } catch (err) {
      console.error(`  [ERROR] ${row.email || row.id}: ${err.message}`);
    }
  }

  return { total: rows.length, migrated, skipped };
}

async function main() {
  console.log('========================================');
  console.log(' Password Encryption Migration');
  console.log('========================================');
  console.log('Supabase URL:', supabaseUrl);

  const results = {};

  // Migrate patients table
  results.patients = await migrateTable('patients');

  // Migrate clinics table
  results.clinics = await migrateTable('clinics');

  // Migrate profiles table (super admins)
  results.profiles = await migrateTable('profiles');

  // Summary
  console.log('\n========================================');
  console.log(' Migration Summary');
  console.log('========================================');
  for (const [table, stats] of Object.entries(results)) {
    console.log(`  ${table}: ${stats.migrated} migrated, ${stats.skipped} skipped (${stats.total} total)`);
  }
  console.log('========================================');
  console.log('Done!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
