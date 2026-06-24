// Care Program entitlements — grant a patient free access to exactly the frequencies
// and meditations their Customized Care Program deep-links to.
//
// Why only frequencies + meditations: in the care program (CustomizedCareProgramSection
// in PatientDashboard.jsx) mantras/chants route to /dashboard/ans-reset and videos /
// Yoga Nidra are already ungated, so they need no grant. The only paywalled items the
// program points to are frequency packs (frequency_purchases) and meditation packs
// (meditation_purchases), and they are reached ONLY via the protocol's `binaural` field
// (parsed by getBinauralLink). This module mirrors that parser so the grant matches
// precisely what the patient can click.

import { getCareProtocol } from './careProtocolLookup';
import KSB_27_PROTOCOLS_P123 from './ksb27ProtocolsP123';

// Parse a care-program `binaural` string into the purchasable pack it deep-links to.
// Mirror of getBinauralLink in PatientDashboard.jsx (CustomizedCareProgramSection) —
// keep the two in sync. gamma & solfeggio 852/963 are gated on the meditations page;
// the remaining solfeggio + brainwave packs are gated on the frequencies page.
export const parseCareProgramRef = (value) => {
  if (!value || typeof value !== 'string') return null;
  const val = value.toLowerCase();
  if (val.includes('gamma')) return { kind: 'meditation', id: 'gamma' };
  if (val.includes('alpha')) return { kind: 'frequency', id: 'alpha' };
  if (val.includes('beta')) return { kind: 'frequency', id: 'beta' };
  if (val.includes('theta')) return { kind: 'frequency', id: 'theta' };
  if (val.includes('delta')) return { kind: 'frequency', id: 'delta' };
  const hzMatch = val.match(/(\d{3})\s*hz/);
  if (hzMatch) {
    const hz = hzMatch[1];
    if (['285', '396', '417', '528', '639', '741'].includes(hz)) return { kind: 'frequency', id: `solfeggio_${hz}` };
    if (['852', '963'].includes(hz)) return { kind: 'meditation', id: `solfeggio_${hz}` };
  }
  return null; // e.g. "Solfeggio 174 Hz" has no purchasable pack — nothing to grant
};

// Collect the frequency/meditation pack ids the patient's care program references,
// from the patient's algorithm_results data. Returns empty sets when the scores are
// insufficient to resolve a KSB protocol (graceful no-op).
export const getCareProgramContentIds = (algorithmResultsData) => {
  const empty = { frequencyPackIds: [], meditationIds: [] };
  const protocol = getCareProtocol(algorithmResultsData);
  if (!protocol) return empty;

  // The dashboard shows per-parameter modalities from KSB_27_PROTOCOLS_P123[code]
  // (P1/P2/P3 sub-protocols) and falls back to the flat combo fields. Scan both so the
  // grant covers the full union the patient could see across every parameter tab.
  const binaurals = [];
  if (protocol.binaural) binaurals.push(protocol.binaural);
  const nested = KSB_27_PROTOCOLS_P123[protocol.code];
  if (nested) {
    Object.values(nested).forEach((section) => {
      if (section && typeof section === 'object' && section.binaural) binaurals.push(section.binaural);
    });
  }

  const freq = new Set();
  const med = new Set();
  binaurals.forEach((b) => {
    const ref = parseCareProgramRef(b);
    if (!ref) return;
    if (ref.kind === 'frequency') freq.add(ref.id);
    else med.add(ref.id);
  });
  return { frequencyPackIds: [...freq], meditationIds: [...med] };
};

// Grant the patient free access to exactly the frequencies/meditations their care
// program shows. Idempotent (only inserts ids not already present). Never throws — a
// grant failure must not break report generation.
export const grantCareProgramAccess = async (supabase, patientEmail, algorithmResultsData) => {
  const result = { frequencies: 0, meditations: 0 };
  try {
    if (!supabase || !patientEmail) return result;
    const email = patientEmail.toLowerCase().trim();
    const { frequencyPackIds, meditationIds } = getCareProgramContentIds(algorithmResultsData);
    if (frequencyPackIds.length === 0 && meditationIds.length === 0) return result;

    // ---- Frequencies (frequency_purchases) ----
    if (frequencyPackIds.length > 0) {
      const existing = new Set();
      const { data } = await supabase
        .from('frequency_purchases')
        .select('pack_id, frequency_id')
        .eq('patient_email', email);
      (data || []).forEach((r) => {
        if (r.pack_id) existing.add(r.pack_id);
        if (r.frequency_id) existing.add(r.frequency_id);
      });
      const missing = frequencyPackIds.filter((id) => !existing.has(id));
      if (missing.length > 0) {
        // Minimal guaranteed columns only (live schema has drifted from migrations).
        const rows = missing.map((id) => ({
          patient_email: email,
          pack_id: id,
          purchased_at: new Date().toISOString()
        }));
        const { error } = await supabase.from('frequency_purchases').insert(rows);
        if (error) console.warn('grantCareProgramAccess frequencies insert:', error.message);
        else result.frequencies = rows.length;
      }
    }

    // ---- Meditations (meditation_purchases) ----
    if (meditationIds.length > 0) {
      const existing = new Set();
      const { data } = await supabase
        .from('meditation_purchases')
        .select('meditation_id')
        .eq('patient_email', email);
      (data || []).forEach((r) => { if (r.meditation_id) existing.add(r.meditation_id); });
      const missing = meditationIds.filter((id) => !existing.has(id));
      if (missing.length > 0) {
        const rows = missing.map((id) => ({
          patient_email: email,
          meditation_id: id,
          purchased_at: new Date().toISOString()
        }));
        const { error } = await supabase.from('meditation_purchases').insert(rows);
        if (error) console.warn('grantCareProgramAccess meditations insert:', error.message);
        else result.meditations = rows.length;
      }
    }
  } catch (e) {
    console.warn('grantCareProgramAccess failed (non-blocking):', e?.message || e);
  }
  return result;
};
