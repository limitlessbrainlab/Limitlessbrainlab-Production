import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://limitlessbrainlab-eight.vercel.app';
const FROM_ADDRESS = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@limitlessbrainlab.com';
const EMAIL_FROM = `"Limitless Brain Lab" <${FROM_ADDRESS}>`;
const LOGO_URL = `${FRONTEND_URL}/IBW%20Logo.png`;

const fmtDateTime = (d = new Date()) => {
  const dt = d ? new Date(d) : new Date();
  const safe = Number.isNaN(dt.getTime()) ? new Date() : dt;
  return safe.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const reportHtml = ({ isClinic, patientName, clinicName, reportUrl, loginUrl, generatedAt }) => {
  const rows = [
    { label: 'Patient Name', value: patientName || 'Not provided' },
    ...(isClinic ? [{ label: 'Clinic', value: clinicName || 'Not provided' }] : []),
    { label: 'Report Type', value: 'Neuro Performance Report' },
    { label: 'Report PDF', value: `<a href="${reportUrl}" style="color:#1e63b4;font-weight:600;text-decoration:none;">Download Report</a>` },
    { label: 'Generated', value: fmtDateTime(generatedAt) },
  ];

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#0f2a5e 0%,#1e63b4 100%);padding:30px 32px;text-align:center;">
              <img src="${LOGO_URL}" alt="Limitless Brain Lab" style="width:84px;height:84px;border-radius:50%;object-fit:cover;" />
              <h1 style="color:#ffffff;margin:14px 0 0;font-size:26px;font-weight:700;">Neuro Performance Report</h1>
              <p style="color:#9ec2f0;margin:8px 0 0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;">Patient Brain-Type Profile &amp; Review</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="color:#15315f;font-size:15px;margin:0 0 20px;">Dear <strong>${isClinic ? (clinicName || 'Team') : (patientName || 'there')}</strong>,</p>
              <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 20px;">${isClinic
                ? `The <strong>Neuro Performance Report</strong> for <strong>${patientName || 'your patient'}</strong> is ready for clinical review. Below are the details:`
                : 'Your <strong>Neuro Performance Report</strong> is ready. Below are the details:'}</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:0 0 24px;">
                <tr style="background:#f8f9fc;">
                  <td style="padding:10px 16px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-bottom:1px solid #e5e7eb;" colspan="2">Report Details</td>
                </tr>
                ${rows.map((row, i) => `
                <tr>
                  <td style="padding:10px 16px;font-size:13px;color:#888;${i < rows.length - 1 ? 'border-bottom:1px solid #f0f0f0;' : ''}width:160px;">${row.label}</td>
                  <td style="padding:10px 16px;font-size:14px;color:#15315f;font-weight:500;${i < rows.length - 1 ? 'border-bottom:1px solid #f0f0f0;' : ''}">${row.value}</td>
                </tr>`).join('')}
              </table>
              <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 20px;">Please login to your portal to view and download your full report.</p>
              <div style="text-align:center;margin:0 0 24px;">
                <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#0f2a5e 0%,#1e63b4 100%);color:#ffffff;text-decoration:none;padding:13px 36px;border-radius:8px;font-weight:600;font-size:15px;">Login to Portal</a>
              </div>
              <p style="color:#555;font-size:14px;margin:0 0 4px;">Best regards,</p>
              <p style="color:#15315f;font-size:14px;font-weight:600;margin:0 0 2px;">The Limitless Brain Lab Team</p>
              <p style="color:#15315f;font-size:14px;margin:0;">Limitlessbrainlab.com</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8f9fc;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="color:#aaa;margin:0;font-size:11px;">Limitlessbrainlab.com &nbsp;|&nbsp; limitlessbrainlab@gmail.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

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
      html: reportHtml({ isClinic: false, patientName, clinicName, reportUrl, loginUrl: patientLoginUrl, generatedAt }),
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
          html: reportHtml({ isClinic: true, patientName, clinicName, reportUrl, loginUrl: clinicLoginUrl, generatedAt }),
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
