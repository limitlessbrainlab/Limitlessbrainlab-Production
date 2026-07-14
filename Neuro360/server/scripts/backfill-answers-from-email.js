// One-time: backfill assessment_purchases.submission_data from JotForm
// notification EMAILS (no JotForm API key needed) — reads the
// info@limitlessbrainlab.com mailbox over IMAP and records every JotForm
// submission notification found, matching STRICTLY by the buyer's email
// (assessmentRecorder). Complements scripts/backfill-assessment-answers.js
// (which needs JOTFORM_API_KEY).
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... EMAIL_USER=... EMAIL_PASS=... \
//     node scripts/backfill-answers-from-email.js [--dry-run] [--mailbox="[Gmail]/All Mail"]
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DRY_RUN = process.argv.includes('--dry-run');
const mbArg = process.argv.find(a => a.startsWith('--mailbox='));
const MAILBOXES = mbArg ? [mbArg.slice('--mailbox='.length)] : ['INBOX', '[Gmail]/All Mail'];

(async () => {
  const { processMailboxOnce } = require('../services/jotformEmailIngest');
  let total = 0, recorded = 0;
  const seen = new Set();
  for (const mailbox of MAILBOXES) {
    console.log(`\n=== ${mailbox} ${DRY_RUN ? '(dry-run)' : ''} ===`);
    let results;
    try {
      results = await processMailboxOnce({ mailbox, all: true, dryRun: DRY_RUN, markSeen: false });
    } catch (e) {
      console.error(`${mailbox}: failed —`, e.message);
      continue;
    }
    for (const r of results) {
      const key = r.parsed?.submissionID || `uid:${r.uid}`;
      if (seen.has(key)) continue; // All Mail duplicates INBOX messages
      seen.add(key);
      total++;
      if (r.status === 'recorded') recorded++;
      console.log(`  [${r.status}] uid=${r.uid} ${r.email || 'no-email'} "${(r.subject || '').slice(0, 60)}"`);
      if (DRY_RUN && r.parsed) {
        console.log(`    pretty: ${r.parsed.pretty.slice(0, 300)}`);
      }
    }
  }
  console.log(`\nDone: ${total} notification(s), ${recorded} ${DRY_RUN ? 'would be ' : ''}recorded.`);
  process.exit(0);
})().catch(e => { console.error('backfill failed:', e); process.exit(1); });
