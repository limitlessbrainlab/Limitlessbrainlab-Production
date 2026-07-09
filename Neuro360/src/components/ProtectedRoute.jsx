import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save current URL if it has payment params, so login can redirect back
    const fullPath = location.pathname + location.search;
    if (location.search.includes('payment=success') || location.search.includes('meditation_payment=success')) {
      localStorage.setItem('paymentReturnUrl', fullPath);
    }
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role. requiredRole may be a single role string or
  // an array of acceptable roles — clinic routes accept both 'clinic' and
  // 'clinic_admin' (the rest of the app, e.g. LoginForm, treats them as the same
  // clinic role), so an exact-match check here wrongly showed "Access Denied".
  const allowedRoles = requiredRole ? (Array.isArray(requiredRole) ? requiredRole : [requiredRole]) : [];
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
            {allowedRoles.includes('super_admin') && ' This area is restricted to Super Administrators only.'}
            {allowedRoles.includes('clinic_admin') && ' This area is restricted to Clinic Administrators only.'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
