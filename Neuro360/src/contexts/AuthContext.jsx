import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { authService } from '../services/authService';
import DatabaseService from '../services/databaseService';
import supabase from '../lib/supabaseClient';
import { getFriendlyErrorMessage } from '../utils/friendlyError';
import { clearAllAndSignOut } from '../utils/sessionCleanup';

/* global __APP_BUILD_ID__ */
// Unique id of the deployed build (injected by vite define). Changes every deployment.
const APP_BUILD_ID = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'dev';
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

// START: DEVELOPMENT MODE: Bypass authentication
const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true' || false; // Set to false to enable authentication

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Auto-logout after 30 minutes of inactivity (clears all cache/storage on the way out).
  useEffect(() => {
    if (BYPASS_AUTH || !isAuthenticated) return;

    const touch = () => { try { localStorage.setItem('lastActivity', String(Date.now())); } catch (e) { /* ignore */ } };
    // Seed on (re)auth so a fresh session starts the clock now.
    touch();

    let lastWrite = Date.now();
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite > 30000) { lastWrite = now; touch(); } // throttle writes to ~30s
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    const forceIdleLogout = async () => {
      await clearAllAndSignOut();
      localStorage.setItem('app_build_id', APP_BUILD_ID); // keep build id so deploy gate doesn't refire
      window.location.replace('/');
    };

    const checkIdle = () => {
      const last = parseInt(localStorage.getItem('lastActivity') || '0', 10);
      if (last && Date.now() - last > INACTIVITY_LIMIT_MS) forceIdleLogout();
    };
    checkIdle(); // covers returning to a tab left idle > 30 min
    const interval = setInterval(checkIdle, 60 * 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearInterval(interval);
    };
  }, [isAuthenticated]);


  const checkAuthStatus = async () => {
    try {
      // DEPLOY GATE: if the running build differs from the one this browser last saw,
      // a new deployment is live → wipe everything and hard-refresh into a clean build.
      if (!BYPASS_AUTH) {
        const storedBuildId = localStorage.getItem('app_build_id');
        if (storedBuildId !== APP_BUILD_ID) {
          const hadSession = !!(localStorage.getItem('authToken') || localStorage.getItem('user'));
          await clearAllAndSignOut();
          localStorage.setItem('app_build_id', APP_BUILD_ID); // set AFTER clear → no reload loop
          if (hadSession) { window.location.reload(); return; } // hard refresh into login
        } else {
          localStorage.setItem('app_build_id', APP_BUILD_ID);
        }
      }

      // START: DEVELOPMENT MODE: Auto-authenticate with default user
      if (BYPASS_AUTH) {

        // Check if user was previously set (from login)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
            setLoading(false);
            return;
          } catch (e) {
          }
        }

        // Default super admin user if no stored user
        const defaultUser = {
          id: 'dev-super-admin',
          name: 'Super Admin (Dev)',
          email: 'superadmin@neurosense360.com',
          role: 'super_admin',
          profilePicture: null,
          isActivated: true,
          clinicId: null
        };

        setUser(defaultUser);
        setIsAuthenticated(true);
        setLoading(false);
        localStorage.setItem('user', JSON.stringify(defaultUser));
        return;
      }

      // PRODUCTION MODE: Check for stored authentication
      // First check localStorage for token and user
      const storedToken = localStorage.getItem('authToken') || Cookies.get('authToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);

          // Super admins authenticate via a real Supabase JWT — never trust the
          // localStorage copy blindly. Validate the live session against the
          // Supabase server, confirm it belongs to the same email, and re-derive
          // the role from profiles. If anything is missing/expired/tampered,
          // clear everything and force a fresh login.
          // (Clinics & patients use local_token_* with no Supabase session, so
          //  they keep the existing localStorage-restore behavior below.)
          if (parsedUser.role === 'super_admin') {
            if (!supabase) {
              throw new Error('Supabase unavailable — cannot validate admin session');
            }

            const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
            const sameEmail = authUser?.email?.toLowerCase() === parsedUser.email?.toLowerCase();

            if (authErr || !authUser || !sameEmail) {
              throw new Error('Invalid or expired admin session');
            }

            // Re-derive role from the trusted profiles table (defends against a
            // tampered localStorage role).
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, full_name, avatar_url')
              .eq('id', authUser.id)
              .single();

            if (!profile || profile.role !== 'super_admin') {
              throw new Error('Account is not a super admin');
            }

            const validatedUser = {
              ...parsedUser,
              id: authUser.id,
              email: authUser.email,
              role: 'super_admin',
              name: profile.full_name || parsedUser.name,
              avatar: profile.avatar_url || parsedUser.avatar,
            };

            setUser(validatedUser);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(validatedUser));
            setLoading(false);
            return;
          }

          // Non-admin (clinic/patient): restore from localStorage
          setUser(parsedUser);
          setIsAuthenticated(true);
          setLoading(false);
          return;
        } catch (e) {
          // Validation failed (or bad JSON) — clear any stale auth so the user
          // is sent to /login by ProtectedRoute instead of seeing the admin UI.
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
          Cookies.remove('authToken');
          Cookies.remove('authToken', { path: '/' });
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
      }

      // If no localStorage auth, check Supabase session
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Get user profile from database
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const userData = {
            id: session.user.id,
            email: session.user.email,
            name: profile?.full_name || session.user.user_metadata?.full_name || 'User',
            role: profile?.role || session.user.user_metadata?.role || 'patient',
            avatar: profile?.avatar_url,
            isActivated: true
          };

          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials, method = 'email') => {

    // START: DEVELOPMENT MODE: Auto-succeed login
    if (BYPASS_AUTH) {
      setLoading(true);

      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 500));

      // Determine user role based on email patterns
      const email = credentials.email || 'dev@neurosense360.com';
      let userRole = 'super_admin'; // default
      let userName = 'Development User';
      let clinicId = null;

      // Role detection based on email patterns
      if (email.includes('superadmin') || email.includes('admin@neurosense')) {
        userRole = 'super_admin';
        userName = 'Super Admin (Dev)';
        clinicId = null;
      } else if (email.includes('clinic') || email.includes('@clinic') ||
                 email.includes('doctor') || email.includes('dr.')) {
        userRole = 'clinic_admin';
        userName = 'Clinic Admin (Dev)';
        clinicId = 'dev-clinic-123';
      } else if (email.includes('patient')) {
        userRole = 'patient';
        userName = 'Patient (Dev)';
        clinicId = 'dev-clinic-123';
      }

      const defaultUser = {
        id: `dev-${userRole}-${Date.now()}`,
        name: userName,
        email: email,
        role: userRole,
        profilePicture: null,
        isActivated: true,
        clinicId: clinicId
      };

      setUser(defaultUser);
      setIsAuthenticated(true);
      setLoading(false);
      localStorage.setItem('user', JSON.stringify(defaultUser));
      localStorage.setItem('authToken', 'dev-bypass-token');

      toast.success(`START: Development mode login as ${userRole}!`);

      return {
        success: true,
        user: defaultUser,
        message: 'Development mode login successful'
      };
    }

    try {
      setLoading(true);
      let response;
      
      
      switch (method) {
        case 'email':
          response = await authService.loginWithEmail(credentials);
          break;
        case 'google':
          response = await authService.loginWithGoogle();
          break;
        case 'github':
          response = await authService.loginWithGitHub();
          break;
        case 'facebook':
          response = await authService.loginWithFacebook();
          break;
        default:
          throw new Error('Invalid authentication method');
      }


      if (response && response.success && response.token) {
        // Store authentication data in multiple places for reliability
        Cookies.set('authToken', response.token, { expires: 7 }); // 7 days
        localStorage.setItem('authToken', response.token);
        
        // Fetch the latest user data from database to get updated profile picture
        let latestUserData = response.user;
        try {
          if (response.user.role === 'super_admin') {
            const superAdminData = await DatabaseService.findById('superAdmins', response.user.id);
            if (superAdminData) {
              latestUserData = { ...response.user, ...superAdminData };
            }
          } else if (response.user.role === 'clinic_admin') {

            // Try to find clinic by ID first
            let clinicData = await DatabaseService.findById('clinics', response.user.id);

            // If not found by ID, try by email
            if (!clinicData) {
              const clinicsByEmail = await DatabaseService.findBy('clinics', 'email', response.user.email);
              if (clinicsByEmail && clinicsByEmail.length > 0) {
                clinicData = clinicsByEmail[0];
              }
            }


            if (clinicData) {
              // Map contact_person to name and logo_url to avatar for the UI
              latestUserData = {
                ...response.user,
                ...clinicData,
                clinicName: clinicData.name || '',
                name: clinicData.contact_person || clinicData.name || response.user.name,
                avatar: clinicData.logo_url || clinicData.avatar || response.user.avatar
              };
            } else {
            }
          } else if (response.user.role === 'patient') {

            // Try to find patient by ID first
            let patientData = await DatabaseService.findById('patients', response.user.id);

            // If not found by ID, try by email
            if (!patientData) {
              const patientsByEmail = await DatabaseService.findBy('patients', 'email', response.user.email);
              if (patientsByEmail && patientsByEmail.length > 0) {
                patientData = patientsByEmail[0];
              }
            }


            if (patientData) {
              // Map avatar fields from database to user object
              const avatarUrl = patientData.avatar || patientData.profile_image || patientData.profileImage || patientData.avatar_url;

              latestUserData = {
                ...response.user,
                ...patientData,
                name: patientData.name || patientData.full_name || response.user.name,
                avatar: avatarUrl,
                profile_image: avatarUrl,
                profileImage: avatarUrl,
                avatar_url: avatarUrl
              };
            } else {
            }
          }
        } catch (dbError) {
          // Continue with API response if database fetch fails
        }
        
        // Store the latest user data
        localStorage.setItem('user', JSON.stringify(latestUserData));
        
        // Set state
        setUser(latestUserData);
        setIsAuthenticated(true);
        
        
        toast.success('Logged in successfully');
        return { success: true, user: latestUserData };
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('ALERT: AuthContext: Login failed:', error);
      toast.error(getFriendlyErrorMessage(error, 'Login failed. Please try again.'));
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData, method = 'email') => {

    // START: DEVELOPMENT MODE: Auto-succeed registration
    if (BYPASS_AUTH) {
      setLoading(true);

      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 800));

      const defaultUser = {
        id: 'dev-user-' + Date.now(),
        name: userData.name || 'Development User',
        email: userData.email || 'dev@neurosense360.com',
        role: userData.userType === 'super_admin' ? 'super_admin' :
              userData.userType === 'patient' ? 'patient' : 'clinic_admin',
        profilePicture: null,
        isActivated: true,
        clinicId: 'dev-clinic-123'
      };

      setUser(defaultUser);
      setIsAuthenticated(true);
      setLoading(false);
      localStorage.setItem('user', JSON.stringify(defaultUser));
      localStorage.setItem('authToken', 'dev-bypass-token');

      toast.success('START: Development mode registration successful!');

      return {
        success: true,
        user: defaultUser,
        message: 'Development mode registration successful'
      };
    }

    try {
      setLoading(true);
      let response;
      
      
      switch (method) {
        case 'email':
          response = await authService.registerWithEmail(userData);
          break;
        case 'google':
          response = await authService.registerWithGoogle();
          break;
        case 'github':
          response = await authService.registerWithGitHub();
          break;
        case 'facebook':
          response = await authService.registerWithFacebook();
          break;
        default:
          throw new Error('Invalid registration method');
      }


      if (response && response.success) {
        if (response.needsActivation) {
          // Super admin needs activation - don't login automatically
          toast.success(response.message || 'Registration submitted for approval!');
          return { success: true, needsActivation: true };
        } else if (response.token) {
          // Normal registration with immediate login
          Cookies.set('authToken', response.token, { expires: 7 });
          localStorage.setItem('authToken', response.token);
          
          // Fetch the latest user data from database to get updated profile picture
          let latestUserData = response.user;
          try {
            if (response.user.role === 'super_admin') {
              const superAdminData = await DatabaseService.findById('superAdmins', response.user.id);
              if (superAdminData) {
                latestUserData = { ...response.user, ...superAdminData };
              }
            } else if (response.user.role === 'clinic_admin') {

              // Try to find clinic by ID first
              let clinicData = await DatabaseService.findById('clinics', response.user.id);

              // If not found by ID, try by email
              if (!clinicData) {
                const clinicsByEmail = await DatabaseService.findBy('clinics', 'email', response.user.email);
                if (clinicsByEmail && clinicsByEmail.length > 0) {
                  clinicData = clinicsByEmail[0];
                }
              }


              if (clinicData) {
                // Map contact_person to name and logo_url to avatar for the UI
                latestUserData = {
                  ...response.user,
                  ...clinicData,
                  clinicName: clinicData.name || '',
                  name: clinicData.contact_person || clinicData.name || response.user.name,
                  avatar: clinicData.logo_url || clinicData.avatar || response.user.avatar
                };
              } else {
              }
            }
          } catch (dbError) {
            // Continue with API response if database fetch fails
          }
          
          // Store the latest user data
          localStorage.setItem('user', JSON.stringify(latestUserData));
          
          setUser(latestUserData);
          setIsAuthenticated(true);
          
          
          toast.success(response.message || 'Registration successful!');
          return { success: true };
        } else {
          return { success: false, error: 'Registration completed but login failed' };
        }
      } else {
        // Handle case where response doesn't have success field or is falsy
        const errorMessage = response?.error || response?.message || 'Registration failed with unknown error';
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(getFriendlyErrorMessage(error, 'Registration failed. Please try again.'));
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // Clear React state immediately for snappy UI.
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');

    // authService logout in background (don't await).
    if (!BYPASS_AUTH) {
      authService.logout().catch(err => console.warn('Background authService logout:', err));
    }

    // Full wipe: cookies, all localStorage/sessionStorage, Cache Storage, service workers,
    // and Supabase sign-out — then a hard refresh to a clean state.
    try { await clearAllAndSignOut(); } catch (e) { /* ignore */ }
    localStorage.setItem('app_build_id', APP_BUILD_ID); // keep build id so deploy gate doesn't refire
    window.location.href = '/';
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      await authService.forgotPassword(email);
      toast.success('Password reset email sent!');
      return { success: true };
    } catch (error) {
      console.error('Forgot password failed:', error);
      toast.error(getFriendlyErrorMessage(error, 'We could not send the password reset email. Please try again.'));
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setLoading(true);
      await authService.resetPassword(token, newPassword);
      toast.success('Password reset successful!');
      return { success: true };
    } catch (error) {
      console.error('Password reset failed:', error);
      toast.error(getFriendlyErrorMessage(error, 'We could not reset your password. Please try again.'));
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData) => {
    try {
      setLoading(true);

      // Update local state immediately for better UX
      const updatedUser = { ...user, ...userData };

      // If avatar is being updated, also add to profile_image and avatar_url for consistency
      if (userData.avatar) {
        updatedUser.profile_image = userData.avatar;
        updatedUser.avatar_url = userData.avatar;
        updatedUser.profileImage = userData.avatar;
      }

      setUser(updatedUser);

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // SUCCESS: CRITICAL: Update Supabase Auth password FIRST if password is being changed
      if (userData.password && supabase) {
        try {
          const { error: authError } = await supabase.auth.updateUser({
            password: userData.password
          });

          if (authError) {
            // Continue anyway to update local database
          } else {
          }
        } catch (authError) {
          // Continue anyway to update local database
        }
      }

      // Save to database based on user role
      try {
        if (user?.role === 'super_admin') {
          // Update super admin in database
          await DatabaseService.update('superAdmins', user.id, userData);
        } else if (user?.role === 'clinic_admin') {
          // Map clinicName to name for database
          const clinicData = { ...userData };
          if (clinicData.clinicName) {
            clinicData.name = clinicData.clinicName;
            delete clinicData.clinicName;
          }
          // Map name (contact person) to contact_person for database
          if (clinicData.name && !clinicData.contact_person) {
            clinicData.contact_person = clinicData.name;
          }
          // Map avatar to logo_url (clinics table doesn't have avatar field)
          if (clinicData.avatar) {
            clinicData.logo_url = clinicData.avatar;
            delete clinicData.avatar;
          }
          // Update clinic admin in database
          const updateResult = await DatabaseService.update('clinics', user.id, clinicData);
        } else {
          // For regular users (patients), find patient record and update

          // Find patient record by email
          const allPatients = await DatabaseService.get('patients');
          const userEmailLower = user.email.trim().toLowerCase();
          const patientRecord = allPatients.find(p => {
            if (!p.email) return false;
            return p.email.trim().toLowerCase() === userEmailLower;
          });

          if (!patientRecord) {
            console.error('ERROR: Patient record not found for email:', user.email);
            throw new Error('Patient record not found');
          }


          // Map avatar field to database fields
          const patientData = { ...userData };

          if (patientData.avatar) {
            // Map avatar to both profile_image and avatar_url for compatibility
            patientData.profile_image = patientData.avatar;
            patientData.avatar_url = patientData.avatar;
            patientData.profileImage = patientData.avatar;
            // Don't save the original avatar field to database
            delete patientData.avatar;
          } else {
          }

          // Remove password fields from patient data (handled separately by Supabase Auth)
          delete patientData.password;
          delete patientData.currentPassword;
          delete patientData.confirmPassword;


          // Update patient record in database
          const updateResult = await DatabaseService.update('patients', patientRecord.id, patientData);
        }
      } catch (dbError) {
        console.error('ERROR: Database update failed:', dbError);
        // Don't fail the entire operation if database fails
      }
      
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error(getFriendlyErrorMessage(error, 'We could not update your profile. Please try again.'));
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateUser,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
