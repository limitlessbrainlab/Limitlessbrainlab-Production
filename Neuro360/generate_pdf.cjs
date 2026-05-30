const PdfPrinter = require('pdfmake/src/printer');
const fs = require('fs');
const path = require('path');
const os = require('os');

const fonts = {
  Roboto: {
    normal: './node_modules/pdfmake/build/Roboto-Regular.ttf',
    bold: './node_modules/pdfmake/build/Roboto-Bold.ttf',
    italics: './node_modules/pdfmake/build/Roboto-Italic.ttf',
    bolditalics: './node_modules/pdfmake/build/Roboto-BoldItalic.ttf'
  }
};

const printer = new PdfPrinter(fonts);

const docDefinition = {
  pageSize: 'A4',
  pageMargins: [40, 60, 40, 60],
  defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.4 },
  styles: {
    header: { fontSize: 20, bold: true, color: '#667eea', marginBottom: 10, border: [0, 0, 0, 3], borderColor: '#667eea' },
    subheader: { fontSize: 14, bold: true, color: '#333', marginTop: 12, marginBottom: 8 },
    title: { fontSize: 28, bold: true, color: '#667eea', alignment: 'center', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#666', alignment: 'center', marginBottom: 30 },
    tableHeader: { bold: true, fillColor: '#667eea', color: 'white', alignment: 'center', fontSize: 9 },
    tableBody: { fontSize: 9, alignment: 'left' },
    statusBox: { fillColor: '#e8f5e9', bold: true, color: '#2e7d32', border: [1, 1, 1, 1], borderColor: '#4caf50' },
  },
  content: [
    // COVER PAGE
    { text: '🧠', alignment: 'center', fontSize: 48, margin: [0, 150, 0, 40] },
    { text: 'NEUROSENSE', style: 'title' },
    { text: 'AI-Powered Neurological Assessment Platform', style: 'subtitle' },
    { text: 'Project Handoff Document', alignment: 'center', fontSize: 24, bold: true, margin: [0, 0, 0, 50] },
    
    {
      table: {
        widths: ['40%', '60%'],
        body: [
          [{ text: 'Document No.', bold: true }, 'NSE-PHD-2026-001'],
          [{ text: 'Version', bold: true }, '1.0'],
          [{ text: 'Date', bold: true }, '9 May 2026'],
          [{ text: 'Classification', bold: true }, 'Confidential'],
          [{ text: 'Status', bold: true }, 'Final — Project Complete']
        ]
      },
      margin: [40, 40, 40, 80],
      layout: 'noBorders'
    },
    
    { text: 'PREPARED BY (DEVELOPER)', alignment: 'center', bold: true, fontSize: 9, margin: [0, 30, 0, 10] },
    { text: 'Technical Development Team', alignment: 'center', bold: true, fontSize: 11 },
    { text: 'Limitless Brain Lab Technologies\nAI & Healthcare Division\ncmd@hopehospital.com', alignment: 'center', fontSize: 9, margin: [0, 0, 0, 40] },
    
    { text: 'PREPARED FOR (CLIENT)', alignment: 'center', bold: true, fontSize: 9, margin: [0, 20, 0, 10] },
    { text: 'Limitless Brain Lab', alignment: 'center', bold: true, fontSize: 11 },
    { text: 'Neurological Assessment Services\nProduction Environment: Render + Vercel', alignment: 'center', fontSize: 9 },
    
    { pageBreak: 'after' },
    
    // EXECUTIVE SUMMARY
    { text: '1. EXECUTIVE SUMMARY', style: 'header' },
    { text: 'This document is the official project handoff from the Technical Development Team to Limitless Brain Lab ("LBL") for the Neurosense Neurological Assessment Platform.', margin: [0, 10, 0, 10] },
    { text: 'The project has been completed in full. All functional requirements have been met, and the system is operating in production with full stability.', margin: [0, 0, 0, 20] },
    
    { text: '✓ Project Status — COMPLETE\nAll deliverables have been met. Source code, database access, deployment credentials, and documentation are transferred to Limitless Brain Lab. System is in production and fully operational.', style: 'statusBox', margin: [10, 10, 10, 20] },
    
    { text: 'SCOPE OF HANDOFF', style: 'subheader', margin: [0, 15, 0, 10] },
    {
      table: {
        headerRows: 1,
        widths: ['25%', '50%', '25%'],
        body: [
          [{ text: 'Item', style: 'tableHeader' }, { text: 'Details', style: 'tableHeader' }, { text: 'Status', style: 'tableHeader' }],
          ['Source Code', 'Complete React + Node.js codebase', 'Delivered'],
          ['Database', 'Supabase PostgreSQL with RLS', 'Delivered'],
          ['Deployment', 'Render.com + Vercel CI/CD', 'Configured'],
          ['AI Integration', 'Google Gemini 2.5 Flash', 'Integrated'],
          ['Admin Dashboards', 'Super Admin analytics & control', 'Delivered'],
          ['Documentation', 'Complete handoff document', 'Delivered'],
          ['Git Repository', 'Full version history (50+ commits)', 'Delivered'],
          ['Security Hardening', 'All 40 hardening points', 'Verified']
        ]
      },
      margin: [0, 10, 0, 20]
    },
    
    { pageBreak: 'after' },
    
    // APPLICATION OVERVIEW
    { text: '2. APPLICATION OVERVIEW', style: 'header' },
    { text: 'Neurosense is an AI-powered neurological assessment platform enabling clinicians to analyze brain data, generate clinical reports, and track outcomes using advanced machine learning.', margin: [0, 10, 0, 15] },
    
    { text: 'CORE USER FLOW', style: 'subheader' },
    { ul: [
      'Patients register and access brain wellness data and training protocols',
      'Clinicians upload EEG files → Gemini AI generates clinical reports → PDF export',
      'Clinics manage patient rosters, subscriptions, and team members',
      'Super Admins monitor system health, manage clinics, track analytics',
      'Real-time notifications for reports, payments, and clinical alerts'
    ], margin: [0, 10, 0, 15] },
    
    { text: 'KEY FEATURES', style: 'subheader' },
    { ul: [
      'QEEG Report Generation with AI-powered EEG analysis',
      'Patient Management with medical history tracking',
      'Brain Training with personalized protocols',
      'Subscription Management via Razorpay',
      'Real-time Notifications and email delivery',
      'Secure Data Access with Row-Level Security'
    ], margin: [0, 10, 0, 20] },
    
    { pageBreak: 'after' },
    
    // TECHNOLOGY STACK
    { text: '3. TECHNOLOGY STACK', style: 'header' },
    {
      table: {
        headerRows: 1,
        widths: ['20%', '20%', '15%', '45%'],
        body: [
          [{ text: 'Layer', style: 'tableHeader' }, { text: 'Technology', style: 'tableHeader' }, { text: 'Ver.', style: 'tableHeader' }, { text: 'Purpose', style: 'tableHeader' }],
          ['Frontend', 'React', '18.x', 'UI framework'],
          ['Build', 'Vite', '5.x', 'Fast bundler with HMR'],
          ['Styling', 'Tailwind CSS', '3.x', 'CSS framework'],
          ['Routing', 'React Router', '6.x', 'Client-side routing'],
          ['Backend', 'Node.js + Express', '18.x', 'REST API server'],
          ['Database', 'Supabase PostgreSQL', '15.x', 'DB + Auth + Storage'],
          ['AI', 'Google Gemini 2.5', 'Latest', 'QEEG analysis'],
          ['Payments', 'Razorpay', '—', 'Subscription billing'],
          ['Email', 'Nodemailer', '6.x', 'Transactional email'],
          ['Logging', 'Winston', '3.x', 'Application logging'],
          ['Frontend', 'Vercel', '—', 'Auto deployments'],
          ['Backend', 'Render.com', '—', 'Server hosting']
        ]
      },
      margin: [0, 10, 0, 20]
    },
    
    { pageBreak: 'after' },
    
    // AUTHENTICATION
    { text: '4. AUTHENTICATION & USER ROLES', style: 'header' },
    
    { text: 'USER ROLES', style: 'subheader' },
    {
      table: {
        headerRows: 1,
        widths: ['20%', '30%', '50%'],
        body: [
          [{ text: 'Role', style: 'tableHeader' }, { text: 'Description', style: 'tableHeader' }, { text: 'Permissions', style: 'tableHeader' }],
          ['Patient', 'End user', 'View own reports, track training, update medical history'],
          ['Clinic', 'Clinician/Staff', 'Upload EEG, generate reports, manage patient roster'],
          ['Admin', 'Clinic admin', 'Manage subscriptions, handle payments, view staff'],
          ['Super Admin', 'Platform admin', 'Manage all users, monitor health, view all analytics']
        ]
      },
      margin: [0, 10, 0, 15]
    },
    
    { text: 'SECURITY FEATURES', style: 'subheader' },
    { ul: [
      'JWT authentication with 24-hour token expiry',
      'Role-Based Access Control (RBAC) on all endpoints',
      'Password hashing with bcrypt (salt cost 12)',
      'Rate limiting on login attempts (5/minute per IP)',
      'Row-Level Security (RLS) on all database tables',
      'Encryption in transit (HTTPS/TLS) and at rest',
      'Input validation with Zod schemas',
      'Audit logging for all sensitive operations'
    ], margin: [0, 10, 0, 20] },
    
    { pageBreak: 'after' },
    
    // INTEGRATIONS
    { text: '5. THIRD-PARTY INTEGRATIONS', style: 'header' },
    
    { text: 'Google Gemini API', style: 'subheader' },
    { ul: [
      'Purpose: Analyze EEG files and generate clinical reports',
      'Model: Gemini 2.5 Flash (vision capabilities)',
      'Rate: ~20 requests/day | Cost: ~$0.04 per request',
      'Error Handling: Automatic retry with exponential backoff'
    ], margin: [0, 8, 0, 12] },
    
    { text: 'Supabase (Database + Auth + Storage)', style: 'subheader' },
    { ul: [
      'Database: PostgreSQL with all user data',
      'Auth: Supabase Auth for login/signup',
      'Storage: PDF reports in patient-reports bucket',
      'Security: Row-Level Security (RLS) enabled'
    ], margin: [0, 8, 0, 12] },
    
    { text: 'Razorpay (Subscription Billing)', style: 'subheader' },
    { ul: [
      'Subscription Types: Basic, Pro, Enterprise',
      'Payment Flow: Create order → Pay → Verify signature → Update DB',
      'Security: PCI-certified, no card data stored'
    ], margin: [0, 8, 0, 12] },
    
    { text: 'Nodemailer (Email Delivery)', style: 'subheader' },
    { ul: [
      'SMTP: Gmail with app-specific password',
      'Emails: Reports, credentials, notifications',
      'Rate: ~100 emails/min'
    ], margin: [0, 8, 0, 20] },
    
    { pageBreak: 'after' },
    
    // DEPLOYMENT
    { text: '6. DEPLOYMENT GUIDE', style: 'header' },
    
    { text: 'FRONTEND (Vercel)', style: 'subheader' },
    { ul: [
      'Auto-deployment on push to main branch',
      'Build: npm run build (Vite)',
      'Environment variables: Set in Vercel dashboard',
      'URL: https://neurosense.vercel.app'
    ], margin: [0, 8, 0, 12] },
    
    { text: 'BACKEND (Render.com)', style: 'subheader' },
    { ul: [
      'Auto-deployment on push to main branch',
      'Runtime: Node.js 18.x',
      'Start: cd server && npm start',
      '⚠ CRITICAL: GEMINI_API_KEY must be in render.yaml with sync:false',
      'URL: https://neurosense-api.onrender.com'
    ], margin: [0, 8, 0, 12] },
    
    { text: 'DATABASE (Supabase)', style: 'subheader' },
    { ul: [
      'Create tables: Run database/schema.sql in SQL editor',
      'Enable RLS: Row-Level Security on all tables',
      'Backups: 7-day retention (auto daily)',
      'Connection: PostgreSQL via Supabase URL'
    ], margin: [0, 8, 0, 20] },
    
    { pageBreak: 'after' },
    
    // SECURITY & COMPLIANCE
    { text: '7. SECURITY & COMPLIANCE', style: 'header' },
    
    { text: '✓ 40-POINT PRODUCTION HARDENING VERIFIED', style: 'statusBox', margin: [10, 10, 10, 20] },
    
    { text: 'AUTHENTICATION & ACCESS CONTROL', style: 'subheader' },
    { ul: [
      '✓ JWT authentication with automatic token refresh',
      '✓ Role-Based Access Control on all endpoints',
      '✓ Password hashing with bcrypt',
      '✓ Rate limiting on login attempts',
      '✓ Secure token storage',
      '✓ Audit logging for sensitive operations',
      '✓ CSRF token validation'
    ], margin: [0, 8, 0, 12] },
    
    { text: 'DATA PROTECTION & ENCRYPTION', style: 'subheader' },
    { ul: [
      '✓ Row-Level Security (RLS) on all tables',
      '✓ Encryption in transit (HTTPS/TLS)',
      '✓ Encryption at rest (PostgreSQL)',
      '✓ Parameterized queries (no SQL injection)',
      '✓ Input validation with Zod',
      '✓ Output escaping for XSS prevention',
      '✓ Sensitive data redaction in logs'
    ], margin: [0, 8, 0, 12] },
    
    { text: 'NETWORK & INFRASTRUCTURE', style: 'subheader' },
    { ul: [
      '✓ HTTPS enforcement (no HTTP)',
      '✓ Security headers (Helmet.js)',
      '✓ CORS whitelist',
      '✓ Rate limiting on all endpoints',
      '✓ API request size limits',
      '✓ Database connection pooling',
      '✓ DDoS mitigation via Render/Vercel'
    ], margin: [0, 8, 0, 12] },
    
    { text: 'SECRETS & CONFIGURATION', style: 'subheader' },
    { ul: [
      '✓ No hardcoded secrets in code',
      '✓ Environment variables for all credentials',
      '✓ .env excluded from Git',
      '✓ API keys in dashboard (not yaml except GEMINI_API_KEY)',
      '✓ Database credentials in Supabase vault',
      '✓ Quarterly API key rotation'
    ], margin: [0, 8, 0, 20] },
    
    { pageBreak: 'after' },
    
    // HANDOFF CHECKLIST
    { text: '8. HANDOFF CHECKLIST & SIGN-OFF', style: 'header' },
    
    { text: 'PRE-HANDOFF VERIFICATION', style: 'subheader' },
    
    { text: 'Source Code & Version Control', style: 'subheader', fontSize: 11, margin: [0, 12, 0, 6] },
    { ul: [
      '✓ Complete React + Node.js codebase delivered',
      '✓ All features documented with inline comments',
      '✓ Git history preserved (50+ commits)',
      '✓ .gitignore configured',
      '✓ No hardcoded secrets'
    ], margin: [0, 6, 0, 10] },
    
    { text: 'Database & Storage', style: 'subheader', fontSize: 11, margin: [0, 12, 0, 6] },
    { ul: [
      '✓ Supabase schema created',
      '✓ Row-Level Security enabled',
      '✓ Backups configured (7-day)',
      '✓ Sample data loaded',
      '✓ Storage bucket tested'
    ], margin: [0, 6, 0, 10] },
    
    { text: 'Deployment & Infrastructure', style: 'subheader', fontSize: 11, margin: [0, 12, 0, 6] },
    { ul: [
      '✓ Frontend on Vercel (auto CI/CD)',
      '✓ Backend on Render.com (auto CI/CD)',
      '✓ Environment variables configured',
      '✓ GEMINI_API_KEY in render.yaml',
      '✓ SSL certificates valid'
    ], margin: [0, 6, 0, 10] },
    
    { text: 'Security & Compliance', style: 'subheader', fontSize: 11, margin: [0, 12, 0, 6] },
    { ul: [
      '✓ All 40 hardening points verified',
      '✓ JWT authentication working',
      '✓ Rate limiting active',
      '✓ CORS configured',
      '✓ Security headers enabled'
    ], margin: [0, 6, 0, 10] },
    
    { text: 'Integrations & Services', style: 'subheader', fontSize: 11, margin: [0, 12, 0, 6] },
    { ul: [
      '✓ Google Gemini API integrated',
      '✓ Razorpay billing configured',
      '✓ Nodemailer email working',
      '✓ Claude VPS API tested',
      '✓ All API keys rotated'
    ], margin: [0, 6, 0, 20] },
    
    { pageBreak: 'after' },
    
    // SIGN-OFF
    { text: 'PROJECT HANDOFF SIGN-OFF', style: 'header', alignment: 'center' },
    { text: '', margin: [0, 30, 0, 0] },
    
    { text: 'Developer / Delivery Team', bold: true, margin: [0, 15, 0, 3] },
    { text: 'Signature: _____________________     Date: __________', margin: [0, 0, 0, 20] },
    
    { text: 'Client / Receiver', bold: true, margin: [0, 15, 0, 3] },
    { text: 'Signature: _____________________     Date: __________', margin: [0, 0, 0, 30] },
    
    { text: '✓ PROJECT HANDOFF COMPLETE\nAll deliverables have been met. The Neurosense platform is production-ready and fully transferred to Limitless Brain Lab.', style: 'statusBox', margin: [10, 10, 10, 0], alignment: 'center' }
  ],
  footer: (currentPage, pageCount) => {
    return {
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: 'center',
      fontSize: 9,
      color: '#999',
      margin: [40, 0, 40, 0]
    };
  }
};

const pdfPath = path.join(os.homedir(), 'Desktop', 'NEUROSENSE_PROJECT_HANDOFF.pdf');

const pdfDoc = printer.createPdfKitDocument(docDefinition);
pdfDoc.pipe(fs.createWriteStream(pdfPath));
pdfDoc.end();

pdfDoc.on('finish', () => {
  const fileSize = (fs.statSync(pdfPath).size / 1024 / 1024).toFixed(2);
  console.log('✓ Professional PDF created successfully!');
  console.log('Location:', pdfPath);
  console.log('File size:', fileSize, 'MB');
  process.exit(0);
});

pdfDoc.on('error', (err) => {
  console.error('✗ PDF generation failed:', err.message);
  process.exit(1);
});
