const fs = require('fs');
const path = require('path');
const PDFDocument = require('../server/node_modules/pdfkit');

const outDir = path.join(__dirname, '..', 'docs');
const outPath = path.join(outDir, 'AI-vs-No-AI-Implementation-Comparison.pdf');

fs.mkdirSync(outDir, { recursive: true });

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 48, bottom: 48, left: 54, right: 54 },
  info: {
    Title: 'AI vs No-AI Implementation Comparison',
    Author: 'Limitless Brain Lab / Neuro360',
    Subject: 'AI-enabled and fully deterministic implementation options',
  },
});

doc.pipe(fs.createWriteStream(outPath));

const colors = {
  navy: '#24304f',
  blue: '#2b6cb0',
  teal: '#0f766e',
  amber: '#b7791f',
  red: '#c53030',
  text: '#1f2937',
  muted: '#5b6472',
  line: '#d7dce4',
  paleBlue: '#eef5ff',
  paleGreen: '#ecfdf5',
  paleAmber: '#fffbeb',
};

function heading(text) {
  doc.moveDown(0.7);
  doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.navy).text(text);
  doc.moveTo(doc.x, doc.y + 3).lineTo(541, doc.y + 3).strokeColor(colors.line).lineWidth(0.8).stroke();
  doc.moveDown(0.6);
}

function body(text, options = {}) {
  doc.font('Helvetica').fontSize(options.size || 9.7).fillColor(options.color || colors.text)
    .text(text, { lineGap: options.lineGap ?? 2, align: options.align || 'left' });
}

function bullet(text) {
  const y = doc.y;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.blue).text('-', 58, y, { width: 10 });
  doc.font('Helvetica').fontSize(9.5).fillColor(colors.text).text(text, 72, y, { width: 468, lineGap: 2 });
  doc.moveDown(0.25);
}

function pill(text, x, y, color) {
  doc.roundedRect(x, y, 112, 22, 4).fill(color);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff').text(text, x, y + 7, {
    width: 112,
    align: 'center',
  });
}

function twoColumnBox(leftTitle, leftLines, rightTitle, rightLines) {
  const startY = doc.y;
  const colW = 238;
  const gap = 16;
  const leftX = 54;
  const rightX = leftX + colW + gap;
  const boxH = 186;

  doc.roundedRect(leftX, startY, colW, boxH, 6).fill(colors.paleBlue).strokeColor(colors.line).stroke();
  doc.roundedRect(rightX, startY, colW, boxH, 6).fill(colors.paleGreen).strokeColor(colors.line).stroke();

  doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.blue).text(leftTitle, leftX + 12, startY + 12, { width: colW - 24 });
  let y = startY + 38;
  leftLines.forEach((line) => {
    doc.font('Helvetica').fontSize(8.8).fillColor(colors.text).text(line, leftX + 16, y, {
      width: colW - 28,
      lineGap: 1.5,
    });
    y = doc.y + 6;
  });

  doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.teal).text(rightTitle, rightX + 12, startY + 12, { width: colW - 24 });
  y = startY + 38;
  rightLines.forEach((line) => {
    doc.font('Helvetica').fontSize(8.8).fillColor(colors.text).text(line, rightX + 16, y, {
      width: colW - 28,
      lineGap: 1.5,
    });
    y = doc.y + 6;
  });

  doc.y = startY + boxH + 16;
}

function qualityTable(rows) {
  const x = 54;
  let y = doc.y;
  const widths = [132, 170, 170];
  const rowH = 42;

  doc.rect(x, y, widths.reduce((a, b) => a + b, 0), 24).fill(colors.navy);
  doc.font('Helvetica-Bold').fontSize(8.7).fillColor('#ffffff');
  doc.text('Area', x + 8, y + 8, { width: widths[0] - 12 });
  doc.text('With AI', x + widths[0] + 8, y + 8, { width: widths[1] - 12 });
  doc.text('Without AI', x + widths[0] + widths[1] + 8, y + 8, { width: widths[2] - 12 });
  y += 24;

  rows.forEach((row, index) => {
    const fill = index % 2 === 0 ? '#ffffff' : '#f8fafc';
    doc.rect(x, y, widths.reduce((a, b) => a + b, 0), rowH).fill(fill).strokeColor(colors.line).stroke();
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.text)
      .text(row.area, x + 8, y + 8, { width: widths[0] - 12, lineGap: 1 });
    doc.font('Helvetica').fontSize(8.2).fillColor(colors.text)
      .text(row.ai, x + widths[0] + 8, y + 8, { width: widths[1] - 12, lineGap: 1 });
    doc.text(row.noAi, x + widths[0] + widths[1] + 8, y + 8, { width: widths[2] - 12, lineGap: 1 });
    doc.moveTo(x + widths[0], y).lineTo(x + widths[0], y + rowH).strokeColor(colors.line).stroke();
    doc.moveTo(x + widths[0] + widths[1], y).lineTo(x + widths[0] + widths[1], y + rowH).strokeColor(colors.line).stroke();
    y += rowH;
  });

  doc.y = y + 10;
}

function footer(page) {
  doc.font('Helvetica').fontSize(7.5).fillColor(colors.muted)
    .text(`AI vs No-AI Implementation Comparison | Page ${page}`, 54, 810, { width: 487, align: 'center' });
}

doc.rect(0, 0, 595.28, 96).fill(colors.navy);
doc.font('Helvetica-Bold').fontSize(22).fillColor('#ffffff')
  .text('AI vs No-AI Implementation Comparison', 54, 34, { width: 487 });
doc.font('Helvetica').fontSize(10.5).fillColor('#dbeafe')
  .text('Neuro360 / Limitless Brain Lab report generation and scoring pipeline', 54, 64);

doc.y = 118;
pill('CURRENT: AI ASSISTED', 54, 108, colors.blue);
pill('OPTION: FULL NO-AI', 178, 108, colors.teal);

heading('Executive Summary');
body('Yes, the platform can be rebuilt to run without AI. The most important point is that the core 7-parameter brain score calculation is already deterministic code, not an LLM. Removing AI will not inherently reduce score quality as long as the input data is parsed correctly.');
doc.moveDown(0.45);
body('The largest quality risk is not scoring. It is data extraction from varied QEEG PDFs. AI currently helps read tables from PDFs that may have inconsistent layout. A no-AI version should prefer structured CSV/XLSX/qEEG exports or enforce a strict PDF template.');

heading('Current AI-Enabled Pipeline vs Fully No-AI Pipeline');
twoColumnBox(
  'With AI Today',
  [
    '1. QEEG PDFs are uploaded by clinic/admin users.',
    '2. Gemini multimodal extracts numeric EEG table values from PDFs.',
    '3. Local JavaScript formulas calculate the seven brain parameters.',
    '4. Gemini/Claude/OpenAI-style services write summaries, interpretations, and narrative blocks.',
    '5. Code templates render the final PDFs and dashboards.',
  ],
  'Without AI',
  [
    '1. Accept structured EEG exports: CSV, XLSX, JSON, or a locked PDF format.',
    '2. Use deterministic parsers and validation rules to read the input data.',
    '3. Keep the same local JavaScript formulas for all seven brain parameters.',
    '4. Use a rules engine and curated copy library for summaries and care plans.',
    '5. Render PDFs from fixed templates with no external model dependency.',
  ]
);

heading('Quality Impact');
qualityTable([
  {
    area: 'Score calculation',
    ai: 'AI is not the source of truth. Scores are calculated by local formulas after extraction.',
    noAi: 'No quality loss if parsed source values are correct. This is the safest part to keep deterministic.',
  },
  {
    area: 'QEEG PDF extraction',
    ai: 'Handles messy or varied report layouts better, but adds cost, quota limits, and model risk.',
    noAi: 'Excellent with structured exports. Risk increases if arbitrary PDFs must be supported.',
  },
  {
    area: 'Report language',
    ai: 'More natural, varied, and personalized patient-facing text.',
    noAi: 'Can feel templated unless we build a strong content library by score, brain type, and pattern.',
  },
  {
    area: 'PDF design',
    ai: 'AI suggests content/structure, but the actual rendering is mostly code/templates.',
    noAi: 'Little to no quality loss. Design can remain polished through coded templates.',
  },
  {
    area: 'Reliability and auditability',
    ai: 'External dependencies, model drift, quota failures, and harder reproducibility.',
    noAi: 'Higher repeatability, easier compliance review, simpler debugging.',
  },
]);

heading('Recommendation');
bullet('Do not use AI for score calculation. Keep all scoring, thresholds, classifications, and brain type mapping deterministic and auditable.');
bullet('If removing AI completely, require structured QEEG input or a locked PDF export format. This protects extraction quality.');
bullet('Replace AI-generated narrative with a curated template system: score level, sub-metric pattern, brain type, and doctor-approved wording.');
bullet('Keep PDF layout as code. This avoids quality loss in design while making output consistent.');

doc.addPage();
footer(1);

doc.rect(0, 0, 595.28, 58).fill(colors.navy);
doc.font('Helvetica-Bold').fontSize(18).fillColor('#ffffff')
  .text('Implementation Plan Without AI', 54, 22, { width: 487 });
doc.y = 82;

heading('What To Remove');
bullet('Gemini PDF extraction path for arbitrary QEEG PDFs.');
bullet('Gemini report-structure generation for summaries, interpretations, recommendations, and layout suggestions.');
bullet('Claude/Nexaproc narrative generation for 12-page performance reports.');
bullet('OpenAI legacy/fallback report generation routes if they are no longer needed.');

heading('What To Build Instead');
bullet('Structured import contract: CSV/XLSX/JSON schema with required EO/EC, absolute/relative, channel, band, and alpha peak fields.');
bullet('Parser validation: missing-channel checks, relative-power sum checks, numeric bounds, and clear error messages before scoring.');
bullet('Rule-based narrative engine: doctor-approved copy fragments selected by score, classification, sub-metric value, and brain type.');
bullet('Template versioning: every report should record algorithm version, template version, parser version, and source file hash.');
bullet('Golden test cases: known reports with expected extracted values, scores, classifications, and rendered PDF snapshots.');

heading('Expected Quality Change');
doc.roundedRect(54, doc.y, 487, 106, 6).fill(colors.paleAmber).strokeColor(colors.line).stroke();
const boxY = doc.y + 14;
doc.font('Helvetica-Bold').fontSize(10.5).fillColor(colors.amber).text('Best-case no-AI quality', 70, boxY);
doc.font('Helvetica').fontSize(9.2).fillColor(colors.text)
  .text('Equal or better than the AI version when input files are structured. Scores become more repeatable, failures become easier to debug, and the system no longer depends on model quota or network availability.', 70, boxY + 18, { width: 454, lineGap: 2 });
doc.font('Helvetica-Bold').fontSize(10.5).fillColor(colors.red).text('Main quality risk', 70, boxY + 62);
doc.font('Helvetica').fontSize(9.2).fillColor(colors.text)
  .text('If clinics continue uploading arbitrary PDFs, deterministic extraction may miss values unless we build format-specific parsers for every PDF layout.', 70, boxY + 80, { width: 454, lineGap: 2 });
doc.y += 126;

heading('Bottom Line');
body('A fully no-AI product is realistic. The clinical scoring quality should not suffer if the data input is controlled. Report prose may become less personalized at first, but this can be solved with well-written templates. The biggest decision is whether the business wants flexible PDF ingestion, where AI helps, or a stricter structured-data workflow, where no-AI is stronger.');

footer(2);
doc.end();

doc.on('end', () => {
  console.log(outPath);
});
