export function algorithmInputDocuments(reports = [], patientId) {
  const files = [];
  const seen = new Set();
  for (const report of reports) {
    if ((report.patientId || report.patient_id) !== patientId) continue;
    const data = report.reportData || report.report_data || {};
    if (data.source !== 'algorithm_results') continue;
    const input = data.inputData || data.input_data || {};
    for (const [type, typeLabel, urlKey, nameKey] of [
      ['eyesOpenPdf', 'Eyes Open QEEG PDF', 'eyesOpenUrl', 'eyesOpenFile'],
      ['eyesClosedPdf', 'Eyes Closed QEEG PDF', 'eyesClosedUrl', 'eyesClosedFile'],
    ]) {
      const url = input[urlKey];
      if (!url || seen.has(url)) continue;
      seen.add(url);
      files.push({
        type,
        typeLabel,
        fileName: input[nameKey] || typeLabel,
        url,
        uploadedAt: report.uploadedAt || report.createdAt || report.created_at,
        source: 'algorithm_results',
      });
    }
  }
  return files;
}
