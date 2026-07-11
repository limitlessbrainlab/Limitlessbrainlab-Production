/**
 * Live patient-name resolution for reports.
 *
 * A patient's name is snapshotted (frozen as a string) into report rows, titles,
 * descriptions and JSON at the moment a report is created. To make a rename in the
 * clinic/patient portal appear everywhere - including on OLD reports - we resolve
 * the CURRENT name from the live `patients` record (joined by patient_id) at render
 * time, and rewrite any frozen name embedded in a title/description string.
 *
 * This is display-only: it never mutates stored rows. Already-generated PDF files
 * (name baked into the file + filename) are intentionally left untouched.
 */

// Read a display name off a patient record, tolerating field-name variants.
export const getPatientDisplayName = (p) =>
  (p && (p.name || p.fullName || p.full_name)) || null;

// Build an id -> patient lookup map for O(1) joins.
export const indexPatientsById = (patients = []) => {
  const map = new Map();
  for (const p of patients) if (p && p.id != null) map.set(p.id, p);
  return map;
};

// The frozen (snapshot) name stored on a report at creation time.
export const getReportSnapshotName = (report) => {
  if (!report) return null;
  const rd = report.reportData || report.report_data || {};
  const name =
    report.patientName || report.patient_name ||
    rd.patientName || rd.patient_name || null;
  return name && name !== 'Unknown Patient' ? name : null;
};

// Replace an embedded snapshot name inside a title/description with the live name.
export const replaceNameInText = (text, snapshotName, liveName) => {
  if (!text || !snapshotName || !liveName || snapshotName === liveName) return text;
  return text.split(snapshotName).join(liveName);
};

// Resolve the current display name for a report, joining on patient_id first and
// falling back to the report's own snapshot name when the patient can't be resolved.
export const resolveReportPatientName = (report, patientsById) => {
  const pid = report && (report.patientId || report.patient_id ||
    report.reportData?.patientId || report.report_data?.patientId);
  const live = pid != null ? getPatientDisplayName(patientsById.get(pid)) : null;
  return live || getReportSnapshotName(report) || 'Unknown Patient';
};
