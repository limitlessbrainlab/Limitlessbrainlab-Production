/**
 * Apply Patient UID Migration
 * This script applies the clinic_code column migration to organizations table
 */

import { supabase } from '../lib/supabaseClient.js';
import fs from 'fs';
import path from 'path';

async function applyMigration() {

  try {
    // Step 1: Add clinic_code column to organizations

    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add clinic_code column to organizations table
        ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS clinic_code VARCHAR(50);
      `
    });

    if (alterError && !alterError.message.includes('already exists')) {
      console.error('❌ Error adding clinic_code column:', alterError);

      // Try alternative method using direct SQL
      const { error: directError } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);

      if (directError) {
        throw new Error('Cannot connect to database');
      }
    } else {
    }

    // Step 2: Fetch all organizations and generate clinic codes

    const { data: organizations, error: fetchError } = await supabase
      .from('organizations')
      .select('id, name, clinic_code');

    if (fetchError) {
      throw fetchError;
    }


    // Step 3: Update organizations without clinic codes
    let updated = 0;
    const usedCodes = new Set();

    for (const org of organizations) {
      if (!org.clinic_code) {
        // Generate clinic code from name
        let baseCode = org.name
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .substring(0, 8);

        if (!baseCode) {
          baseCode = 'CLINIC';
        }

        let finalCode = baseCode;
        let counter = 1;

        // Ensure uniqueness
        while (usedCodes.has(finalCode)) {
          finalCode = baseCode + String(counter).padStart(2, '0');
          counter++;
        }

        usedCodes.add(finalCode);

        // Update organization
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ clinic_code: finalCode })
          .eq('id', org.id);

        if (updateError) {
          console.error(`❌ Error updating org ${org.name}:`, updateError);
        } else {
          updated++;
        }
      } else {
        usedCodes.add(org.clinic_code);
      }
    }



  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
applyMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
