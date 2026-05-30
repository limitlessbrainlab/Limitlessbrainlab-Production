const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');

const htmlFile = './NEUROSENSE_PROJECT_HANDOFF.html';
const pdfFile = path.expandUser('~/Desktop/NEUROSENSE_PROJECT_HANDOFF.pdf');

const html = fs.readFileSync(htmlFile, 'utf8');

const options = {
  format: 'A4',
  orientation: 'portrait',
  margin: '10mm',
  timeout: 60000,
  phantomPath: undefined,
  quality: 95
};

pdf.create(html, options).toFile(pdfFile, (err, res) => {
  if (err) {
    console.error('PDF generation failed:', err);
    process.exit(1);
  }
  console.log('✓ PDF created successfully!');
  console.log('Location:', res.filename);
  console.log('File size:', (fs.statSync(res.filename).size / 1024).toFixed(2), 'KB');
  process.exit(0);
});
