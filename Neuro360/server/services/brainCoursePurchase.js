async function grantBrainCoursePurchase({ session, supabase }) {
  const courseId = session?.metadata?.course_id;
  const patientId = session?.metadata?.patient_id;
  const patientEmail = session?.customer_email || session?.metadata?.customer_email;
  if (!courseId || !patientId || !patientEmail || !session?.id) return { ok: false, message: 'Incomplete course purchase metadata.' };
  const { error } = await supabase.from('brain_course_purchases').insert({
    course_id: courseId,
    patient_id: patientId,
    patient_email: patientEmail.toLowerCase(),
    stripe_session_id: session.id,
    stripe_payment_intent: session.payment_intent || null,
    amount_paid: (session.amount_total || 0) / 100,
    currency: (session.currency || 'USD').toUpperCase()
  });
  if (!error) return { ok: true, alreadyGranted: false };
  if (error.code === '23505') return { ok: true, alreadyGranted: true };
  return { ok: false, message: error.message };
}

module.exports = { grantBrainCoursePurchase };
