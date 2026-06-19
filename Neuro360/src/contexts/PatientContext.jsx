import React, { createContext, useContext, useState, useEffect } from 'react';
import DatabaseService from '../services/databaseService';

const PatientContext = createContext();

export const usePatients = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
};

export const PatientProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [patientReports, setPatientReports] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastLoadedClinicId, setLastLoadedClinicId] = useState(null);

  // Load patients for a specific clinic
  const loadPatientsForClinic = async (clinicId, forceReload = false) => {
    if (!clinicId) {
      setPatients([]);
      return;
    }

    // Only reload if this is a different clinic or forced reload
    if (clinicId === lastLoadedClinicId && !forceReload && patients.length > 0) {
      return patients;
    }
    
    // If we have no patients loaded, always reload regardless of cache
    if (patients.length === 0) {
      forceReload = true;
    }

    setLoading(true);

    try {
      // Load from database - Clear localStorage cache first to ensure fresh data
      if (forceReload) {
        // Clear all possible cache keys
        const cacheKeys = [
          'dbCache_patients', 'dbCache_reports', 'dbCache_clinics',
          'patients_cache', 'reports_cache', 'last_patient_load'
        ];
        cacheKeys.forEach(key => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
          }
        });
      }
      
      const allPatients = await DatabaseService.get('patients');
      
      // Filter patients by clinic ID with multiple comparison methods
      let clinicPatients = allPatients.filter(patient => patient.clinicId === clinicId);
      
      if (clinicPatients.length === 0) {
        clinicPatients = allPatients.filter(patient => patient.clinicId == clinicId); // eslint-disable-line eqeqeq
      }
      
      if (clinicPatients.length === 0) {
        clinicPatients = allPatients.filter(patient => String(patient.clinicId) === String(clinicId));
      }
      
      
      // DEBUG: Check if any patients have different clinic ID format
      
      setPatients(clinicPatients);
      setLastLoadedClinicId(clinicId);
      
      // Load ALL reports for these patients in ONE query (was N sequential
      // queries — the N+1 slow path), then group by patient_id in memory.
      const reportsMap = {};
      const allReports = await DatabaseService.getReportsByPatients(clinicPatients.map((p) => p.id));
      for (const report of (allReports || [])) {
        const pid = report.patient_id;
        if (!pid) continue;
        (reportsMap[pid] = reportsMap[pid] || []).push(report);
      }

      setPatientReports(reportsMap);
      
      return clinicPatients;
    } catch (error) {
      console.error('ERROR: Error loading patients:', error);
      setPatients([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Add a new patient
  const addPatient = async (clinicId, patientData) => {
    try {
      const newPatient = await DatabaseService.add('patients', patientData);
      
      // Force a complete reload to ensure data consistency
      await loadPatientsForClinic(clinicId, true);
      
      return newPatient;
    } catch (error) {
      console.error('ERROR: Error adding patient:', error);
      throw error;
    }
  };

  // Update a patient
  const updatePatient = async (patientId, updates) => {
    try {
      const updatedPatient = await DatabaseService.update('patients', patientId, updates);
      
      // Update local state
      setPatients(prevPatients =>
        prevPatients.map(p => p.id === patientId ? updatedPatient : p)
      );
      
      return updatedPatient;
    } catch (error) {
      console.error('ERROR: Error updating patient:', error);
      throw error;
    }
  };

  // Delete a patient
  const deletePatient = async (patientId) => {
    try {
      await DatabaseService.delete('patients', patientId);
      
      // Update local state
      setPatients(prevPatients =>
        prevPatients.filter(p => p.id !== patientId)
      );
    } catch (error) {
      console.error('ERROR: Error deleting patient:', error);
      throw error;
    }
  };

  // Refresh patient reports after upload
  const refreshPatientReports = async (clinicId) => {
    if (!clinicId || patients.length === 0) {
      return;
    }

    
    try {
      // Clear reports cache to ensure fresh data
      localStorage.removeItem('dbCache_reports');
      
      // Reload ALL reports for these patients in ONE query (was N sequential queries).
      const reportsMap = {};
      const allReports = await DatabaseService.getReportsByPatients(patients.map((p) => p.id));
      for (const report of (allReports || [])) {
        const pid = report.patient_id;
        if (!pid) continue;
        (reportsMap[pid] = reportsMap[pid] || []).push(report);
      }

      setPatientReports(reportsMap);
    } catch (error) {
      console.error('ERROR: Error refreshing patient reports:', error);
    }
  };

  // Force complete refresh - clears all cache and reloads
  const forceRefresh = async (clinicId) => {
    
    // Clear all state
    setPatients([]);
    setPatientReports({});
    setLastLoadedClinicId(null);
    setLoading(false);
    
    // Clear all localStorage cache aggressively
    const allKeys = Object.keys(localStorage);
    const cacheKeys = allKeys.filter(key => 
      key.startsWith('dbCache_') || 
      key.includes('patient') || 
      key.includes('cache')
    );
    
    cacheKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Wait a moment for state to clear
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Force fresh load
    if (clinicId) {
      await loadPatientsForClinic(clinicId, true);
    }
  };

  // Clear patients data (when switching clinics)
  const clearPatients = () => {
    setPatients([]);
    setPatientReports({});
    setLastLoadedClinicId(null);
  };

  const value = {
    patients,
    patientReports,
    loading,
    loadPatientsForClinic,
    addPatient,
    updatePatient,
    deletePatient,
    refreshPatientReports,
    forceRefresh,
    clearPatients
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};