// One-time: backfill assessment_purchases.submission_data for purchases whose
// answers were never captured (JOTFORM_API_KEY was unset / links were JotForm
// aliases). Pulls each form's submissions from the JotForm API and matches
// them to purchases STRICTLY by the buyer's email — a backfill must never
// attach another person's answers.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... JOTFORM_API_KEY=... \
//     node scripts/backfill-assessment-answers.js [--dry-run]
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const DRY_RUN = process.argv.includes('--dry-run');
const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY || '';
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const formIdCache = new Map();
async function resolveFormId(link) {
  const url = String(link || '').split('?')[0].trim();
  if (!url) return '';
  const direct = url.match(/jotform\.com\/(?:form\/)?(\d{10,})/);
  if (direct) return direct[1];
  if (formIdCache.has(url)) return formIdCache.get(url);
  const resp = await fetch(url, { redirect: 'follow' });
  const html = await resp.text();
  const m = html.match(/"formID"\s*:\s*"?(\d{10,})/) || html.match(/\bform\/(\d{10,})/);
  const id = m ? m[1] : '';
  formIdCache.set(url, id);
  return id;
}

const submissionsCache = new Map();
async function formSubmissions(formId) {
  if (submissionsCache.has(formId)) return submissionsCache.get(formId);
  const url = `https://api.jotform.com/form/${formId}/submissions?apiKey=${encodeURIComponent(JOTFORM_API_KEY)}&limit=1000&orderby=created_at`;
  const resp = await fetch(url);
  const json = await resp.json();
  const subs = Array.isArray(json?.content) ? json.content : [];
  submissionsCache.set(formId, subs);
  return subs;
}

// Same shaping as fetchJotformSubmission in server/index.js.
function shapeSubmission(formId, sub) {
  const flat = (v) => (v && typeof v === 'object') ? Object.values(v).filter(Boolean).join(' ') : String(v);
  const entries = Object.values(sub.answers || {})
    .filter(a => a && a.text && a.answer != null && a.answer !== '')
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const answers = {};
  const prettyParts = [];
  for (const a of entries) {
    const q = String(a.text).trim();
    const val = flat(a.answer).trim();
    if (!val) continue;
    answers[q] = val;
    prettyParts.push(`${q}:${val}`);
  }
  if (!prettyParts.length) return null;
  const scoreEntry = Object.entries(answers).find(([k]) => /score|result|total|points/i.test(k));
  return {
    formID: String(formId),
    submissionID: String(sub.id || ''),
    pretty: prettyParts.join(', '),
    answers,
    ...(scoreEntry && String(scoreEntry[1]).trim() ? { score: String(scoreEntry[1]).trim() } : {}),
    source: 'backfill',
    submitted_at: sub.created_at || new Date().toISOString()
  };
}

async function main() {
  if (!JOTFORM_API_KEY) { console.error('JOTFORM_API_KEY not set — aborting.'); process.exit(1); }
  const { data: rows, error } = await supabase.from('assessment_purchases')
    .select('id, patient_email, assessment_name, assessment_link, link_opened_at, assessment_completed_at')
    .is('submission_data', null)
    .not('link_opened_at', 'is', null)
    .order('purchased_at', { ascending: true });
  if (error) { console.error('select failed:', error.message); process.exit(1); }
  console.log(`${rows.length} opened purchases without answers${DRY_RUN ? ' (dry run)' : ''}`);

  for (const row of rows) {
    const email = String(row.patient_email || '').toLowerCase();
    const links = String(row.assessment_link || '').split(',').map(s => s.trim()).filter(Boolean);
    const found = [];
    for (const link of links) {
      try {
        const formId = await resolveFormId(link);
        if (!formId) { console.warn(`  ${row.id}: unresolvable link ${link}`); continue; }
        const subs = await formSubmissions(formId);
        // strict email match, newest first
        const mine = subs
          .filter(s => email && JSON.stringify(s.answers || {}).toLowerCase().includes(email))
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        const shaped = mine.length ? shapeSubmission(formId, mine[0]) : null;
        if (shaped) found.push(shaped);
      } catch (e) {
        console.warn(`  ${row.id}: ${link} — ${e.message}`);
      }
    }
    if (!found.length) {
      console.log(`- ${row.id} ${row.assessment_name} (${email}): no matching JotForm submission`);
      continue;
    }
    const submission_data = links.length > 1 ? { submissions: found } : found[0];
    const patch = { submission_data };
    if (!row.assessment_completed_at && found.length === links.length) {
      patch.assessment_completed_at = found[0].submitted_at;
    }
    if (DRY_RUN) {
      console.log(`+ ${row.id} ${row.assessment_name} (${email}): WOULD store ${found.length} submission(s)${patch.assessment_completed_at ? ' + mark completed' : ''}`);
      continue;
    }
    const { error: upErr } = await supabase.from('assessment_purchases')
      .update(patch).eq('id', row.id).is('submission_data', null);
    if (upErr) console.error(`! ${row.id}: update failed — ${upErr.message}`);
    else console.log(`+ ${row.id} ${row.assessment_name} (${email}): stored ${found.length} submission(s)${patch.assessment_completed_at ? ' + marked completed' : ''}`);
  }
}

main();
