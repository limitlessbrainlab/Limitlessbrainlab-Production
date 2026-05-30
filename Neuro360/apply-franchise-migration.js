/**
 * Apply Database Migration for Franchise Inquiries Table
 * Run this script to create the franchise_inquiries table in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🚀 Starting franchise_inquiries migration...');
    console.log(`📍 Supabase URL: ${supabaseUrl}`);

    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '024_create_franchise_inquiries_table.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');
    console.log(`📏 SQL size: ${migrationSQL.length} characters`);

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`\n📋 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments
      if (statement.startsWith('COMMENT')) {
        console.log(`⏭️  [${i + 1}/${statements.length}] Executing comment statement`);
      } else {
        console.log(`⚙️  [${i + 1}/${statements.length}] Executing statement...`);
      }

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          console.warn(`⚠️  Warning: ${error.message}`);
          console.log('    This statement may need manual execution via Supabase Dashboard');
        } else {
          console.log(`✅ [${i + 1}/${statements.length}] Statement executed successfully`);
        }

      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        console.log('Statement:', statement.substring(0, 100) + '...');
      }
    }

    console.log('\n✅ Migration application completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Verify the table in Supabase Dashboard → Database → Tables');
    console.log('2. Test the franchise inquiry form submission');
    console.log('3. Check that inquiries are being saved to the database');

    // Verify table was created
    console.log('\n🔍 Verifying table creation...');
    const { data: tableData, error: tableError } = await supabase
      .from('franchise_inquiries')
      .select('count', { count: 'exact', head: true });

    if (tableError) {
      console.log('⚠️  Could not verify table (may need to check manually)');
      console.log('   Error:', tableError.message);
    } else {
      console.log('✅ Table verified: franchise_inquiries exists and is accessible');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    outputManualInstructions();
    process.exit(1);
  }
}

// Alternative: Output SQL for manual execution
function outputManualInstructions() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 MANUAL MIGRATION INSTRUCTIONS');
  console.log('='.repeat(80));
  console.log('\nSince automated migration failed, please apply manually:\n');
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Copy the contents of: supabase/migrations/024_create_franchise_inquiries_table.sql');
  console.log('3. Paste into a new query');
  console.log('4. Click "Run" to execute');
  console.log('5. Verify no errors in the output\n');
  console.log('='.repeat(80) + '\n');
}

// Run migration
applyMigration().catch(error => {
  console.error('❌ Fatal error:', error);
  outputManualInstructions();
  process.exit(1);
});
