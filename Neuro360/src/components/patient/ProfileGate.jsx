import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DatabaseService from '../../services/databaseService';
import {
  User,
  AlertCircle,
  ChevronRight,
  Shield,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const ProfileGate = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileComplete, setIsProfileComplete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missingFields, setMissingFields] = useState([]);

  // Pages that are allowed without profile completion - ONLY profile page
  const allowedPaths = [
    '/dashboard/profile'
  ];

  // Required profile fields for completion - Only basic patient info
  const requiredFields = [
    // Section 1: Patient Information (Core fields only)
    { key: 'name', label: 'Full Name', altKeys: ['full_name', 'fullName'] },
    { key: 'date_of_birth', label: 'Date of Birth', altKeys: ['dateOfBirth', 'dob'] },
    { key: 'gender', label: 'Gender' },
    { key: 'phone', label: 'Phone Number', altKeys: ['phone_number', 'phoneNumber', 'contact'] }
  ];

  // Clinical Report is optional (not blocking)
  const [hasClinicalReport, setHasClinicalReport] = useState(null);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        // Get patient record from database
        const allPatients = await DatabaseService.get('patients');
        const userEmailLower = user.email.trim().toLowerCase();
        const patientRecord = allPatients.find(p => {
          if (!p.email) return false;
          return p.email.trim().toLowerCase() === userEmailLower;
        });

        if (!patientRecord) {
          setIsProfileComplete(false);
          setMissingFields([...requiredFields.map(f => f.label)]);
          setHasClinicalReport(false);
          setLoading(false);
          return;
        }

        // Check each required field from patient record
        const missing = [];
        for (const field of requiredFields) {
          let value = patientRecord[field.key];

          // Check alternate keys if primary is empty
          if (!value && field.altKeys) {
            for (const altKey of field.altKeys) {
              if (patientRecord[altKey]) {
                value = patientRecord[altKey];
                break;
              }
            }
          }

          if (!value || (typeof value === 'string' && value.trim() === '')) {
            missing.push(field.label);
          }
        }

        // Check if Clinical Report exists
        let clinicalReportExists = false;
        try {
          const clinicalReports = await DatabaseService.get('clinical_reports');
          const patientClinicalReport = clinicalReports?.find(r =>
            r.patient_email?.trim().toLowerCase() === userEmailLower ||
            r.patientEmail?.trim().toLowerCase() === userEmailLower
          );

          if (patientClinicalReport) {
            // Check if essential clinical fields are filled
            const hasEssentialClinicalData =
              patientClinicalReport.presenting_complaints ||
              patientClinicalReport.presentingComplaints ||
              patientClinicalReport.past_medical_history ||
              patientClinicalReport.pastMedicalHistory;

            clinicalReportExists = !!hasEssentialClinicalData;
          }
        } catch (err) {
        }

        setHasClinicalReport(clinicalReportExists);

        // Clinical Report is optional - don't add to missing fields
        // if (!clinicalReportExists) {
        //   missing.push('Clinical & Medical History Form');
        // }

        setMissingFields(missing);
        setIsProfileComplete(missing.length === 0);
      } catch (error) {
        console.error('ProfileGate: Error checking profile:', error);
        setIsProfileComplete(false);
      } finally {
        setLoading(false);
      }
    };

    checkProfileCompletion();
  }, [user?.email, location.pathname]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#323956]"></div>
      </div>
    );
  }

  // Check if current path is allowed without profile completion
  const isAllowedPath = allowedPaths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));

  // If profile is complete or on allowed path, render children
  if (isProfileComplete || isAllowedPath) {
    return children;
  }

  // Profile incomplete - show gate modal/overlay
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {/* Gate Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Complete Your Profile
            </h1>
            <p className="text-white/80 text-sm">
              Profile completion is mandatory before accessing dashboard features
            </p>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Alert */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-medium text-sm">
                  {missingFields.length} required field{missingFields.length > 1 ? 's' : ''} missing
                </p>
                <p className="text-amber-700 text-xs mt-1">
                  Complete all patient information and clinical history to access your personalized brain optimization dashboard.
                </p>
              </div>
            </div>

            {/* Missing Fields - Scrollable */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Please provide the following information:
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
                {missingFields.map((field, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg"
                  >
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-500 text-[10px] font-bold">{index + 1}</span>
                    </div>
                    <span className="text-gray-700 text-sm">{field}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="mb-4 p-3 bg-gray-100 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Profile Completion</span>
                <span className="text-xs font-bold text-[#323956]">
                  {Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#323956] to-[#4a5578] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((requiredFields.length - missingFields.length) / requiredFields.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-[#323956]" />
                <h3 className="text-xs font-semibold text-gray-700">
                  Why this matters
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span>Personalized recommendations</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span>Age-appropriate protocols</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span>Accurate progress tracking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span>Better clinical insights</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => navigate('/dashboard/profile')}
              className="w-full py-4 bg-gradient-to-r from-[#323956] to-[#4a5578] text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <User className="h-5 w-5" />
              Complete Profile Now
              <ChevronRight className="h-5 w-5" />
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              Takes less than 2 minutes to complete
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileGate;
