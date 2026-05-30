const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Downloads folder path
const downloadsPath = path.join(os.homedir(), 'Downloads');

// Sample brain performance data
const samplePatient = {
  name: 'John Doe',
  age: 35,
  gender: 'Male',
  testDate: '2026-05-07',
  clinicName: 'Neuro360 Clinic',
  assessmentType: 'QEEG Brain Performance Assessment'
};

const brainMetrics = {
  focus: { score: 78, percentile: 75, status: 'Good' },
  attention: { score: 82, percentile: 80, status: 'Excellent' },
  cognition: { score: 71, percentile: 68, status: 'Average' },
  emotional: { score: 85, percentile: 82, status: 'Excellent' },
  relaxation: { score: 68, percentile: 65, status: 'Average' },
  stress: { score: 45, percentile: 42, status: 'Below Average' },
  memory: { score: 76, percentile: 73, status: 'Good' },
  creativity: { score: 80, percentile: 78, status: 'Good' }
};

// Template 1: Professional Blue
const template1 = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 900px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 40px; border-radius: 8px; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 32px; }
    .header p { margin: 5px 0; font-size: 14px; }
    .section { margin-bottom: 30px; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; }
    .section h2 { color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0; }
    .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .metric-card { background: #f0f9ff; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; }
    .metric-label { font-weight: bold; color: #1e40af; }
    .metric-score { font-size: 28px; font-weight: bold; color: #1e40af; }
    .metric-percentile { font-size: 12px; color: #64748b; }
    .summary { background: #eff6ff; padding: 15px; border-radius: 6px; }
    .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Brain Performance Report</h1>
      <p>${samplePatient.clinicName}</p>
      <p>Assessment Date: ${samplePatient.testDate}</p>
    </div>

    <div class="section">
      <h2>Patient Information</h2>
      <p><strong>Name:</strong> ${samplePatient.name}</p>
      <p><strong>Age:</strong> ${samplePatient.age} years | <strong>Gender:</strong> ${samplePatient.gender}</p>
      <p><strong>Assessment Type:</strong> ${samplePatient.assessmentType}</p>
    </div>

    <div class="section">
      <h2>Performance Metrics</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Focus</div>
          <div class="metric-score">${brainMetrics.focus.score}</div>
          <div class="metric-percentile">Percentile: ${brainMetrics.focus.percentile}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Attention</div>
          <div class="metric-score">${brainMetrics.attention.score}</div>
          <div class="metric-percentile">Percentile: ${brainMetrics.attention.percentile}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Cognition</div>
          <div class="metric-score">${brainMetrics.cognition.score}</div>
          <div class="metric-percentile">Percentile: ${brainMetrics.cognition.percentile}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Emotional Balance</div>
          <div class="metric-score">${brainMetrics.emotional.score}</div>
          <div class="metric-percentile">Percentile: ${brainMetrics.emotional.percentile}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Summary</h2>
      <div class="summary">
        <p><strong>Overall Assessment:</strong> Patient shows strong performance in attention and emotional balance areas. Recommended focus areas: stress management and relaxation techniques.</p>
      </div>
    </div>

    <div class="footer">
      <p>This report is confidential and for professional use only. | Neuro360 © 2026</p>
    </div>
  </div>
</body>
</html>
`;

// Template 2: Modern Minimalist
const template2 = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 40px; color: #1a1a1a; background: #fafafa; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 60px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { margin-bottom: 50px; }
    .header h1 { font-size: 36px; margin: 0 0 10px; font-weight: 300; letter-spacing: -1px; }
    .header-meta { font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .section { margin-bottom: 40px; }
    .section h2 { font-size: 18px; font-weight: 600; margin: 30px 0 20px; text-transform: uppercase; letter-spacing: 0.5px; color: #000; border-top: 1px solid #eee; padding-top: 20px; }
    .patient-info { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; font-size: 14px; }
    .metrics-minimal { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; }
    .metric-minimal { text-align: center; }
    .metric-minimal-value { font-size: 32px; font-weight: 300; color: #2c3e50; }
    .metric-minimal-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-top: 8px; }
    .footer { border-top: 1px solid #eee; padding-top: 30px; text-align: center; font-size: 12px; color: #999; margin-top: 50px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Brain Performance Report</h1>
      <div class="header-meta">${samplePatient.clinicName} | ${samplePatient.testDate}</div>
    </div>

    <div class="section">
      <h2>Patient</h2>
      <div class="patient-info">
        <div><strong>${samplePatient.name}</strong><br>${samplePatient.age}y | ${samplePatient.gender}</div>
        <div><strong>Assessment</strong><br>${samplePatient.assessmentType}</div>
      </div>
    </div>

    <div class="section">
      <h2>Metrics</h2>
      <div class="metrics-minimal">
        <div class="metric-minimal">
          <div class="metric-minimal-value">${brainMetrics.focus.score}</div>
          <div class="metric-minimal-label">Focus</div>
        </div>
        <div class="metric-minimal">
          <div class="metric-minimal-value">${brainMetrics.attention.score}</div>
          <div class="metric-minimal-label">Attention</div>
        </div>
        <div class="metric-minimal">
          <div class="metric-minimal-value">${brainMetrics.cognition.score}</div>
          <div class="metric-minimal-label">Cognition</div>
        </div>
        <div class="metric-minimal">
          <div class="metric-minimal-value">${brainMetrics.emotional.score}</div>
          <div class="metric-minimal-label">Emotional</div>
        </div>
        <div class="metric-minimal">
          <div class="metric-minimal-value">${brainMetrics.relaxation.score}</div>
          <div class="metric-minimal-label">Relaxation</div>
        </div>
        <div class="metric-minimal">
          <div class="metric-minimal-value">${brainMetrics.stress.score}</div>
          <div class="metric-minimal-label">Stress Level</div>
        </div>
        <div class="metric-minimal">
          <div class="metric-minimal-value">${brainMetrics.memory.score}</div>
          <div class="metric-minimal-label">Memory</div>
        </div>
        <div class="metric-minimal">
          <div class="metric-minimal-value">${brainMetrics.creativity.score}</div>
          <div class="metric-minimal-label">Creativity</div>
        </div>
      </div>
    </div>

    <div class="footer">
      Neuro360 © 2026 | Confidential
    </div>
  </div>
</body>
</html>
`;

// Template 3: Colorful Clinical
const template3 = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; color: #2c3e50; }
    .container { max-width: 950px; margin: 0 auto; }
    .header { background: linear-gradient(to right, #9b59b6, #3498db, #1abc9c); color: white; padding: 35px; border-radius: 10px; margin-bottom: 25px; }
    .header h1 { margin: 0; font-size: 34px; font-weight: bold; }
    .header p { margin: 8px 0; font-size: 14px; opacity: 0.9; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px; }
    .info-box { background: #ecf0f1; padding: 15px; border-radius: 6px; }
    .info-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; }
    .info-value { font-size: 16px; font-weight: bold; color: #2c3e50; margin-top: 5px; }
    .metrics-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
    .metric-item { border-radius: 8px; padding: 20px; color: white; text-align: center; }
    .metric-1 { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .metric-2 { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    .metric-3 { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    .metric-4 { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
    .metric-5 { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
    .metric-6 { background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); }
    .metric-7 { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
    .metric-8 { background: linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%); }
    .metric-number { font-size: 42px; font-weight: bold; }
    .metric-name { font-size: 14px; margin-top: 10px; }
    .footer { text-align: center; color: #95a5a6; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧠 Brain Performance Report</h1>
      <p>${samplePatient.clinicName}</p>
      <p>Assessment Date: ${samplePatient.testDate}</p>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <div class="info-label">Patient Name</div>
        <div class="info-value">${samplePatient.name}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Age / Gender</div>
        <div class="info-value">${samplePatient.age}y / ${samplePatient.gender}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Assessment Type</div>
        <div class="info-value">QEEG</div>
      </div>
    </div>

    <div class="metrics-container">
      <div class="metric-item metric-1">
        <div class="metric-number">${brainMetrics.focus.score}</div>
        <div class="metric-name">Focus</div>
      </div>
      <div class="metric-item metric-2">
        <div class="metric-number">${brainMetrics.attention.score}</div>
        <div class="metric-name">Attention</div>
      </div>
      <div class="metric-item metric-3">
        <div class="metric-number">${brainMetrics.cognition.score}</div>
        <div class="metric-name">Cognition</div>
      </div>
      <div class="metric-item metric-4">
        <div class="metric-number">${brainMetrics.emotional.score}</div>
        <div class="metric-name">Emotional</div>
      </div>
      <div class="metric-item metric-5">
        <div class="metric-number">${brainMetrics.relaxation.score}</div>
        <div class="metric-name">Relaxation</div>
      </div>
      <div class="metric-item metric-6">
        <div class="metric-number">${brainMetrics.stress.score}</div>
        <div class="metric-name">Stress</div>
      </div>
      <div class="metric-item metric-7">
        <div class="metric-number">${brainMetrics.memory.score}</div>
        <div class="metric-name">Memory</div>
      </div>
      <div class="metric-item metric-8">
        <div class="metric-number">${brainMetrics.creativity.score}</div>
        <div class="metric-name">Creativity</div>
      </div>
    </div>

    <div class="footer">
      © 2026 Neuro360 - Confidential Medical Report
    </div>
  </div>
</body>
</html>
`;

// Template 4: Corporate Formal
const template4 = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Times New Roman', serif; margin: 0; padding: 30px; color: #1a1a1a; line-height: 1.6; }
    .container { max-width: 850px; margin: 0 auto; border: 2px solid #333; padding: 40px; }
    .logo-header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .logo-header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .logo-header p { margin: 5px 0; font-size: 13px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 15px; }
    .section-content { font-size: 13px; }
    .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    .table td { border: 1px solid #ccc; padding: 8px; }
    .table td:first-child { font-weight: bold; width: 40%; }
    .summary-box { background: #f5f5f5; border-left: 4px solid #333; padding: 15px; margin: 15px 0; }
    .footer { text-align: center; border-top: 1px solid #333; padding-top: 20px; font-size: 11px; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-header">
      <h1>BRAIN PERFORMANCE ASSESSMENT REPORT</h1>
      <p>${samplePatient.clinicName}</p>
    </div>

    <div class="section">
      <div class="section-title">Patient Information</div>
      <div class="section-content">
        <table class="table">
          <tr><td>Patient Name</td><td>${samplePatient.name}</td></tr>
          <tr><td>Age</td><td>${samplePatient.age} years</td></tr>
          <tr><td>Gender</td><td>${samplePatient.gender}</td></tr>
          <tr><td>Assessment Date</td><td>${samplePatient.testDate}</td></tr>
          <tr><td>Assessment Type</td><td>${samplePatient.assessmentType}</td></tr>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Performance Scores</div>
      <div class="section-content">
        <table class="table">
          <tr><td>Focus</td><td>${brainMetrics.focus.score}/100</td><td>Percentile: ${brainMetrics.focus.percentile}</td></tr>
          <tr><td>Attention</td><td>${brainMetrics.attention.score}/100</td><td>Percentile: ${brainMetrics.attention.percentile}</td></tr>
          <tr><td>Cognition</td><td>${brainMetrics.cognition.score}/100</td><td>Percentile: ${brainMetrics.cognition.percentile}</td></tr>
          <tr><td>Emotional Balance</td><td>${brainMetrics.emotional.score}/100</td><td>Percentile: ${brainMetrics.emotional.percentile}</td></tr>
          <tr><td>Relaxation</td><td>${brainMetrics.relaxation.score}/100</td><td>Percentile: ${brainMetrics.relaxation.percentile}</td></tr>
          <tr><td>Stress Level</td><td>${brainMetrics.stress.score}/100</td><td>Percentile: ${brainMetrics.stress.percentile}</td></tr>
          <tr><td>Memory</td><td>${brainMetrics.memory.score}/100</td><td>Percentile: ${brainMetrics.memory.percentile}</td></tr>
          <tr><td>Creativity</td><td>${brainMetrics.creativity.score}/100</td><td>Percentile: ${brainMetrics.creativity.percentile}</td></tr>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Clinical Assessment</div>
      <div class="summary-box">
        This assessment indicates above-average performance in attention and cognitive processing. Patient demonstrates good emotional regulation and stress management capabilities. Recommended areas for continued development include anxiety reduction and relaxation techniques.
      </div>
    </div>

    <div class="footer">
      <p>This document is confidential and intended for professional medical use only.</p>
      <p>Neuro360 Medical Assessments © 2026</p>
    </div>
  </div>
</body>
</html>
`;

// Template 5: Wellness Focused
const template5 = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 30px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
    .wellness-header { text-align: center; margin-bottom: 40px; }
    .wellness-header h1 { margin: 0; color: #27ae60; font-size: 36px; }
    .wellness-header-emoji { font-size: 48px; margin-bottom: 10px; }
    .wellness-header p { color: #7f8c8d; margin: 8px 0; }
    .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .card { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .card-label { font-weight: bold; color: #1b5e20; font-size: 14px; }
    .card-value { font-size: 18px; color: #2e7d32; margin-top: 8px; }
    .wellness-metrics { margin-bottom: 30px; }
    .wellness-section-title { color: #27ae60; font-size: 20px; font-weight: bold; margin-bottom: 15px; border-bottom: 3px solid #27ae60; padding-bottom: 10px; }
    .metric-bar { margin: 15px 0; }
    .metric-bar-label { font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
    .metric-bar-container { background: #ecf0f1; border-radius: 10px; overflow: hidden; height: 20px; }
    .metric-bar-fill { background: linear-gradient(to right, #27ae60, #2ecc71); height: 100%; transition: width 0.3s; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; color: white; font-size: 12px; font-weight: bold; }
    .wellness-tips { background: #f1f8f6; padding: 20px; border-radius: 10px; border-left: 5px solid #27ae60; }
    .wellness-tips h3 { color: #27ae60; margin-top: 0; }
    .wellness-tips ul { margin: 10px 0; padding-left: 20px; }
    .wellness-tips li { color: #2c3e50; margin: 8px 0; }
    .footer { text-align: center; color: #95a5a6; font-size: 12px; margin-top: 40px; border-top: 1px solid #ecf0f1; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="wellness-header">
      <div class="wellness-header-emoji">🧠✨</div>
      <h1>Brain Wellness Report</h1>
      <p>Your Personal Brain Health Assessment</p>
    </div>

    <div class="card-grid">
      <div class="card">
        <div class="card-label">Patient</div>
        <div class="card-value">${samplePatient.name}</div>
      </div>
      <div class="card">
        <div class="card-label">Assessment Date</div>
        <div class="card-value">${samplePatient.testDate}</div>
      </div>
      <div class="card">
        <div class="card-label">Age & Gender</div>
        <div class="card-value">${samplePatient.age}y, ${samplePatient.gender}</div>
      </div>
      <div class="card">
        <div class="card-label">Clinic</div>
        <div class="card-value">${samplePatient.clinicName}</div>
      </div>
    </div>

    <div class="wellness-metrics">
      <div class="wellness-section-title">📊 Your Brain Performance</div>

      <div class="metric-bar">
        <div class="metric-bar-label">Focus Capacity (${brainMetrics.focus.score}%)</div>
        <div class="metric-bar-container">
          <div class="metric-bar-fill" style="width: ${brainMetrics.focus.score}%">${brainMetrics.focus.score}%</div>
        </div>
      </div>

      <div class="metric-bar">
        <div class="metric-bar-label">Attention Level (${brainMetrics.attention.score}%)</div>
        <div class="metric-bar-container">
          <div class="metric-bar-fill" style="width: ${brainMetrics.attention.score}%">${brainMetrics.attention.score}%</div>
        </div>
      </div>

      <div class="metric-bar">
        <div class="metric-bar-label">Cognitive Function (${brainMetrics.cognition.score}%)</div>
        <div class="metric-bar-container">
          <div class="metric-bar-fill" style="width: ${brainMetrics.cognition.score}%">${brainMetrics.cognition.score}%</div>
        </div>
      </div>

      <div class="metric-bar">
        <div class="metric-bar-label">Emotional Balance (${brainMetrics.emotional.score}%)</div>
        <div class="metric-bar-container">
          <div class="metric-bar-fill" style="width: ${brainMetrics.emotional.score}%">${brainMetrics.emotional.score}%</div>
        </div>
      </div>

      <div class="metric-bar">
        <div class="metric-bar-label">Relaxation Ability (${brainMetrics.relaxation.score}%)</div>
        <div class="metric-bar-container">
          <div class="metric-bar-fill" style="width: ${brainMetrics.relaxation.score}%">${brainMetrics.relaxation.score}%</div>
        </div>
      </div>

      <div class="metric-bar">
        <div class="metric-bar-label">Stress Management (${100-brainMetrics.stress.score}%)</div>
        <div class="metric-bar-container">
          <div class="metric-bar-fill" style="width: ${100-brainMetrics.stress.score}%">${100-brainMetrics.stress.score}%</div>
        </div>
      </div>
    </div>

    <div class="wellness-tips">
      <h3>💡 Wellness Recommendations</h3>
      <ul>
        <li>Practice mindfulness meditation for 10-15 minutes daily</li>
        <li>Maintain consistent sleep schedule (7-8 hours)</li>
        <li>Engage in regular physical exercise</li>
        <li>Limit screen time before bedtime</li>
        <li>Stay hydrated throughout the day</li>
      </ul>
    </div>

    <div class="footer">
      <p>Your wellness journey starts today. Review this report regularly to track your progress.</p>
      <p>© 2026 Neuro360 - Your Partner in Brain Health</p>
    </div>
  </div>
</body>
</html>
`;

// Generate PDF function
async function generatePDF(htmlContent, filename) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'load', timeout: 60000 });

    const filepath = path.join(downloadsPath, filename);
    await page.pdf({
      path: filepath,
      format: 'A4',
      margin: { top: 10, right: 10, bottom: 10, left: 10 }
    });

    await browser.close();
    console.log(`✅ Generated: ${filename}`);
    return filepath;
  } catch (error) {
    console.error(`❌ Error generating ${filename}:`, error.message);
    return null;
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Brain Performance Report Generation...\n');

  const templates = [
    { html: template1, filename: 'Brain_Report_Design_1_Professional_Blue.pdf' },
    { html: template2, filename: 'Brain_Report_Design_2_Modern_Minimalist.pdf' },
    { html: template3, filename: 'Brain_Report_Design_3_Colorful_Clinical.pdf' },
    { html: template4, filename: 'Brain_Report_Design_4_Corporate_Formal.pdf' },
    { html: template5, filename: 'Brain_Report_Design_5_Wellness_Focused.pdf' }
  ];

  console.log(`📂 Saving to: ${downloadsPath}\n`);

  for (const template of templates) {
    await generatePDF(template.html, template.filename);
  }

  console.log('\n✨ All reports generated successfully!');
  console.log(`\nCheck your Downloads folder: ${downloadsPath}`);
}

main().catch(console.error);
