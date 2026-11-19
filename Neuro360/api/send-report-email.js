import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import portalIdentity from '../server/utils/verifiedPortalUser.js';
import patientAccess from '../server/utils/patientAccess.js';
const { verifiedPortalUser } = portalIdentity;
const { requirePatientAccess } = patientAccess;

const FRONTEND_URL = 'https://limitlessbrainlab.com';

function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

function serverClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server credentials are not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function parseReportReference(reference, supabaseUrl) {
  if (typeof reference !== 'string' || !reference.trim()) throw new Error('Invalid report reference');
  const trustedLocalOrigins = new Set([
    new URL(FRONTEND_URL).origin,
    'https://www.limitlessbrainlab.com',
    'https://limitlessbrainlab-eight.vercel.app',
    'https://limitlessbrainlab-production.vercel.app',
    process.env.BACKEND_PUBLIC_URL && new URL(process.env.BACKEND_PUBLIC_URL).origin,
    process.env.RENDER_EXTERNAL_URL && new URL(process.env.RENDER_EXTERNAL_URL).origin,
  ].filter(Boolean));
  const localUrl = new URL(reference, FRONTEND_URL);
  if (localUrl.pathname.startsWith('/uploads/')) {
    if (!trustedLocalOrigins.has(localUrl.origin)) throw new Error('Report URL must belong to this service');
    const filename = decodeURIComponent(localUrl.pathname.slice('/uploads/'.length));
    if (!filename || filename.includes('/') || filename.includes('\\') || filename === '.' || filename === '..') throw new Error('Invalid local report reference');
    return { local: true, filename };
  }
  const url = new URL(reference);
  if (url.origin !== new URL(supabaseUrl).origin) throw new Error('Report URL must belong to this service');
  const match = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/);
  if (!match) throw new Error('Invalid report reference');
  const bucket = match[1]; const path = decodeURIComponent(match[2]);
  if (!['patients_documents','neurosense-reports','patient-reports','edf-files','qeeg-uploads'].includes(bucket) || !path || path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Invalid report reference');
  return { local: false, bucket, path };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const supabase = serverClient();
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const actor = token ? await verifiedPortalUser(supabase, token) : null;
    if (!actor) return res.status(401).json({ success: false, message: 'Authentication required' });

    const { patientId, reportUrl, generatedAt, reportType } = getBody(req);
    if (typeof patientId !== 'string' || !patientId) return res.status(400).json({ success: false, message: 'Patient ID is required' });
    const patient = await requirePatientAccess(actor, patientId, null, supabase);
    const { data: contact, error: contactError } = await supabase.from('patients').select('email').eq('id', patient.id).maybeSingle();
    if (contactError) throw contactError;
    const reference = parseReportReference(reportUrl, supabase.supabaseUrl);
    if (reference.local) {
      const { data: owner, error } = await supabase.rpc('resolve_local_report_owner', { p_filename: reference.filename });
      if (error) throw error;
      if (owner !== patient.id) return res.status(403).json({ success: false, message: 'Report access denied' });
    } else {
      const { data: owner, error } = await supabase.rpc('resolve_document_owner', { p_bucket: reference.bucket, p_path: reference.path });
      if (error) throw error;
      if (owner !== patient.id) return res.status(403).json({ success: false, message: 'Report access denied' });
    }
    const patientName = patient.full_name || patient.name || 'Patient';
    const patientEmail = contact?.email;
    const { data: clinic, error: clinicError } = patient.clinic_id
      ? await supabase.from('clinics').select('email,name,clinic_name').eq('id', patient.clinic_id).maybeSingle()
      : { data: null, error: null };
    if (clinicError) throw clinicError;
    const clinicName = clinic?.clinic_name || clinic?.name || '';
    const clinicEmail = clinic?.email || '';

    if (!patientEmail || !reportUrl) {
      return res.status(400).json({ success: false, message: 'Patient email and report URL are required' });
    }
    let attachmentBucket = reference.bucket;
    let attachmentPath = reference.path;
    const jobId = randomUUID();
    try {
      if (reference.local) {
        const localOrigin = (/^https?:\/\//i.test(reportUrl) && reportUrl) || process.env.BACKEND_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '';
        if (!localOrigin) throw new Error('Local report origin is not configured');
        const localUrl = /^https?:\/\//i.test(reportUrl)
          ? reportUrl
          : new URL(`/uploads/${encodeURIComponent(reference.filename)}`, localOrigin).toString();
        const localRes = await fetch(localUrl, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
        if (!localRes.ok) throw new Error(`HTTP ${localRes.status}`);
        const bytes = Buffer.from(await localRes.arrayBuffer());
        if (bytes.length > 15 * 1024 * 1024) return res.status(413).json({ success: false, message: 'Report PDF exceeds the 15 MB email attachment limit' });
        attachmentBucket = 'report-email-attachments';
        attachmentPath = `${jobId}/${reference.filename}`;
        const { error } = await supabase.storage.from(attachmentBucket).upload(attachmentPath, bytes, { contentType: 'application/pdf', upsert: false });
        if (error) throw error;
      }
    } catch (attachError) {
      console.error('Report attachment could not be queued:', attachError.message);
      return res.status(502).json({ success: false, message: 'Could not queue the report attachment' });
    }
    const { error: queueError } = await supabase.from('report_email_jobs').insert({
      id: jobId,
      requested_by: actor.id,
      patient_id: patient.id,
      clinic_id: patient.clinic_id || null,
      patient_email: patientEmail,
      clinic_email: clinicEmail || null,
      patient_name: patientName || 'Patient',
      clinic_name: clinicName || '',
      report_type: reportType === 'neurosense' ? 'neurosense' : 'performance',
      generated_at: generatedAt || null,
      report_bucket: attachmentBucket,
      report_path: attachmentPath
    });
    if (queueError) {
      if (reference.local) await supabase.storage.from(attachmentBucket).remove([attachmentPath]).catch(() => {});
      return res.status(502).json({ success: false, message: 'Could not queue report email' });
    }
    return res.status(202).json({ success: true, status: 'queued', jobId, message: 'Report email queued for background delivery' });
  } catch (error) {
    console.error('Report email queue failed:', error.message);
    return res.status(500).json({ success: false, message: `Could not queue report email: ${error.message || 'Unknown error'}` });
  }
}
