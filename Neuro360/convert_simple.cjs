const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');
const os = require('os');

const htmlFile = './simple_handoff.html';
const pdfFile = path.join(os.homedir(), 'Desktop', 'NEUROSENSE_PROJECT_HANDOFF.pdf');

const html = fs.readFileSync(htmlFile, 'utf8');

const options = {
  format: 'A4',
  orientation: 'portrait',
  margin: ['10mm', '10mm', '10mm', '10mm'],
  timeout: 60000,
  quality: 95,
  type: 'pdf'
};

pdf.create(html, options).toFile(pdfFile, (err, res) => {
  if (err) {
    console.error('✗ PDF generation failed:', err.message);
    process.exit(1);
  }
  const fileSize = (fs.statSync(res.filename).size / 1024 / 1024).toFixed(2);
  console.log('✓ Professional PDF created successfully!');
  console.log('Location:', res.filename);
  console.log('File size:', fileSize, 'MB');
  process.exit(0);
});
