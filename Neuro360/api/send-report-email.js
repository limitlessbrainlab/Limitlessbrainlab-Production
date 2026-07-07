import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://limitlessbrainlab-eight.vercel.app';
const FROM_ADDRESS = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@limitlessbrainlab.com';
const EMAIL_FROM = `"Limitless Brain Lab" <${FROM_ADDRESS}>`;

const html = ({ isClinic, patientName, clinicName, reportUrl, loginUrl }) => `
  <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
    <h2 style="margin:0 0 12px;color:#111827">Your Neuro Performance Report is Ready</h2>
    <p>Hi ${isClinic ? (clinicName || 'Clinic') : (patientName || 'there')},</p>
    <p>${isClinic
      ? `The Neuro Performance Report for ${patientName || 'your patient'} is ready for review.`
      : 'Your Neuro Performance Report is ready.'}</p>
    <p><a href="${reportUrl}" style="color:#2563eb;font-weight:600">Download the report PDF</a></p>
    <p><a href="${loginUrl}" style="color:#2563eb">Open portal</a></p>
    <p style="margin-top:28px;color:#6b7280">The Limitless Brain Lab Team</p>
  </div>`;

function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

let supabase;

async function requireUser(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Auth service not configured');

  supabase ||= createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data?.user || null;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const user = await requireUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { patientName, patientEmail, clinicName, clinicEmail, reportUrl, generatedAt } = getBody(req);

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

    const patientLoginUrl = `${FRONTEND_URL}/patient/login`;
    const clinicLoginUrl = `${FRONTEND_URL}/clinic/login`;

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: patientEmail,
      replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER || FROM_ADDRESS,
      subject: 'Your Neuro Performance Report is Ready',
      text: `Hi ${patientName || 'there'},\n\nYour Neuro Performance Report is ready.\n\nDownload your report: ${reportUrl}\nLog in: ${patientLoginUrl}\n\nThe Limitless Brain Lab Team`,
      html: html({ isClinic: false, patientName, clinicName, reportUrl, loginUrl: patientLoginUrl, generatedAt }),
    });

    let clinicEmailSent = false;
    if (clinicEmail) {
      try {
        await transporter.sendMail({
          from: EMAIL_FROM,
          to: clinicEmail,
          replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER || FROM_ADDRESS,
          subject: `Neuro Performance Report - ${patientName || 'Patient'}`,
          text: `Hello ${clinicName || 'Clinic'},\n\nThe Neuro Performance Report for ${patientName || 'your patient'} is ready.\n\nDownload: ${reportUrl}\nLog in: ${clinicLoginUrl}\n\nThe Limitless Brain Lab Team`,
          html: html({ isClinic: true, patientName, clinicName, reportUrl, loginUrl: clinicLoginUrl, generatedAt }),
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
