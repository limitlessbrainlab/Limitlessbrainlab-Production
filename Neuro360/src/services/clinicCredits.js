import { supabase } from '../lib/supabaseClient';

// Default clinic has unlimited report generation — never blocked.
export const DEFAULT_CLINIC_ID = 'e34abedf-9d27-4000-a9c1-b8bad8bc8c30';

/**
 * Read a clinic's report credits straight from the `clinics` table, resolved by
 * the logged-in user's email (clinics.email === login email). Single source of
 * truth for the report quota — no hardcoded limits.
 *
 * @param {string} email - the clinic user's login email (user.email)
 * @returns {Promise<{ id, allowed, used, remaining } | null>}
 */
export async function getClinicCredits(email) {
  if (!email) return null;
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase
    .from('clinics')
    .select('id, reports_allowed, reports_used')
    .eq('email', normalizedEmail)
    .single();

  if (error || !data) {
    console.error('getClinicCredits: failed to read clinic credits by email:', error);
    return null;
  }

  const allowed = data.reports_allowed || 0;
  const used = data.reports_used || 0;
  return {
    id: data.id,
    allowed,
    used,
    remaining: Math.max(0, allowed - used),
  };
}
