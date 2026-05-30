import axios from 'axios';
import { supabase } from './supabaseService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Create axios instance with auth handling
 */
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor - Add authorization token to all requests
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get current session from Supabase
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        // Add token to Authorization header
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.warn('[ApiClient] Failed to get session:', error.message);
      // Continue without token
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - Handle errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 - Token expired or invalid
    if (error.response?.status === 401) {
      // Clear session and redirect to login
      await supabase.auth.signOut();
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired. Please login again.'));
    }

    // Handle 403 - Insufficient permissions
    if (error.response?.status === 403) {
      return Promise.reject(
        new Error(error.response.data?.error || 'You do not have permission to perform this action.')
      );
    }

    // Handle 429 - Rate limit exceeded
    if (error.response?.status === 429) {
      return Promise.reject(
        new Error(error.response.data?.error || 'Too many requests. Please try again later.')
      );
    }

    // Handle validation errors (400)
    if (error.response?.status === 400) {
      const details = error.response.data?.details;
      if (details && Array.isArray(details)) {
        const messages = details.map(d => `${d.field}: ${d.message}`).join(', ');
        return Promise.reject(new Error(`Validation failed: ${messages}`));
      }
      return Promise.reject(
        new Error(error.response.data?.error || 'Invalid request')
      );
    }

    // Handle server errors (500)
    if (error.response?.status >= 500) {
      return Promise.reject(
        new Error('Server error. Please try again later.')
      );
    }

    return Promise.reject(error);
  }
);

export default apiClient;
