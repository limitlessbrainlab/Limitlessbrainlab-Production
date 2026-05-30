/**
 * Run Patient UID Migration (Browser-compatible)
 * Paste this in browser console or run via npm script
 */

import { supabase } from '../lib/supabaseClient.js';

export async function runPatientUidMigration() {

  try {
    // Fetch all organizations
    const { data: organizations, error: fetchError } = await supabase
      .from('organizations')
      .select('id, name, clinic_code');

    if (fetchError) {
      console.error('❌ Error fetching organizations:', fetchError);
      throw fetchError;
    }


    // Generate and update clinic codes
    let updated = 0;
    const usedCodes = new Set();

    // First, collect existing codes
    organizations.forEach(org => {
      if (org.clinic_code) {
        usedCodes.add(org.clinic_code);
      }
    });

    // Process organizations without clinic codes
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

        // Update organization with clinic_code

        const { error: updateError } = await supabase
          .from('organizations')
          .update({ clinic_code: finalCode })
          .eq('id', org.id);

        if (updateError) {
          console.error(`❌ Error updating org "${org.name}":`, updateError);
        } else {
          updated++;
        }
      } else {
      }
    }



    return {
      success: true,
      total: organizations.length,
      updated: updated,
      existing: organizations.length - updated
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Auto-run if called directly
if (typeof window !== 'undefined') {
  window.runPatientUidMigration = runPatientUidMigration;
}
