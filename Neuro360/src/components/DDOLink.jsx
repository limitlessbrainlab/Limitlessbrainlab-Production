import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { openDDO } from '../services/ssoService';
import toast from 'react-hot-toast';

/**
 * DDOLink — Button that SSO-redirects the logged-in user to DDO.
 *
 * Props:
 *   label       - Button text (default: "Open DDO")
 *   icon        - Optional React node to render above the label
 *   doctorSlug  - Optional doctor booking_slug for patient booking redirect
 *   className   - Optional additional CSS classes
 */
const DDOLink = ({ label = 'Open DDO', icon = null, doctorSlug = null, className = '' }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!user?.id || !user?.email || !user?.role) {
      toast.error('Please log in first.');
      return;
    }

    setLoading(true);
    try {
      await openDDO(user.id, user.email, user.role, doctorSlug);
    } catch (err) {
      console.error('SSO redirect failed:', err);
      toast.error('Unable to connect to DDO. Please try again.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait transition-colors ${className}`}
    >
      {loading ? (
        <>
          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          Connecting...
        </>
      ) : (
        <>
          {icon}
          <span>{label}</span>
        </>
      )}
    </button>
  );
};

export default DDOLink;
