import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import reportEmailTemplate from '../shared/reportEmailTemplate.cjs';
import portalIdentity from '../server/utils/verifiedPortalUser.js';
import patientAccess from '../server/utils/patientAccess.js';
const { verifiedPortalUser } = portalIdentity;
const { requirePatientAccess } = patientAccess;

// Hardcoded on purpose: login/dashboard CTAs in emails must always land on production,
// never a *.vercel.app deployment (FRONTEND_URL may point at a stale one).
const FRONTEND_URL = 'https://limitlessbrainlab.com';
const FROM_ADDRESS = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'info@limitlessbrainlab.com';
const EMAIL_FROM = `"Limitless Brain Lab" <${FROM_ADDRESS}>`;
// Load the logo from the brand production domain (aligned with the From domain), never a
// *.vercel.app host. A remote image from a domain other than the sender's is a spam smell;
// this serverless function can't reliably read /public for a cid: attachment, so serving it
// from the same brand domain as the sender is the robust equivalent.
const LOGO_URL = 'https://limitlessbrainlab.com/IBW%20Logo.png';
const { getReportEmailHtml, getNeuroSenseReportEmailHtml } = reportEmailTemplate;

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
    const patientEmail = patient.email;
    const { data: clinic, error: clinicError } = patient.clinic_id
      ? await supabase.from('clinics').select('email,name,clinic_name').eq('id', patient.clinic_id).maybeSingle()
      : { data: null, error: null };
    if (clinicError) throw clinicError;
    const clinicName = clinic?.clinic_name || clinic?.name || '';
    const clinicEmail = clinic?.email || '';

    // NeuroSense Report (QEEG) uses its own template/subject; anything else keeps the
    // existing Neuro Performance Report template unchanged.
    const isNeuroSense = reportType === 'neurosense';
    const reportLabel = isNeuroSense ? 'NeuroSense Report' : 'Neuro Performance Report';
    const buildReportHtml = isNeuroSense ? getNeuroSenseReportEmailHtml : getReportEmailHtml;

    if (!patientEmail || !reportUrl) {
      return res.status(400).json({ success: false, message: 'Patient email and report URL are required' });
    }
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ success: false, message: 'Email service not configured' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
    });
    const fromEmail = EMAIL_FROM;

    const patientLoginUrl = `${FRONTEND_URL}/patient/login`;
    const clinicLoginUrl = `${FRONTEND_URL}/clinic/login`;
    const replyTo = () => process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER || FROM_ADDRESS;

    await transporter.sendMail({
      from: fromEmail,
      to: patientEmail,
      replyTo: replyTo(),
      headers: {
        'List-Unsubscribe': `<mailto:${replyTo()}?subject=unsubscribe>`,
        'X-Mailer': 'Limitless Brain Lab Mailer'
      },
      subject: `Your ${reportLabel} is Ready`,
      text: `Hi ${patientName || 'there'},\n\nYour ${reportLabel} is ready.\n\nDownload your report: ${reportUrl}\nLog in: ${patientLoginUrl}\n\nThe Limitless Brain Lab Team`,
      html: buildReportHtml({ isClinic: false, patientName, clinicName, reportUrl, loginUrl: patientLoginUrl, generatedAt, logoSrc: LOGO_URL }),
    });

    let clinicEmailSent = false;
    if (clinicEmail) {
      try {
        await transporter.sendMail({
          from: fromEmail,
          to: clinicEmail,
          replyTo: replyTo(),
          headers: {
            'List-Unsubscribe': `<mailto:${replyTo()}?subject=unsubscribe>`,
            'X-Mailer': 'Limitless Brain Lab Mailer'
          },
          subject: `${reportLabel} - ${patientName || 'Patient'}`,
          text: `Hello ${clinicName || 'Clinic'},\n\nThe ${reportLabel} for ${patientName || 'your patient'} is ready.\n\nDownload: ${reportUrl}\nLog in: ${clinicLoginUrl}\n\nThe Limitless Brain Lab Team`,
          html: buildReportHtml({ isClinic: true, patientName, clinicName, reportUrl, loginUrl: clinicLoginUrl, generatedAt, logoSrc: LOGO_URL }),
        });
        clinicEmailSent = true;
      } catch (error) {
        console.error('Clinic report email failed:', error.message);
      }
    }

    return res.json({
      success: true,
      message: clinicEmail
        ? (clinicEmailSent ? 'Report emails sent to clinic and patient successfully' : 'Patient email sent; clinic email failed')
        : 'Report email sent to patient successfully',
    });
  } catch (error) {
    console.error('Report email failed:', error.message);
    return res.status(500).json({ success: false, message: `Email send failed: ${error.message || 'Unknown error'}` });
  }
}
