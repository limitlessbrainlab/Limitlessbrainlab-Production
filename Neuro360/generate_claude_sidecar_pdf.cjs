const pdfmake = require('pdfmake');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROBOTO = path.join(__dirname, 'node_modules/pdfmake/build/fonts/Roboto');
pdfmake.fonts = {
  Roboto: {
    normal: path.join(ROBOTO, 'Roboto-Regular.ttf'),
    bold: path.join(ROBOTO, 'Roboto-Medium.ttf'),
    italics: path.join(ROBOTO, 'Roboto-Italic.ttf'),
    bolditalics: path.join(ROBOTO, 'Roboto-MediumItalic.ttf')
  }
};


const PRIMARY = '#667eea';
const DARK = '#1a1a2e';
const GREEN = '#27ae60';
const RED = '#e74c3c';
const LIGHT_GREEN = '#eafaf1';
const LIGHT_RED = '#fdf0ef';
const LIGHT_PURPLE = '#f0f1fe';
const GRAY = '#666666';

const docDefinition = {
  pageSize: 'A4',
  pageMargins: [50, 60, 50, 60],
  defaultStyle: { font: 'Roboto', fontSize: 10.5, lineHeight: 1.5, color: '#222222' },

  styles: {
    coverTitle: {
      fontSize: 30,
      bold: true,
      color: '#ffffff',
      alignment: 'center',
      marginBottom: 6
    },
    coverSubtitle: {
      fontSize: 15,
      color: '#d0d8ff',
      alignment: 'center',
      marginBottom: 4
    },
    coverDate: {
      fontSize: 10,
      color: '#a0b0e0',
      alignment: 'center'
    },
    sectionHeader: {
      fontSize: 14,
      bold: true,
      color: PRIMARY,
      marginTop: 22,
      marginBottom: 8
    },
    body: {
      fontSize: 10.5,
      lineHeight: 1.6,
      color: '#333333'
    },
    tableHeader: {
      bold: true,
      fillColor: PRIMARY,
      color: '#ffffff',
      alignment: 'center',
      fontSize: 10,
      margin: [4, 6, 4, 6]
    },
    tableCell: {
      fontSize: 10,
      margin: [4, 5, 4, 5]
    },
    benefitTitle: {
      fontSize: 12,
      bold: true,
      color: DARK,
      marginBottom: 4
    },
    benefitBody: {
      fontSize: 10,
      color: '#444444',
      lineHeight: 1.5
    },
    footer: {
      fontSize: 8,
      color: '#999999',
      alignment: 'center'
    }
  },

  content: [

    // ─── COVER BLOCK ────────────────────────────────────────────────────────────
    {
      canvas: [
        {
          type: 'rect',
          x: -50, y: -60,
          w: 600, h: 220,
          color: DARK,
          r: 0
        }
      ],
      margin: [0, 0, 0, 0]
    },
    {
      text: 'Claude Sidecar vs Claude API',
      style: 'coverTitle',
      margin: [0, -195, 0, 6]
    },
    {
      text: 'Why We Chose Claude Sidecar for Production',
      style: 'coverSubtitle'
    },
    {
      text: 'Limitless Brain Lab  |  Technical Decision Document  |  June 2026',
      style: 'coverDate',
      margin: [0, 0, 0, 80]
    },

    // ─── OVERVIEW ───────────────────────────────────────────────────────────────
    { text: '1. Overview', style: 'sectionHeader' },
    {
      text: 'Our platform evaluated two integration approaches for adding Claude AI capabilities: calling Anthropic\'s hosted Claude API directly over HTTPS, or running a self-hosted Claude sidecar on a VPS and routing all AI requests through it.\n\nAfter evaluating both approaches against our production requirements — reliability, cost predictability, usage limits, and memory management — we chose the Claude Sidecar model. This document summarises the four decisive factors behind that choice.',
      style: 'body',
      margin: [0, 0, 0, 6]
    },

    // ─── COMPARISON TABLE ───────────────────────────────────────────────────────
    { text: '2. Feature Comparison', style: 'sectionHeader' },
    {
      table: {
        headerRows: 1,
        widths: ['30%', '33%', '37%'],
        body: [
          [
            { text: 'Factor', style: 'tableHeader' },
            { text: 'Claude API (Direct)', style: 'tableHeader' },
            { text: 'Claude Sidecar (Self-Hosted)', style: 'tableHeader' }
          ],
          [
            { text: 'Usage Model', style: 'tableCell', bold: true },
            { text: 'Pay-per-call (tokens billed per request)', style: 'tableCell' },
            { text: 'Unlimited calls — billed by VPS uptime only', style: 'tableCell', color: GREEN }
          ],
          [
            { text: 'Credit Limit', style: 'tableCell', bold: true },
            { text: 'Hard quota; throttled or blocked when credits run out', style: 'tableCell', color: RED },
            { text: 'No credit limit — always available', style: 'tableCell', color: GREEN }
          ],
          [
            { text: 'Memory Management', style: 'tableCell', bold: true },
            { text: 'API-level memory may leak across sessions; state held remotely', style: 'tableCell', color: RED },
            { text: 'Local process — clean memory on restart, zero state leakage', style: 'tableCell', color: GREEN }
          ],
          [
            { text: 'Infrastructure Cost', style: 'tableCell', bold: true },
            { text: 'Variable — scales unpredictably with request volume', style: 'tableCell', color: RED },
            { text: 'Fixed low VPS cost (~$5-15/mo); predictable and flat', style: 'tableCell', color: GREEN }
          ],
          [
            { text: 'Scalability', style: 'tableCell', bold: true },
            { text: 'Scales automatically but costs grow linearly', style: 'tableCell' },
            { text: 'Scales by adding VPS instances; cost remains controlled', style: 'tableCell' }
          ],
          [
            { text: 'Availability', style: 'tableCell', bold: true },
            { text: 'Dependent on Anthropic API uptime & rate limits', style: 'tableCell' },
            { text: 'Self-controlled; no external quota interruptions', style: 'tableCell', color: GREEN }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#dddddd',
        vLineColor: () => '#dddddd',
        fillColor: (rowIndex) => rowIndex % 2 === 1 ? '#fafafa' : null
      },
      margin: [0, 0, 0, 6]
    },

    // ─── KEY BENEFITS ────────────────────────────────────────────────────────────
    { text: '3. Key Benefits of Claude Sidecar', style: 'sectionHeader' },
    {
      text: 'The following four factors were decisive in choosing the sidecar approach:',
      style: 'body',
      margin: [0, 0, 0, 10]
    },

    // Benefit 1
    {
      table: {
        widths: ['8%', '92%'],
        body: [[
          {
            text: '1',
            fontSize: 18,
            bold: true,
            color: '#ffffff',
            fillColor: PRIMARY,
            alignment: 'center',
            margin: [0, 8, 0, 8]
          },
          {
            stack: [
              { text: 'Unlimited Usage — No Per-Call Costs', style: 'benefitTitle' },
              {
                text: 'With the direct Claude API, every request consumes credits. A busy production app processing hundreds of QEEG reports per day can burn through quota quickly, leading to unexpected bills or throttling. With the sidecar, the AI process runs locally on a VPS — every call is free after the fixed monthly VPS fee. You can call Claude as many times as needed without worrying about per-call credit consumption.',
                style: 'benefitBody'
              }
            ],
            fillColor: LIGHT_PURPLE,
            margin: [12, 8, 10, 8]
          }
        ]]
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 8]
    },

    // Benefit 2
    {
      table: {
        widths: ['8%', '92%'],
        body: [[
          {
            text: '2',
            fontSize: 18,
            bold: true,
            color: '#ffffff',
            fillColor: GREEN,
            alignment: 'center',
            margin: [0, 8, 0, 8]
          },
          {
            stack: [
              { text: 'No Credit Limit — Always Available', style: 'benefitTitle' },
              {
                text: 'The Anthropic API enforces hard credit limits. When a credit cap is hit, all AI-powered features fail until the account is topped up. This creates a critical availability risk for patient-facing features. The Claude Sidecar has no credit cap — it runs until the VPS is live, making availability entirely within our control. No quota exhaustion, no throttling, no surprise downtime for patients during report generation.',
                style: 'benefitBody'
              }
            ],
            fillColor: LIGHT_GREEN,
            margin: [12, 8, 10, 8]
          }
        ]]
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 8]
    },

    // Benefit 3
    {
      table: {
        widths: ['8%', '92%'],
        body: [[
          {
            text: '3',
            fontSize: 18,
            bold: true,
            color: '#ffffff',
            fillColor: '#e67e22',
            alignment: 'center',
            margin: [0, 8, 0, 8]
          },
          {
            stack: [
              { text: 'No API Memory Leaks — Clean Session Isolation', style: 'benefitTitle' },
              {
                text: 'When routing requests through a shared API endpoint, session context and memory can bleed between requests if not carefully managed at the API layer. This can cause AI responses to be contaminated by previous patients\' data — a critical risk in a medical platform. With the Claude Sidecar running as a local process, memory is fully isolated per restart. There is no remote state, no cross-session contamination, and the process can be restarted clean at any time without service interruption.',
                style: 'benefitBody'
              }
            ],
            fillColor: '#fef9f0',
            margin: [12, 8, 10, 8]
          }
        ]]
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 8]
    },

    // Benefit 4
    {
      table: {
        widths: ['8%', '92%'],
        body: [[
          {
            text: '4',
            fontSize: 18,
            bold: true,
            color: '#ffffff',
            fillColor: '#8e44ad',
            alignment: 'center',
            margin: [0, 8, 0, 8]
          },
          {
            stack: [
              { text: 'Low VPS Hosting Cost — Predictable & Flat Pricing', style: 'benefitTitle' },
              {
                text: 'Claude API billing grows linearly with usage — more reports, higher bill. A VPS costs a fixed $5-15/month regardless of how many AI calls are made. For a platform generating hundreds of QEEG reports and AI analyses per month, the sidecar model is 5-10x cheaper than equivalent API usage at scale. The cost is entirely predictable, appears as a fixed infrastructure line item, and does not spike during heavy usage periods.',
                style: 'benefitBody'
              }
            ],
            fillColor: '#f9f0fe',
            margin: [12, 8, 10, 8]
          }
        ]]
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 16]
    },

    // ─── COST SUMMARY TABLE ──────────────────────────────────────────────────────
    { text: '4. Cost at Scale', style: 'sectionHeader' },
    {
      table: {
        headerRows: 1,
        widths: ['28%', '34%', '38%'],
        body: [
          [
            { text: 'Monthly Usage', style: 'tableHeader' },
            { text: 'Claude API (estimated)', style: 'tableHeader' },
            { text: 'Claude Sidecar (VPS)', style: 'tableHeader' }
          ],
          [
            { text: '100 reports/month', style: 'tableCell' },
            { text: '~$15 - $40', style: 'tableCell', alignment: 'center' },
            { text: '$5 - $15 (flat)', style: 'tableCell', alignment: 'center', bold: true, color: GREEN }
          ],
          [
            { text: '500 reports/month', style: 'tableCell' },
            { text: '~$75 - $200', style: 'tableCell', alignment: 'center' },
            { text: '$5 - $15 (flat)', style: 'tableCell', alignment: 'center', bold: true, color: GREEN }
          ],
          [
            { text: '2,000 reports/month', style: 'tableCell' },
            { text: '~$300 - $800+', style: 'tableCell', alignment: 'center', color: RED },
            { text: '$5 - $15 (flat)', style: 'tableCell', alignment: 'center', bold: true, color: GREEN }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#dddddd',
        vLineColor: () => '#dddddd',
        fillColor: (rowIndex) => rowIndex % 2 === 1 ? '#fafafa' : null
      },
      margin: [0, 0, 0, 6]
    },
    {
      text: '* API cost estimates based on Claude Sonnet-class model at ~1,000-3,000 tokens per report. Actual costs vary by model tier and token usage.',
      fontSize: 8,
      color: GRAY,
      italics: true,
      margin: [0, 4, 0, 0]
    },

    // ─── CONCLUSION ──────────────────────────────────────────────────────────────
    { text: '5. Conclusion', style: 'sectionHeader' },
    {
      text: 'The Claude Sidecar model gives us unlimited AI usage at a fixed low cost, eliminates credit quota risk, prevents cross-session memory contamination, and keeps AI infrastructure entirely under our operational control. For a production medical platform where reliability and cost predictability are non-negotiable, the sidecar is the clear architectural choice over direct API integration.',
      style: 'body',
      margin: [0, 0, 0, 12]
    },
    {
      table: {
        widths: ['*'],
        body: [[{
          text: 'Decision: Claude Sidecar on VPS\nStatus: Production — Active\nDocument: LBL-ARCH-001  |  Version 1.0  |  June 2026',
          alignment: 'center',
          fontSize: 10,
          bold: true,
          color: '#ffffff',
          fillColor: DARK,
          margin: [0, 10, 0, 10]
        }]]
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 0]
    }
  ],

  footer: (currentPage, pageCount) => ({
    text: `Limitless Brain Lab — Technical Architecture  |  Confidential  |  Page ${currentPage} of ${pageCount}`,
    style: 'footer',
    margin: [50, 10, 50, 0]
  })
};

const pdfPath = path.join(os.homedir(), 'Desktop', 'CLAUDE_SIDECAR_VS_API.pdf');

pdfmake.setLocalAccessPolicy(() => true);
pdfmake.setUrlAccessPolicy(() => false);

const doc = pdfmake.createPdf(docDefinition);
doc.write(pdfPath).then(() => {
  const fileSize = (fs.statSync(pdfPath).size / 1024).toFixed(1);
  console.log('PDF created successfully!');
  console.log('Location:', pdfPath);
  console.log('File size:', fileSize, 'KB');
  process.exit(0);
}).catch((err) => {
  console.error('Error generating PDF:', err.message);
  process.exit(1);
});
