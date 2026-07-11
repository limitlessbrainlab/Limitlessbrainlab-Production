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

const getReportEmailHtml = ({ isClinic, patientName, clinicName, reportUrl, loginUrl, generatedAt, logoSrc = 'cid:company-logo' }) => {
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
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #0f2a5e 0%, #1e63b4 100%); padding: 30px 32px; text-align: center;">
              <img src="${logoSrc}" alt="Limitless Brain Lab" style="width: 84px; height: 84px; border-radius: 50%; object-fit: cover;" />
              <h1 style="color: #ffffff; margin: 14px 0 0; font-size: 26px; font-weight: 700;">Neuro Performance Report</h1>
              <p style="color: #9ec2f0; margin: 8px 0 0; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">Patient Brain-Type Profile &amp; Review</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px;">
              <p style="color: #15315f; font-size: 15px; margin: 0 0 20px;">Dear <strong>${isClinic ? (clinicName || 'Team') : (patientName || 'there')}</strong>,</p>
              <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">${isClinic
                ? `The <strong>Neuro Performance Report</strong> for <strong>${patientName || 'your patient'}</strong> is ready for clinical review. Below are the details:`
                : 'Your <strong>Neuro Performance Report</strong> is ready. Below are the details:'}</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; margin: 0 0 24px;">
                <tr style="background: #f8f9fc;">
                  <td style="padding: 10px 16px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; border-bottom: 1px solid #e5e7eb;" colspan="2">Report Details</td>
                </tr>
                ${rows.map((row, i) => `
                <tr>
                  <td style="padding: 10px 16px; font-size: 13px; color: #888; ${i < rows.length - 1 ? 'border-bottom: 1px solid #f0f0f0;' : ''} width: 160px;">${row.label}</td>
                  <td style="padding: 10px 16px; font-size: 14px; color: #15315f; font-weight: 500; ${i < rows.length - 1 ? 'border-bottom: 1px solid #f0f0f0;' : ''}">${row.value}</td>
                </tr>`).join('')}
              </table>

              <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">Please login to your portal to view and download your full report.</p>

              <div style="text-align: center; margin: 0 0 24px;">
                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #0f2a5e 0%, #1e63b4 100%); color: #ffffff; text-decoration: none; padding: 13px 36px; border-radius: 8px; font-weight: 600; font-size: 15px;">Login to Portal -></a>
              </div>

              <p style="color: #555; font-size: 14px; margin: 0 0 4px;">Best regards,</p>
              <p style="color: #15315f; font-size: 14px; font-weight: 600; margin: 0 0 2px;">The Limitless Brain Lab Team</p>
              <p style="color: #15315f; font-size: 14px; margin: 0;">Limitlessbrainlab.com</p>
            </td>
          </tr>

          <tr>
            <td style="background: #f8f9fc; padding: 16px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #aaa; margin: 0; font-size: 11px;">Limitlessbrainlab.com &nbsp;|&nbsp; limitlessbrainlab@gmail.com</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Distinct template for the NeuroSense Report (detailed QEEG brain-health report).
// Deliberately different design/palette from the Neuro Performance Report above so the
// two reports are visually distinguishable. Titled "NeuroSense Report".
const getNeuroSenseReportEmailHtml = ({ isClinic, patientName, clinicName, reportUrl, loginUrl, generatedAt, logoSrc = 'cid:company-logo' }) => {
  const rows = [
    { label: 'Patient Name', value: patientName || 'Not provided' },
    ...(isClinic ? [{ label: 'Clinic', value: clinicName || 'Not provided' }] : []),
    { label: 'Report Type', value: 'NeuroSense Report' },
    { label: 'Report PDF', value: `<a href="${reportUrl}" style="color:#0d9488;font-weight:600;text-decoration:none;">Download Report</a>` },
    { label: 'Generated', value: fmtDateTime(generatedAt) },
  ];

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(13,148,136,0.12);">

          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #0d9488 100%); padding: 30px 32px; text-align: center;">
              <img src="${logoSrc}" alt="Limitless Brain Lab" style="width: 84px; height: 84px; border-radius: 50%; object-fit: cover;" />
              <h1 style="color: #ffffff; margin: 14px 0 0; font-size: 26px; font-weight: 700;">NeuroSense Report</h1>
              <p style="color: #99f6e4; margin: 8px 0 0; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">QEEG Brain Health Assessment</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px;">
              <p style="color: #134e4a; font-size: 15px; margin: 0 0 20px;">Dear <strong>${isClinic ? (clinicName || 'Team') : (patientName || 'there')}</strong>,</p>
              <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">${isClinic
                ? `The <strong>NeuroSense Report</strong> for <strong>${patientName || 'your patient'}</strong> is ready for clinical review. This detailed QEEG brain-health report is summarised below:`
                : 'Your <strong>NeuroSense Report</strong> is ready. This detailed QEEG brain-health report is summarised below:'}</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #d1e7e3; border-radius: 10px; overflow: hidden; margin: 0 0 24px;">
                <tr style="background: #ecfdf5;">
                  <td style="padding: 10px 16px; font-size: 12px; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; border-bottom: 1px solid #d1e7e3;" colspan="2">Report Details</td>
                </tr>
                ${rows.map((row, i) => `
                <tr>
                  <td style="padding: 10px 16px; font-size: 13px; color: #888; ${i < rows.length - 1 ? 'border-bottom: 1px solid #f0f0f0;' : ''} width: 160px;">${row.label}</td>
                  <td style="padding: 10px 16px; font-size: 14px; color: #134e4a; font-weight: 500; ${i < rows.length - 1 ? 'border-bottom: 1px solid #f0f0f0;' : ''}">${row.value}</td>
                </tr>`).join('')}
              </table>

              <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">Please login to your portal to view and download your full report.</p>

              <div style="text-align: center; margin: 0 0 24px;">
                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #064e3b 0%, #0d9488 100%); color: #ffffff; text-decoration: none; padding: 13px 36px; border-radius: 8px; font-weight: 600; font-size: 15px;">Login to Portal -></a>
              </div>

              <p style="color: #555; font-size: 14px; margin: 0 0 4px;">Best regards,</p>
              <p style="color: #134e4a; font-size: 14px; font-weight: 600; margin: 0 0 2px;">The Limitless Brain Lab Team</p>
              <p style="color: #134e4a; font-size: 14px; margin: 0;">Limitlessbrainlab.com</p>
            </td>
          </tr>

          <tr>
            <td style="background: #ecfdf5; padding: 16px 32px; border-top: 1px solid #d1e7e3; text-align: center;">
              <p style="color: #64748b; margin: 0; font-size: 11px;">Limitlessbrainlab.com &nbsp;|&nbsp; limitlessbrainlab@gmail.com</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

module.exports = { getReportEmailHtml, getNeuroSenseReportEmailHtml, fmtDateTime };
