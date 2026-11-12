const express = require('express');
const { findAuthUserByEmail } = require('../utils/findAuthUserByEmail');
const { createRoutedClient } = require('../dbRouter');

async function ensurePatientAuth(db, { email, password, token = null }) {
  const normalizedEmail = email.trim().toLowerCase();
  let nativeUser = null;
  if (token) {
    const { data, error } = await db.auth.getUser(token);
    if (error || !data?.user || data.user.email?.trim().toLowerCase() !== normalizedEmail) return { status: 401 };
    nativeUser = data.user;
  }
  const { data: patients, error: verifyError } = await db.rpc('verify_patient_login', { p_email: normalizedEmail, p_password: password });
  if (verifyError) throw verifyError;
  if (!Array.isArray(patients) || !patients.length) return { status: 401 };
  const { data: latest, error: latestError } = await db.from('patients').select('id').ilike('email', normalizedEmail.replace(/[\\%_]/g, '\\$&')).order('created_at', { ascending: false, nullsFirst: false }).order('id', { ascending: false }).limit(1).maybeSingle();
  if (latestError) throw latestError;
  const patient = patients.find(row => row.id === latest?.id);
  if (!patient?.id) return { status: 401 };

  let authUser = await findAuthUserByEmail(db, normalizedEmail);
  if (nativeUser && nativeUser.id !== authUser?.id) return { status: 401 };
  if (patient.auth_user_id && patient.auth_user_id !== authUser?.id) return { status: 401 };
  if (authUser) {
    const role = authUser.app_metadata?.role;
    if (role && role !== 'patient') return { status: 401 };
    const { data: profile, error: profileError } = await db.from('profiles').select('role').eq('id', authUser.id).maybeSingle();
    if (profileError) throw profileError;
    if (profile?.role && profile.role !== 'patient') return { status: 401 };
    if (!token) {
      const { error } = await db.auth.admin.updateUserById(authUser.id, { password });
      if (error) throw error;
    }
  } else {
    const { data: created, error } = await db.auth.admin.createUser({ email: normalizedEmail, password, email_confirm: true, app_metadata: { role: 'patient' }, user_metadata: { full_name: patient.full_name || '' } });
    if (error || !created?.user?.id) throw error || new Error('Identity creation failed');
    authUser = created.user;
  }
  if (!token) return { status: 200, success: true, bound: false, patient, authUser };
  if (patient.auth_user_id !== authUser.id) {
    const { error } = await db.auth.admin.signOut(token, 'others');
    if (error) throw error;
  }
  const { data: current, error: currentError } = await db.rpc('verify_patient_login', { p_email: normalizedEmail, p_password: password });
  if (currentError) throw currentError;
  const verified = current?.[0];
  if (verified?.id !== patient.id || (verified.credentials_updated_at || null) !== (patient.credentials_updated_at || null) || (verified.auth_user_id && verified.auth_user_id !== authUser.id)) return { status: 401 };
  let binding = db.from('patients').update({ auth_user_id: authUser.id }).eq('id', patient.id);
  binding = patient.credentials_updated_at ? binding.eq('credentials_updated_at', patient.credentials_updated_at) : binding.is('credentials_updated_at', null);
  binding = verified.auth_user_id ? binding.eq('auth_user_id', verified.auth_user_id) : binding.is('auth_user_id', null);
  const { data: bound, error: bindError } = await binding.select('id').maybeSingle();
  if (bindError) throw bindError;
  if (!bound) return { status: 401 };
  return { status: 200, success: true, bound: true, patient, authUser };
}

function createPatientAuthRouter(db = createRoutedClient()) {
  const router = express.Router();
  router.post('/', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' || !password.trim() || password.length > 1024) return res.status(400).json({ success: false, error: 'Invalid email or password' });
    const token = req.headers.authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (req.headers.authorization && !token) return res.status(401).json({ success: false, error: 'Invalid email or password' });
    try {
      const result = await ensurePatientAuth(db, { email, password, token });
      return res.status(result.status).json(result.status === 200 ? { success: true, bound: result.bound } : { success: false, error: 'Invalid email or password' });
    } catch {
      console.error('Patient Auth repair could not be completed');
      return res.status(503).json({ success: false, error: 'Could not establish a secure patient session. Please try again.' });
    }
  });
  return router;
}
module.exports = { createPatientAuthRouter, ensurePatientAuth };
