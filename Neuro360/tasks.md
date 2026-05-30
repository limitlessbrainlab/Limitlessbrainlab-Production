# Our Locations Management System - Tasks

## 1. Update LocationService
- [x] 1.1 Add separate cache variables for clinic locations (`cachedClinicLocations`, `clinicCacheTimestamp`)
- [x] 1.2 Add `getClinicLocations()` method - fetch active clinic locations from `clinic_locations` table with caching
- [x] 1.3 Add `getAllClinicLocations()` method - fetch all clinic locations for admin management
- [x] 1.4 Add `addClinicLocation(data)` method - insert new clinic location with all fields
- [x] 1.5 Add `updateClinicLocation(id, updates)` method - update existing clinic location
- [x] 1.6 Add `deleteClinicLocation(id)` method - delete a clinic location
- [x] 1.7 Add `clearClinicCache()` method - clear the clinic locations cache

## 2. Update LocationsPopup.jsx
- [x] 2.1 Move hardcoded locations to a `DEFAULT_CLINIC_LOCATIONS` fallback constant
- [x] 2.2 Add `mapDbLocationToCard` helper to convert DB rows to popup card format
- [x] 2.3 Add state for `locations` and `loading`
- [x] 2.4 Add `useEffect` to fetch clinic locations from Supabase when popup opens
- [x] 2.5 Add loading spinner state in the grid area
- [x] 2.6 Implement fallback to hardcoded defaults on DB fetch failure

## 3. Update Locations.jsx (page)
- [x] 3.1 Move hardcoded locations to a `DEFAULT_PAGE_LOCATIONS` fallback constant
- [x] 3.2 Add state for `locations` and `locationsLoading`
- [x] 3.3 Add `useEffect` to fetch clinic locations from Supabase on mount
- [x] 3.4 Map DB rows to page format (uppercase name, alternating imagePosition)
- [x] 3.5 Add loading spinner state before the locations list
- [x] 3.6 Implement fallback to hardcoded defaults on DB fetch failure

## 4. Update SystemSettings.jsx (admin)
- [x] 4.1 Add `Building2` and `ImageIcon` to lucide-react imports
- [x] 4.2 Add `clinic-locations` section to the sidebar sections array
- [x] 4.3 Add clinic location management state variables
- [x] 4.4 Add `useEffect` to load clinic locations when section is active
- [x] 4.5 Add handler functions: `loadClinicLocations`, `resetClinicForm`, `handleOpenClinicAddForm`, `handleOpenClinicEditForm`, `handleClinicFormChange`, `handleClinicFormSubmit`, `handleDeleteClinicLocation`
- [x] 4.6 Add `renderClinicLocationsSettings()` with full CRUD admin UI (list, add/edit form, delete)
- [x] 4.7 Add `'clinic-locations'` case to `renderContent` switch
