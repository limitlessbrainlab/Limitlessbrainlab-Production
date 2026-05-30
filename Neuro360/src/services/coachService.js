import { supabase } from '../lib/supabaseClient';

class CoachService {
  /**
   * Fetch all coaches with optional filters
   * @param {Object} filters - Filter options (including clinicId for clinic-specific coaches)
   * @returns {Promise<Array>} - List of coaches
   */
  async getCoaches(filters = {}) {
    try {
      let query = supabase
        .from('coaches')
        .select('*')
        .eq('is_active', true);

      // All active coaches are visible to all patients (global coaches)

      // Apply format filter
      if (filters.format === 'in-person') {
        query = query.eq('is_in_person', true);
      } else if (filters.format === 'online') {
        query = query.eq('is_online', true);
      }

      // Apply role category filter
      if (filters.roleCategory && filters.roleCategory !== 'All') {
        query = query.eq('role_category', filters.roleCategory);
      }

      // Apply specialty filter
      if (filters.specialties && filters.specialties.length > 0) {
        query = query.overlaps('specialties', filters.specialties);
      }

      // Apply price range filter
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }

      // Order by rating
      query = query.order('rating', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching coaches:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('CoachService.getCoaches error:', error);
      return [];
    }
  }

  /**
   * Get a single coach by ID
   * @param {string} coachId - Coach ID
   * @returns {Promise<Object>} - Coach data
   */
  async getCoachById(coachId) {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', coachId)
        .single();

      if (error) {
        console.error('Error fetching coach:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('CoachService.getCoachById error:', error);
      return null;
    }
  }

  /**
   * Search coaches by name or specialty
   * @param {string} searchTerm - Search query
   * @returns {Promise<Array>} - Matching coaches
   */
  async searchCoaches(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,credentials.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error searching coaches:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('CoachService.searchCoaches error:', error);
      return [];
    }
  }

  /**
   * Get coaches near a location (within radius)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radiusKm - Radius in kilometers
   * @returns {Promise<Array>} - Nearby coaches
   */
  async getCoachesNearLocation(lat, lng, radiusKm = 25) {
    try {
      // Using Haversine formula via PostGIS or simple distance calculation
      // For now, fetch all and filter client-side (can be optimized with PostGIS)
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('is_active', true)
        .eq('is_in_person', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Error fetching nearby coaches:', error);
        throw error;
      }

      // Calculate distance and filter
      const coachesWithDistance = (data || [])
        .map(coach => ({
          ...coach,
          distance: this.calculateDistance(lat, lng, coach.latitude, coach.longitude)
        }))
        .filter(coach => coach.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      return coachesWithDistance;
    } catch (error) {
      console.error('CoachService.getCoachesNearLocation error:', error);
      return [];
    }
  }

  /**
   * Get coaches by city name (text-based matching)
   * This catches coaches who have city set but no lat/lng, or online-only coaches
   * @param {string} cityName - City name to search
   * @returns {Promise<Array>} - Matching coaches
   */
  async getCoachesByCity(cityName) {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('is_active', true)
        .ilike('city', `%${cityName}%`);

      if (error) {
        console.error('Error fetching coaches by city:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('CoachService.getCoachesByCity error:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Get all unique specialties from coaches
   * @returns {Promise<Array>} - List of specialties
   */
  async getSpecialties() {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('specialties')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching specialties:', error);
        throw error;
      }

      // Flatten and get unique specialties
      const allSpecialties = (data || [])
        .flatMap(coach => coach.specialties || [])
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();

      return allSpecialties;
    } catch (error) {
      console.error('CoachService.getSpecialties error:', error);
      return [];
    }
  }

  /**
   * Submit a connection request to a coach
   * @param {Object} requestData - Connection request data
   * @returns {Promise<Object>} - Result
   */
  async submitConnectionRequest(requestData) {
    try {
      const { data, error } = await supabase
        .from('coach_connection_requests')
        .insert([{
          coach_id: requestData.coachId,
          patient_id: requestData.patientId,
          patient_name: requestData.patientName,
          patient_email: requestData.patientEmail,
          patient_phone: requestData.patientPhone,
          message: requestData.message,
          request_type: requestData.requestType, // 'booking', 'message', 'callback'
          status: 'pending',
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error submitting connection request:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('CoachService.submitConnectionRequest error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add a new coach (admin only)
   * @param {Object} coachData - Coach data
   * @returns {Promise<Object>} - Result
   */
  async addCoach(coachData) {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .insert([{
          name: coachData.name,
          photo: coachData.photo || null,
          credentials: coachData.credentials,
          specialties: coachData.specialties || [],
          modalities: coachData.modalities || [],
          rating: coachData.rating || 0,
          reviews_count: coachData.reviewsCount || 0,
          is_online: coachData.isOnline || false,
          is_in_person: coachData.isInPerson || false,
          price: coachData.price,
          price_display: coachData.priceDisplay,
          bio: coachData.bio,
          languages: coachData.languages || ['English'],
          experience: coachData.experience,
          latitude: coachData.latitude || null,
          longitude: coachData.longitude || null,
          city: coachData.city || null,
          phone: coachData.phone || null,
          email: coachData.email || null,
          whatsapp: coachData.whatsapp || null,
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding coach:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('CoachService.addCoach error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update coach data
   * @param {string} coachId - Coach ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} - Result
   */
  async updateCoach(coachId, updates) {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', coachId)
        .select()
        .single();

      if (error) {
        console.error('Error updating coach:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('CoachService.updateCoach error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete/deactivate a coach
   * @param {string} coachId - Coach ID
   * @returns {Promise<Object>} - Result
   */
  async deleteCoach(coachId) {
    try {
      // Soft delete - just deactivate
      const { error } = await supabase
        .from('coaches')
        .update({ is_active: false })
        .eq('id', coachId);

      if (error) {
        console.error('Error deleting coach:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('CoachService.deleteCoach error:', error);
      return { success: false, error: error.message };
    }
  }

  // =====================================================
  // ADMIN METHODS
  // =====================================================

  /**
   * Get all coaches including inactive (for admin)
   * @returns {Promise<Array>} - List of all coaches
   */
  async getAllCoachesAdmin() {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all coaches:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('CoachService.getAllCoachesAdmin error:', error);
      return [];
    }
  }

  /**
   * Toggle coach active status
   * @param {string} coachId - Coach ID
   * @param {boolean} isActive - New active status
   * @returns {Promise<Object>} - Result
   */
  async toggleCoachStatus(coachId, isActive) {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', coachId)
        .select()
        .single();

      if (error) {
        console.error('Error toggling coach status:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('CoachService.toggleCoachStatus error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get connection requests (for admin)
   * @param {string|null} status - Optional status filter
   * @returns {Promise<Array>} - Connection requests
   */
  async getConnectionRequests(status = null) {
    try {
      let query = supabase
        .from('coach_connection_requests')
        .select(`
          *,
          coaches:coach_id (name, email, photo)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching connection requests:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('CoachService.getConnectionRequests error:', error);
      return [];
    }
  }

  /**
   * Update connection request status
   * @param {string} requestId - Request ID
   * @param {string} status - New status
   * @param {string|null} notes - Optional admin notes
   * @returns {Promise<Object>} - Result
   */
  async updateConnectionRequestStatus(requestId, status, notes = null) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.admin_notes = notes;
      }

      const { data, error } = await supabase
        .from('coach_connection_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error updating connection request status:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('CoachService.updateConnectionRequestStatus error:', error);
      return { success: false, error: error.message };
    }
  }

  // =====================================================
  // GEOCODING & CLINIC METHODS
  // =====================================================

  /**
   * Geocode a location query (city/area name) to coordinates
   * Uses OpenStreetMap Nominatim API (free, no API key required)
   * @param {string} query - Location name (e.g., "Mumbai", "Bangalore")
   * @returns {Promise<Object|null>} - { lat, lng, displayName } or null
   */
  async geocodeLocation(query) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        {
          headers: {
            'User-Agent': 'NeuroSense360/1.0'
          }
        }
      );
      const data = await response.json();

      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
      }
      return null;
    } catch (error) {
      console.error('CoachService.geocodeLocation error:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get city name
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<string|null>} - City name or null
   */
  async reverseGeocode(lat, lng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'NeuroSense360/1.0'
          }
        }
      );
      const data = await response.json();

      if (data && data.address) {
        // Try to get the most specific city-level name
        return data.address.city ||
               data.address.town ||
               data.address.village ||
               data.address.municipality ||
               data.address.state_district ||
               data.address.state ||
               null;
      }
      return null;
    } catch (error) {
      console.error('CoachService.reverseGeocode error:', error);
      return null;
    }
  }

  /**
   * Get clinics by city/location name (text-based matching)
   * @param {string} locationName - City/region name to search
   * @returns {Promise<Array>} - List of clinics
   */
  async getClinicsByCity(locationName) {
    try {
      // Search across name and address columns
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .or(`name.ilike.%${locationName}%,address.ilike.%${locationName}%`);

      if (error) {
        console.error('Error fetching clinics by location:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('CoachService.getClinicsByCity error:', error);
      return [];
    }
  }
}

export default new CoachService();
