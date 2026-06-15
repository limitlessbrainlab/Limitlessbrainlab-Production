const crypto = require('crypto');

// Static long-lived token gating the patient-document storage endpoints.
//
// Clinics/patients authenticate in the app with custom local passwords, so the
// browser never holds a Supabase JWT. These endpoints upload/read/delete files
// in the PRIVATE patients_documents bucket using the server-side service-role
// key. The frontend sends PATIENT_DOCS_TOKEN as a Bearer token; we compare it
// (timing-safe) against the same value in env. Kept separate from
// CLAUDE_REPORT_TOKEN so the two features can be rotated independently.
const EXPECTED = process.env.PATIENT_DOCS_TOKEN || '';

function timingSafeEqualStr(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

const appTokenAuth = (req, res, next) => {
  if (!EXPECTED || EXPECTED.length < 16) {
    return res.status(500).json({
      success: false,
      error: 'PATIENT_DOCS_TOKEN is not configured on the server (min 16 chars).',
      code: 'NO_SERVER_TOKEN',
    });
  }
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided', code: 'NO_TOKEN' });
  }
  if (!timingSafeEqualStr(token, EXPECTED)) {
    return res.status(401).json({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
  req.authVia = 'patient-docs-token';
  next();
};

module.exports = { appTokenAuth };
