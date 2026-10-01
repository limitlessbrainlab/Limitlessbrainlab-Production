const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '../services/pdf/yourNumbersPage.js'), 'utf8');

assert.match(source, /path\.join\(getReportUploadDir\(\), 'temp'\)/);

console.log('yourNumbersVercelTempDir: ok');
