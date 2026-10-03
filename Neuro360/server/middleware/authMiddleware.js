const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase admin client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LEGACY_PATIENT_ISSUER = 'limitlessbrainlab';
const LEGACY_PATIENT_AUDIENCE = 'legacy-patient-api';

function legacyPatientSecret() {
  // ponytail: reuse the server-only service key until LEGACY_AUTH_JWT_SECRET is configured; set the dedicated secret to decouple key rotation.
  return process.env.LEGACY_AUTH_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function createLegacyPatientToken(patient) {
  return jwt.sign({
    type: 'legacy_patient',
    email: patient.email,
    credentialsUpdatedAt: patient.credentials_updated_at || null,
  }, legacyPatientSecret(), {
    subject: patient.id,
    issuer: LEGACY_PATIENT_ISSUER,
    audience: LEGACY_PATIENT_AUDIENCE,
    expiresIn: '7d',
  });
}

function legacyPatientFromToken(token) {
  try {
    const payload = jwt.verify(token, legacyPatientSecret(), {
      issuer: LEGACY_PATIENT_ISSUER,
      audience: LEGACY_PATIENT_AUDIENCE,
    });
    if (payload.type !== 'legacy_patient' || !payload.sub || !payload.email) return null;
    return { id: payload.sub, email: payload.email, role: 'patient', credentialsUpdatedAt: payload.credentialsUpdatedAt || null };
  } catch {
    return null;
  }
}

async function verifiedLegacyPatient(token) {
  const tokenUser = legacyPatientFromToken(token);
  if (!tokenUser) return null;
  const { data: patient, error } = await supabase
    .from('patients')
    .select('id, email, credentials_updated_at')
    .eq('id', tokenUser.id)
    .eq('email', tokenUser.email)
    .maybeSingle();
  if (error || !patient || (patient.credentials_updated_at || null) !== tokenUser.credentialsUpdatedAt) return null;
  return { id: patient.id, email: patient.email, role: 'patient' };
}

/**
 * Middleware to verify JWT token and attach user to request
 * Checks Authorization header for Bearer token or Supabase session
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided',
        code: 'NO_TOKEN'
      });
    }

    const legacyPatient = await verifiedLegacyPatient(token);
    if (legacyPatient) {
      req.user = legacyPatient;
      return next();
    }

    // Verify Supabase token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('[AuthMiddleware] Supabase error:', JSON.stringify(error), '| SUPABASE_URL set:', !!process.env.SUPABASE_URL, '| KEY set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Attach user to request for downstream use
    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'patient'
    };

    next();
  } catch (error) {
    console.error('[AuthMiddleware Error]', error.message);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      const legacyPatient = await verifiedLegacyPatient(token);
      if (legacyPatient) {
        req.user = legacyPatient;
        return next();
      }
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'patient'
        };
      }
    }

    next();
  } catch (error) {
    console.error('[OptionalAuth Error]', error.message);
    next(); // Continue even if auth fails
  }
};

module.exports = {
  authMiddleware,
  optionalAuth,
  createLegacyPatientToken,
  legacyPatientFromToken,
};
