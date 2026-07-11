import React, { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Lazy-loaded so the heavy dashboards (esp. the ~9,500-line PatientDashboard) stay out
// of the entry chunk — otherwise the login page itself downloads all three dashboards.
const SuperAdminPanel = lazy(() => import('./admin/SuperAdminPanel'));
const ClinicDashboard = lazy(() => import('./clinic/ClinicDashboard'));
const PatientDashboard = lazy(() => import('./patient/PatientDashboard'));

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const DashboardRouter = () => {
  const { user, loading } = useAuth();

  // Show loading while checking auth
  if (loading) {
    return <Spinner />;
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route based on user role
  const renderDashboard = () => {
    switch (user.role) {
      case 'super_admin':
        return <SuperAdminPanel />;

      case 'clinic_admin':
      case 'clinic':
        return <ClinicDashboard />;

      case 'patient':
        return <PatientDashboard />;

      default:
        // For unknown roles, show error and redirect to login
        console.error('Unknown user role:', user.role);
        return <Navigate to="/login" replace />;
    }
  };

  return <Suspense fallback={<Spinner />}>{renderDashboard()}</Suspense>;
};

export default DashboardRouter;