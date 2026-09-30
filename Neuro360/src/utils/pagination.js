export const paginate = (items, limit) => items.slice(0, limit);

export const groupPatientsByClinic = (patients, clinics) => {
  const clinicsById = new Map(clinics.map(clinic => [clinic.id, clinic]));
  const groups = new Map();

  patients.forEach(patient => {
    const clinic = clinicsById.get(patient.clinicId);
    if (!clinic) return;
    if (!groups.has(clinic.id)) groups.set(clinic.id, { clinic, patients: [] });
    groups.get(clinic.id).patients.push(patient);
  });

  return [...groups.values()];
};
