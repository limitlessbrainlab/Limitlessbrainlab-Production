import SupabaseService from './services/supabaseService.js';

// Test Supabase connection and data operations
async function testSupabaseIntegration() {

  try {
    // 1. Test connection
    const clinics = await SupabaseService.get('clinics');

    // 2. Test adding a clinic
    const testClinic = {
      name: 'Test Clinic ' + Date.now(),
      email: `test${Date.now()}@clinic.com`,
      phone: '555-0123',
      address: '123 Test Street',
      is_active: true,
      reports_used: 0,
      reports_allowed: 10,
      subscription_status: 'trial'
    };

    const addedClinic = await SupabaseService.add('clinics', testClinic);

    // 3. Test finding by ID
    const foundClinic = await SupabaseService.findById('clinics', addedClinic.id);

    // 4. Test updating
    const updated = await SupabaseService.update('clinics', addedClinic.id, {
      name: 'Updated Test Clinic'
    });

    // 5. Test finding by field
    const foundByEmail = await SupabaseService.findOne('clinics', 'email', addedClinic.email);

    // 6. Test delete
    await SupabaseService.delete('clinics', addedClinic.id);

    // 7. Verify deletion
    const deletedClinic = await SupabaseService.findById('clinics', addedClinic.id);


    // Show current data stats
    const allClinics = await SupabaseService.get('clinics');
    const allPatients = await SupabaseService.get('patients');
    const allReports = await SupabaseService.get('reports');


  } catch (error) {
    console.error('ERROR: Test failed:', error);
    console.error('Error details:', error.message);

    if (error.code === '42P01') {
    }
  }
}

// Run the test
testSupabaseIntegration();