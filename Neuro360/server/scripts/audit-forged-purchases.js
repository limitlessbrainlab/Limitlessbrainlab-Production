/**
 * Read-only audit: finds patient_payments / assessment_purchases /
 * meditation_purchases / frequency_purchases rows that look like they were
 * created by the insecure client-side insert bug (fixed in this same change)
 * rather than a real, Stripe-confirmed payment.
 *
 * Makes NO writes anywhere — Supabase or Stripe. Prints a report; the user
 * decides afterward whether to revoke access, refund, or leave rows as-is.
 *
 * Usage: node scripts/audit-forged-purchases.js
 * Requires the same env vars as server/index.js: SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in the environment.');
  process.exit(1);
}
if (!stripeSecretKey) {
  console.error('Missing STRIPE_SECRET_KEY in the environment — cannot verify sessions with Stripe.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const stripe = new Stripe(stripeSecretKey);

const TABLES = ['patient_payments', 'assessment_purchases', 'meditation_purchases', 'frequency_purchases'];

// Simple in-process cache so the same Stripe session isn't looked up twice
// across tables.
const sessionCache = new Map();

async function checkSession(sessionId) {
  if (sessionCache.has(sessionId)) return sessionCache.get(sessionId);
  let result;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    result = { found: true, paid: session.payment_status === 'paid', session };
  } catch (err) {
    result = { found: false, paid: false, error: err.message };
  }
  sessionCache.set(sessionId, result);
  return result;
}

async function auditTable(table) {
  const { data: rows, error } = await supabase.from(table).select('*');
  if (error) {
    console.error(`Failed to read ${table}: ${error.message}`);
    return [];
  }

  const flagged = [];
  for (const row of rows || []) {
    const sessionId = row.stripe_session_id;

    if (!sessionId) {
      flagged.push({
        table,
        row,
        reason: 'no stripe_session_id — the secure paths (webhook / verify-session) always set one'
      });
      continue;
    }

    // Bundle-item rows use `${sessionId}_${assessmentId}` as their own
    // stripe_session_id (by design, for dedup) — check the real Stripe
    // session by stripping the suffix instead of treating it as forged.
    const realSessionId = sessionId.includes('_') && table === 'assessment_purchases'
      ? sessionId.split('_')[0]
      : sessionId;

    const check = await checkSession(realSessionId);
    if (!check.found) {
      flagged.push({ table, row, reason: `stripe_session_id not found on Stripe (${check.error})` });
    } else if (!check.paid) {
      flagged.push({ table, row, reason: `Stripe session payment_status is "${check.session.payment_status}", not "paid"` });
    }
  }
  return flagged;
}

(async () => {
  console.log('Auditing patient purchase tables for rows with no verifiable Stripe payment...\n');
  const allFlagged = [];
  for (const table of TABLES) {
    const flagged = await auditTable(table);
    allFlagged.push(...flagged);
    console.log(`${table}: ${flagged.length} flagged row(s)`);
  }

  if (!allFlagged.length) {
    console.log('\nNo suspicious rows found.');
    return;
  }

  console.log('\n--- Flagged rows (grouped by patient email) ---\n');
  const byEmail = {};
  for (const f of allFlagged) {
    const email = f.row.patient_email || '(unknown)';
    byEmail[email] = byEmail[email] || [];
    byEmail[email].push(f);
  }

  for (const [email, items] of Object.entries(byEmail)) {
    console.log(`\n${email} (${items.length} row(s)):`);
    for (const item of items) {
      console.log(`  - [${item.table}] id=${item.row.id} amount=${item.row.amount ?? item.row.amount_paid ?? 'n/a'} ` +
        `status=${item.row.status ?? item.row.payment_status ?? 'n/a'} session=${item.row.stripe_session_id ?? 'null'}`);
      console.log(`    reason: ${item.reason}`);
    }
  }

  console.log(`\nTotal flagged: ${allFlagged.length}. No data was modified — review and decide next steps manually.`);
})();
