#!/usr/bin/env node
/**
 * Email delivery test harness.
 *
 * Triggers every DIRECTLY-CALLABLE email endpoint on the backend and records the
 * HTTP result, so you can confirm which mails actually send. All user-facing
 * recipients are routed to TEST_EMAIL; admin-facing mails go to the server's
 * EMAIL_TO/EMAIL_USER inbox (not overridable via request).
 *
 * IMPORTANT: HTTP success:true means the SMTP relay (Brevo) ACCEPTED the message
 * for delivery — it is NOT proof the email reached the inbox. Confirm real
 * delivery by checking the inbox(es).
 *
 * Safe to run: every endpoint here is unauthenticated and pure-email except three
 * benign log writes (admin_notifications / sent_notifications dedupe). No clinic,
 * patient, payment or auth data is mutated.
 *
 * Usage:
 *   TEST_EMAIL=you@gmail.com node server/scripts/test-emails.js
 *   TEST_EMAIL=you@gmail.com BASE_URL=http://localhost:3001 node server/scripts/test-emails.js
 *   (defaults: TEST_EMAIL=sahiljha746@gmail.com, BASE_URL=https://neuro360-backend.onrender.com)
 */

const TEST_EMAIL = process.env.TEST_EMAIL || 'sahiljha746@gmail.com';
const BASE_URL = (process.env.BASE_URL || 'https://neuro360-backend.onrender.com').replace(/\/$/, '');
const DELAY_MS = Number(process.env.DELAY_MS || 800);
const runId = Date.now();

// recipient = 'user'  -> mail goes to TEST_EMAIL (you can verify it)
// recipient = 'admin' -> mail goes to server EMAIL_TO inbox (verify in admin inbox)
const CASES = [
  // --- Public / website forms ---
  { name: 'Contact form (admin + user confirmation)', path: '/api/contact', recipient: 'admin+user',
    body: { firstName: 'EMAIL', lastName: 'TEST', email: TEST_EMAIL, phone: '0000000000', city: 'Test City', message: 'Harness test', formType: 'protect' } },
  { name: 'Partnership inquiry (admin + confirmation)', path: '/api/partnership-inquiry', recipient: 'admin+user',
    body: { name: 'EMAIL TEST', email: TEST_EMAIL, contact_number: '0000000000', organization: 'Test Org', message: 'Harness test' } },
  { name: 'Professional coach application (admin + confirmation)', path: '/api/professional-inquiry', recipient: 'admin+user',
    body: { fullName: 'EMAIL TEST', email: TEST_EMAIL, phone: '0000000000', cityCountry: 'Test City' } },
  { name: 'Program join application (admin + confirmation)', path: '/api/program-inquiry', recipient: 'admin+user',
    body: { name: 'EMAIL TEST', email: TEST_EMAIL, phone: '0000000000' } },
  { name: 'Demo report request (admin)', path: '/api/request-demo-report', recipient: 'admin',
    body: { email: TEST_EMAIL, phone: '0000000000', name: 'EMAIL TEST' } },

  // --- Auth / account ---
  { name: 'Registration confirmation (patient)', path: '/api/registration-confirmation', recipient: 'user',
    body: { name: 'EMAIL TEST', email: TEST_EMAIL, clinicName: null, type: 'patient' } },
  { name: 'Registration confirmation (clinic)', path: '/api/registration-confirmation', recipient: 'user',
    body: { name: 'EMAIL TEST', email: TEST_EMAIL, clinicName: 'Test Clinic', type: 'clinic' } },
  { name: 'Email verification OTP', path: '/api/send-otp', recipient: 'user',
    body: { email: TEST_EMAIL, name: 'EMAIL TEST' } },
  { name: 'Password changed confirmation', path: '/api/send-password-email', recipient: 'user',
    body: { email: TEST_EMAIL, password: 'TestPass@123', name: 'EMAIL TEST' } },
  { name: 'Password reset link', path: '/api/send-password-reset', recipient: 'user',
    body: { email: TEST_EMAIL, name: 'EMAIL TEST', resetLink: 'https://example.com/reset?token=test' } },
  { name: 'Email ID updated notification', path: '/api/send-email-update-notification', recipient: 'user',
    body: { patientName: 'EMAIL TEST', newEmail: TEST_EMAIL } },

  // --- Clinic / patient lifecycle ---
  { name: 'Clinic account created + credentials', path: '/api/clinic-credentials', recipient: 'user',
    body: { email: TEST_EMAIL, password: 'TestPass@123', clinicName: 'Test Clinic', contactPerson: 'EMAIL TEST', otp: '123456' } },
  { name: 'Clinic rejection', path: '/api/clinic-rejection', recipient: 'user',
    body: { email: TEST_EMAIL, clinicName: 'Test Clinic', remark: 'Harness test rejection' } },
  { name: 'Patient welcome + credentials', path: '/api/send-welcome-email', recipient: 'user',
    body: { patientName: 'EMAIL TEST', email: TEST_EMAIL, password: 'TestPass@123', clinicName: 'Test Clinic' } },
  { name: 'No report credits remaining', path: '/api/send-no-credit-email', recipient: 'user',
    body: { clinicEmail: TEST_EMAIL, clinicName: 'Test Clinic' } },

  // --- Reports ---
  { name: 'Report received (patient)', path: '/api/send-report-received', recipient: 'user',
    body: { patientEmail: TEST_EMAIL, patientName: 'EMAIL TEST' } },
  { name: 'EDF upload notification (admin)', path: '/api/edf-upload-notification', recipient: 'admin',
    body: { patientName: 'EMAIL TEST', patientId: 'test', clinicName: 'Test Clinic', overallScore: 80, pdfUrl: 'https://example.com/test.pdf', processedAt: new Date().toISOString() } },
  { name: 'Neuro report ready (patient + clinic)', path: '/api/send-report-email', recipient: 'user',
    body: { patientEmail: TEST_EMAIL, clinicEmail: TEST_EMAIL, patientName: 'EMAIL TEST', reportUrl: 'https://example.com/report.pdf' } },
  { name: 'Report ready / uploaded (patient + clinic)', path: '/api/notify-patient-report', recipient: 'user',
    body: { patientEmail: TEST_EMAIL, clinicEmail: TEST_EMAIL, patientName: 'EMAIL TEST', reportType: 'neurosense' } },

  // --- Coaching / feedback / misc ---
  { name: 'Coaching scheduling link (patient + coach)', path: '/api/send-coaching-link', recipient: 'user',
    body: { patientEmail: TEST_EMAIL, coachEmail: TEST_EMAIL, coachName: 'Test Coach', patientName: 'EMAIL TEST', calendlyLink: 'https://calendly.com/test', sessionId: `test-${runId}` } },
  { name: 'Patient feedback (admin)', path: '/api/feedback', recipient: 'admin',
    body: { message: 'Harness test feedback', category: 'general', rating: 5, name: 'EMAIL TEST', email: TEST_EMAIL } },
  { name: '24-hour coaching reminder', path: '/api/send-24hr-reminder', recipient: 'user',
    body: { email: TEST_EMAIL, name: 'EMAIL TEST', coachName: 'Test Coach', sessionTime: new Date().toISOString() } },
  { name: 'Assessment purchase confirmation', path: '/api/send-assessment-email', recipient: 'user',
    body: { customerEmail: TEST_EMAIL, customerName: 'EMAIL TEST', assessmentName: 'Brain Assessment', assessmentLink: 'https://example.com/assess' } },
  // NOTE: the "session follow-up" email is sent by PUT /api/bookings/:id when a
  // booking flips to status 'completed'. That route MUTATES a real booking row,
  // so it's intentionally NOT fired here — test it on a real completed booking.

  // --- Partner suite (no frontend caller — testing whether they at least send) ---
  { name: 'Partner welcome', path: '/api/send-partner-welcome-email', recipient: 'user',
    body: { partnerName: 'EMAIL TEST', email: TEST_EMAIL, password: 'TestPass@123' } },
  { name: 'Partner payment success', path: '/api/send-partner-payment-success', recipient: 'user',
    body: { partnerEmail: TEST_EMAIL, partnerName: 'EMAIL TEST', reports: 10 } },
  { name: 'Partner report ready', path: '/api/send-partner-report-notification', recipient: 'user',
    body: { partnerEmail: TEST_EMAIL, partnerName: 'EMAIL TEST', patientName: 'EMAIL TEST', reportUrl: 'https://example.com/report.pdf' } },
  { name: 'Partner no-credit alert', path: '/api/send-partner-no-credit-alert', recipient: 'user',
    body: { partnerEmail: TEST_EMAIL, partnerName: 'EMAIL TEST' } },
  { name: 'Partner patient welcome', path: '/api/send-partner-patient-welcome', recipient: 'user',
    body: { patientName: 'EMAIL TEST', email: TEST_EMAIL, password: 'TestPass@123' } },
  { name: 'Partner email update', path: '/api/send-partner-email-update', recipient: 'user',
    body: { partnerName: 'EMAIL TEST', newEmail: TEST_EMAIL } },
  { name: 'Partner rejection', path: '/api/send-partner-rejection', recipient: 'user',
    body: { email: TEST_EMAIL, partnerName: 'EMAIL TEST', remark: 'Harness test' } },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log(`\nEmail harness → ${BASE_URL}`);
  console.log(`User-facing mails → ${TEST_EMAIL} | Admin-facing mails → server EMAIL_TO inbox`);
  console.log(`Cases: ${CASES.length}\n`);

  // Optional: ONLY=substr runs just the cases whose path contains substr (comma-separated).
  const only = (process.env.ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);
  const cases = only.length ? CASES.filter((c) => only.some((o) => c.path.includes(o))) : CASES;

  const results = [];
  for (const c of cases) {
    const started = Date.now();
    let httpStatus = 0;
    let ok = false;
    let message = '';
    try {
      const res = await fetch(`${BASE_URL}${c.path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c.body),
      });
      httpStatus = res.status;
      const text = await res.text();
      let json = {};
      try { json = JSON.parse(text); } catch (_) { /* non-JSON */ }
      ok = res.ok && json.success !== false;
      message = json.message || (res.ok ? 'ok' : text.slice(0, 120));
    } catch (err) {
      message = `request failed: ${err.message}`;
    }
    const ms = Date.now() - started;
    results.push({ ...c, httpStatus, ok, message, ms });
    const mark = ok ? 'PASS' : 'FAIL';
    console.log(`[${mark}] ${String(httpStatus).padEnd(3)} ${c.path.padEnd(38)} (${c.recipient}) ${ms}ms — ${message}`);
    await sleep(DELAY_MS);
  }

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n──────── SUMMARY ────────`);
  console.log(`Accepted by Brevo (HTTP ok + success): ${passed}/${results.length}`);
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log(`\nFailed endpoints (concretely broken):`);
    for (const f of failed) console.log(`  - ${f.path} → HTTP ${f.httpStatus}: ${f.message}`);
  }
  console.log(`\nNOTE: PASS = Brevo accepted the message, NOT proof of inbox delivery.`);
  console.log(`Confirm delivery: check ${TEST_EMAIL} (+spam) for user mails, and the admin inbox for admin mails.`);
  console.log(`Not covered here (webhook-only): Stripe checkout/invoice + Calendly emails — need Stripe CLI replay.\n`);

  // Non-zero exit if anything failed, so CI/automation can catch regressions.
  process.exit(failed.length ? 1 : 0);
}

run();
