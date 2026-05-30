import { supabase } from '../lib/supabaseClient';

// Default fallback locations
const DEFAULT_LOCATIONS = [
  'LONDON', 'NETHERLANDS', 'SURAT', 'PUNE',
  'MUMBAI', 'AHMEDABAD', 'BANGALORE', 'HYDERABAD', 'OTHER'
];

let cachedLocations = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Separate cache for clinic locations (full location cards)
let cachedClinicLocations = null;
let clinicCacheTimestamp = 0;

const LocationService = {
  // Fetch locations from Supabase (with cache)
  async getLocations() {
    const now = Date.now();
    if (cachedLocations && (now - cacheTimestamp) < CACHE_DURATION) {
      return cachedLocations;
    }

    try {
      const { data, error } = await supabase
        .from('preferred_locations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        cachedLocations = data.map(loc => loc.name);
        cacheTimestamp = now;
        return cachedLocations;
      }
    } catch (error) {
      console.warn('LocationService: Could not fetch from DB, using defaults:', error.message);
    }

    return DEFAULT_LOCATIONS;
  },

  // Get all locations with full details (for admin)
  async getAllLocations() {
    try {
      const { data, error } = await supabase
        .from('preferred_locations')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('LocationService: Error fetching all locations:', error);
      return [];
    }
  },

  // Add a new location
  async addLocation(name) {
    try {
      // Get max sort_order
      const { data: existing } = await supabase
        .from('preferred_locations')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.sort_order || 0) + 1;

      const { data, error } = await supabase
        .from('preferred_locations')
        .insert([{ name: name.toUpperCase().trim(), is_active: true, sort_order: nextOrder }])
        .select();

      if (error) throw error;
      this.clearCache();
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('LocationService: Error adding location:', error);
      return { success: false, error: error.message };
    }
  },

  // Update a location
  async updateLocation(id, updates) {
    try {
      const { data, error } = await supabase
        .from('preferred_locations')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      this.clearCache();
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('LocationService: Error updating location:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete a location
  async deleteLocation(id) {
    try {
      const { error } = await supabase
        .from('preferred_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      this.clearCache();
      return { success: true };
    } catch (error) {
      console.error('LocationService: Error deleting location:', error);
      return { success: false, error: error.message };
    }
  },

  // Toggle active status
  async toggleActive(id, isActive) {
    return this.updateLocation(id, { is_active: isActive });
  },

  // Seed default locations (run once to populate table)
  async seedDefaults() {
    try {
      const { data: existing } = await supabase
        .from('preferred_locations')
        .select('id')
        .limit(1);

      if (existing && existing.length > 0) return { success: true, message: 'Already seeded' };

      const locations = DEFAULT_LOCATIONS.map((name, idx) => ({
        name,
        is_active: true,
        sort_order: idx + 1
      }));

      const { error } = await supabase
        .from('preferred_locations')
        .insert(locations);

      if (error) throw error;
      this.clearCache();
      return { success: true, message: 'Default locations seeded' };
    } catch (error) {
      console.error('LocationService: Error seeding defaults:', error);
      return { success: false, error: error.message };
    }
  },

  // =============================================
  // Clinic Locations (full location cards for "Our Locations" pages)
  // Stored in the 'clinic_locations' Supabase table
  // =============================================

  // Fetch active clinic locations with caching (for public-facing pages)
  async getClinicLocations() {
    const now = Date.now();
    if (cachedClinicLocations && (now - clinicCacheTimestamp) < CACHE_DURATION) {
      return cachedClinicLocations;
    }

    try {
      const { data, error } = await supabase
        .from('clinic_locations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        cachedClinicLocations = data;
        clinicCacheTimestamp = now;
        return cachedClinicLocations;
      }
    } catch (error) {
      console.warn('LocationService: Could not fetch clinic locations from DB:', error.message);
    }

    // Return null to signal the caller should use fallback defaults
    return null;
  },

  // Get all clinic locations with full details (for admin management)
  async getAllClinicLocations() {
    try {
      const { data, error } = await supabase
        .from('clinic_locations')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('LocationService: Error fetching all clinic locations:', error);
      return [];
    }
  },

  // Add a new clinic location
  async addClinicLocation(locationData) {
    try {
      // Get max sort_order for auto-increment
      const { data: existing } = await supabase
        .from('clinic_locations')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = locationData.sort_order || (existing?.[0]?.sort_order || 0) + 1;

      const { data, error } = await supabase
        .from('clinic_locations')
        .insert([{
          name: locationData.name?.trim(),
          title: locationData.title?.trim(),
          description: locationData.description?.trim(),
          address: locationData.address?.trim(),
          phone: locationData.phone?.trim(),
          image_url: locationData.image_url?.trim(),
          status: locationData.status || 'active',
          is_active: true,
          sort_order: nextOrder
        }])
        .select();

      if (error) throw error;
      this.clearClinicCache();
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('LocationService: Error adding clinic location:', error);
      return { success: false, error: error.message };
    }
  },

  // Update an existing clinic location
  async updateClinicLocation(id, updates) {
    try {
      const { data, error } = await supabase
        .from('clinic_locations')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      this.clearClinicCache();
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('LocationService: Error updating clinic location:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete a clinic location
  async deleteClinicLocation(id) {
    try {
      const { error } = await supabase
        .from('clinic_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      this.clearClinicCache();
      return { success: true };
    } catch (error) {
      console.error('LocationService: Error deleting clinic location:', error);
      return { success: false, error: error.message };
    }
  },

  // Clear clinic locations cache
  clearClinicCache() {
    cachedClinicLocations = null;
    clinicCacheTimestamp = 0;
  },

  clearCache() {
    cachedLocations = null;
    cacheTimestamp = 0;
  }
};

export default LocationService;
export { DEFAULT_LOCATIONS };
