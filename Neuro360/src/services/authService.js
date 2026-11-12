import axios from 'axios';
import Cookies from 'js-cookie';

// Import shared Supabase service to avoid multiple client instances
import SupabaseService from './supabaseService';

// Get reference to the shared Supabase client
const supabase = SupabaseService.supabase;

// Base API URL - replace with your actual API endpoint
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests - use Supabase session token
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    } else {
      const token = Cookies.get('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {
    // Continue without token if session fetch fails
  }
  return config;
});

// Handle token expiration and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove('authToken');
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      console.error('Access denied:', error.response.data?.error);
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Email/Password Authentication
  async loginWithEmail({ email, password, userType }) {
    if (!email || !password) throw new Error('Email and password are required');
    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
        userType,
        origin: window.location.origin,
      });
      if (!data?.success || !data.session?.access_token || !data.session?.refresh_token) throw new Error(data?.error || 'Invalid email or password');
      const { error: sessionError } = await supabase.auth.setSession(data.session);
      if (sessionError) throw new Error('Unable to establish a secure session. Please try again.');
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Unable to sign in. Please try again.');
    }


  },

  async registerWithEmail({ name, email, password, confirmPassword, userType = 'patient', dateOfBirth, gender, phone, countryCode, address, city, clinicName, clinicType, clinic_type }) {
    if (!['patient', 'clinic'].includes(userType)) throw new Error('Invalid user type selected');
    if (password !== confirmPassword) throw new Error('Passwords do not match');
    const response = await fetch(`${API_BASE_URL}/register-account`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, userType, dateOfBirth, gender, phone, countryCode, address, city, clinicName, clinicType, clinic_type })
    });
    const result = await response.json();
    if (!response.ok || !result.success || !result.account?.id) throw new Error(result.message || 'Registration failed');
    const account = result.account;
    try {
      await fetch(`${API_BASE_URL}/registration-confirmation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: account.name || account.full_name, email: account.email,
          clinicName: userType === 'clinic' ? account.name : null, type: userType })
      });
    } catch (error) {
      console.warn('Registration confirmation email failed');
    }
    if (userType === 'clinic') return {
      success: true, needsActivation: true,
      message: 'Clinic registration submitted successfully! Your account is pending activation by our administrator.',
      user: { id: account.id, email: account.email, name: account.name, role: 'clinic_admin' }
    };
    // The account exists even if automatic sign-in fails; never invent a session token.
    try {
      return await this.loginWithEmail({ email: account.email, password, userType: 'patient' });
    } catch {
      throw new Error('Your account was created, but automatic sign-in failed. Please log in to continue.');
    }
  },

  // Google OAuth registration
  async registerWithGoogle() {
    try {
      const response = await this.simulateOAuthLogin('google');
      return response;
    } catch (error) {
      throw new Error('Google registration failed');
    }
  },

  async simulateOAuthLogin(provider) {
    throw new Error(`${provider} OAuth not implemented yet`);
  },

  // Get current user
  async getCurrentUser() {
    try {
      // First try to get from localStorage
      const user = localStorage.getItem('user');
      if (user) {
        return JSON.parse(user);
      }

      // Fallback to API call
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      throw new Error('Failed to get user data');
    }
  },

  // Logout
  async logout() {

    // Clear cookies FIRST - most important
    Cookies.remove('authToken');
    Cookies.remove('authToken', { path: '/' });

    // Clear localStorage IMMEDIATELY
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('demoUser');
    localStorage.removeItem('demoToken');

    // Sign out from Supabase (non-blocking with timeout)
    if (supabase && SupabaseService.isAvailable()) {
      const supabaseSignOut = async () => {
        try {
          await supabase.auth.signOut();
        } catch (supabaseError) {
          console.warn('WARNING: Supabase signOut failed:', supabaseError);
        }
      };
      // Don't wait more than 2 seconds for Supabase
      Promise.race([
        supabaseSignOut(),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]).catch(() => {});
    }

    // Try API call with timeout (non-blocking)
    const apiLogout = async () => {
      try {
        await api.post('/auth/logout');
      } catch (apiError) {
      }
    };
    // Don't wait more than 2 seconds for API
    Promise.race([
      apiLogout(),
      new Promise(resolve => setTimeout(resolve, 2000))
    ]).catch(() => {});

  },

  // Forgot Password

  // Reset Password
};

export default authService;
