/**
 * Utility to verify and fix report records
 * Run this from browser console on the Reports page
 */

export async function verifyAndFixReports() {

  // Import the Supabase service
  const { default: SupabaseService } = await import('../services/supabaseService.js');
  const supabaseService = new SupabaseService();

  try {
    // Get all reports
    const { data: reports, error } = await supabaseService.supabase
      .from('reports')
      .select('*');

    if (error) {
      console.error('ERROR: Error fetching reports:', error);
      return { success: false, error };
    }


    if (!reports || reports.length === 0) {
      return { success: true, message: 'No reports found' };
    }

    // Analyze reports
    const reportsWithOrgId = reports.filter(r => r.org_id);
    const reportsWithoutOrgId = reports.filter(r => !r.org_id);


    // Show all reports with details
    reports.forEach((report, index) => {
    });

    // Fix reports without org_id
    let fixedCount = 0;
    if (reportsWithoutOrgId.length > 0) {

      for (const report of reportsWithoutOrgId) {
        const clinicIdToUse = report.clinic_id;

        if (clinicIdToUse) {

          const { error: updateError } = await supabaseService.supabase
            .from('reports')
            .update({ org_id: clinicIdToUse })
            .eq('id', report.id);

          if (updateError) {
            console.error(`    ERROR: Failed to update report ${report.id}:`, updateError);
          } else {
            fixedCount++;
          }
        } else {
          console.warn(`    WARNING: Report ${report.id} has no clinic_id to use!`);
        }
      }

    } else {
    }

    return {
      success: true,
      total: reports.length,
      withOrgId: reportsWithOrgId.length,
      withoutOrgId: reportsWithoutOrgId.length,
      fixed: fixedCount
    };

  } catch (error) {
    console.error('ERROR: Unexpected error:', error);
    return { success: false, error };
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.verifyAndFixReports = verifyAndFixReports;
}
