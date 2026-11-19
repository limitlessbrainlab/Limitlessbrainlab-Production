import { createClient } from '@supabase/supabase-js';
import portalIdentity from '../server/utils/verifiedPortalUser.js';
import patientAccess from '../server/utils/patientAccess.js';

const { verifiedPortalUser } = portalIdentity;
const { requirePatientAccess } = patientAccess;

function serverClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server credentials are not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const jobId = String(req.query?.jobId || '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId)) {
    return res.status(400).json({ success: false, message: 'Invalid email job ID' });
  }
  try {
    const supabase = serverClient();
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const actor = token ? await verifiedPortalUser(supabase, token) : null;
    if (!actor) return res.status(401).json({ success: false, message: 'Authentication required' });
    const { data: job, error } = await supabase.from('report_email_jobs')
      .select('id,status,patient_id,completed_at,error_message').eq('id', jobId).maybeSingle();
    if (error) throw error;
    if (!job) return res.status(404).json({ success: false, message: 'Email job not found' });
    await requirePatientAccess(actor, job.patient_id, null, supabase);
    return res.status(200).json({ success: true, status: job.status, clinicCopyFailed: job.status === 'sent' && Boolean(job.error_message), completedAt: job.completed_at });
  } catch (error) {
    if (error.status === 403) return res.status(403).json({ success: false, message: 'Email job access denied' });
    console.error('Report email status lookup failed:', error.message);
    return res.status(503).json({ success: false, message: 'Unable to check email status' });
  }
}
