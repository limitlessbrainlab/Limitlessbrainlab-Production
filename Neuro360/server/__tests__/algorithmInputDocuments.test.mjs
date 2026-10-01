import assert from 'node:assert/strict';
import { algorithmInputDocuments } from '../../src/utils/algorithmInputDocuments.js';

const documents = algorithmInputDocuments([{ 
  patientId: 'patient-1',
  uploadedAt: '2026-10-01T00:00:00.000Z',
  reportData: {
    source: 'algorithm_results',
    inputData: {
      eyesOpenUrl: 'https://storage.example/eo.pdf',
      eyesOpenFile: 'EO.pdf',
      eyesClosedUrl: 'https://storage.example/ec.pdf',
      eyesClosedFile: 'EC.pdf',
    },
  },
}], 'patient-1');

assert.deepEqual(documents.map(({ typeLabel, fileName, url }) => ({ typeLabel, fileName, url })), [
  { typeLabel: 'Eyes Open QEEG PDF', fileName: 'EO.pdf', url: 'https://storage.example/eo.pdf' },
  { typeLabel: 'Eyes Closed QEEG PDF', fileName: 'EC.pdf', url: 'https://storage.example/ec.pdf' },
]);
console.log('algorithmInputDocuments.test.mjs: ok');
