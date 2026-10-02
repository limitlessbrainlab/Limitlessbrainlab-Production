const assert = require('node:assert/strict');
const { grantBrainCoursePurchase } = require('../services/brainCoursePurchase');

const inserted = [];
const supabase = { from: () => ({ insert: async (row) => { inserted.push(row); return { error: null }; } }) };
(async () => {
  const result = await grantBrainCoursePurchase({ session: { id: 'cs_1', payment_intent: 'pi_1', amount_total: 299900, currency: 'inr', customer_email: 'patient@example.com', metadata: { course_id: 'course-1', patient_id: 'patient-1' } }, supabase });
  assert.equal(result.ok, true);
  assert.deepEqual(inserted[0], { course_id: 'course-1', patient_id: 'patient-1', patient_email: 'patient@example.com', stripe_session_id: 'cs_1', stripe_payment_intent: 'pi_1', amount_paid: 2999, currency: 'INR' });
  console.log('brainCoursePurchase.test.cjs: ok');
})().catch((error) => { console.error(error); process.exitCode = 1; });
