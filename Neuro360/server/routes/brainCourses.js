const express = require('express');

const COURSE_FIELDS = ['slug', 'title', 'author', 'category', 'thumbnail_url', 'course_url', 'original_price', 'sale_price', 'currency', 'is_free', 'is_visible', 'sort_order'];

function validateCourse(course) {
  if (!course?.slug || !course?.title || !course?.course_url || !course?.currency) return { valid: false, message: 'Title, slug, course link, and currency are required.' };
  if (!/^https:\/\//.test(course.course_url)) return { valid: false, message: 'Course link must use HTTPS.' };
  if (!/^[A-Z]{3}$/.test(course.currency)) return { valid: false, message: 'Currency must be a three-letter ISO code.' };
  if (!course.is_free && !(Number(course.sale_price) > 0)) return { valid: false, message: 'A paid course needs a positive sale price.' };
  return { valid: true };
}

function courseInput(body) {
  const course = Object.fromEntries(COURSE_FIELDS.filter((key) => key in body).map((key) => [key, body[key]]));
  for (const field of ['original_price', 'sale_price']) {
    if (course[field] === '') course[field] = null;
    else if (course[field] != null) course[field] = Number(course[field]);
  }
  if (course.is_free) course.sale_price = null;
  return course;
}

module.exports = ({ supabase, stripe, frontendUrl, getPaymentMethodTypes }) => {
  const { authMiddleware } = require('../middleware/authMiddleware');
  const router = express.Router();
  const requireSuperAdmin = async (req, res, next) => {
    const { data, error } = await supabase.from('profiles').select('role').eq('id', req.user.id).maybeSingle();
    if (error || data?.role !== 'super_admin') return res.status(403).json({ success: false, message: 'Super Admin access is required.' });
    next();
  };
  router.get('/', async (_req, res) => {
    const { data, error } = await supabase.from('brain_courses').select('*').eq('is_visible', true).order('sort_order');
    if (error) return res.status(500).json({ success: false, message: 'Courses could not be loaded.' });
    res.json({ success: true, courses: data });
  });
  router.get('/access', authMiddleware, async (req, res) => {
    const { data, error } = await supabase.from('brain_course_purchases').select('course_id').eq('patient_id', req.user.id);
    if (error) return res.status(500).json({ success: false, message: 'Course access could not be loaded.' });
    res.json({ success: true, courseIds: data.map(({ course_id }) => course_id) });
  });
  router.post('/:id/checkout', authMiddleware, async (req, res) => {
    if (!stripe) return res.status(500).json({ success: false, message: 'Stripe is not configured.' });
    const { data: course, error } = await supabase.from('brain_courses').select('*').eq('id', req.params.id).eq('is_visible', true).maybeSingle();
    if (error || !course || course.is_free) return res.status(400).json({ success: false, message: 'This course is not available for purchase.' });
    const { data: owned } = await supabase.from('brain_course_purchases').select('id').eq('course_id', course.id).eq('patient_id', req.user.id).maybeSingle();
    if (owned) return res.status(409).json({ success: false, message: 'You already own this course.' });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: getPaymentMethodTypes(course.currency), mode: 'payment', customer_email: req.user.email,
      line_items: [{ price_data: { currency: course.currency.toLowerCase(), product_data: { name: course.title, images: course.thumbnail_url ? [course.thumbnail_url] : [] }, unit_amount: Math.round(Number(course.sale_price) * 100) }, quantity: 1 }],
      success_url: `${frontendUrl}/dashboard/brain-courses?course_payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/dashboard/brain-courses?course_payment=cancelled`,
      metadata: { type: 'brain_course', course_id: course.id, patient_id: req.user.id, customer_email: req.user.email || '' },
    });
    res.json({ success: true, checkoutUrl: session.url, sessionId: session.id });
  });
  router.use('/admin', authMiddleware, requireSuperAdmin);
  router.get('/admin', async (_req, res) => {
    const { data, error } = await supabase.from('brain_courses').select('*').order('sort_order');
    if (error) return res.status(500).json({ success: false, message: 'Courses could not be loaded.' });
    res.json({ success: true, courses: data });
  });
  router.post('/admin', async (req, res) => {
    const course = courseInput(req.body); const validation = validateCourse(course);
    if (!validation.valid) return res.status(400).json({ success: false, message: validation.message });
    const { data, error } = await supabase.from('brain_courses').insert(course).select().single();
    if (error) return res.status(400).json({ success: false, message: 'Course could not be saved.' });
    res.status(201).json({ success: true, course: data });
  });
  router.patch('/admin/:id', async (req, res) => {
    const course = courseInput(req.body); const { data: existing } = await supabase.from('brain_courses').select('*').eq('id', req.params.id).single(); const validation = validateCourse({ ...existing, ...course });
    if (!validation.valid) return res.status(400).json({ success: false, message: validation.message });
    const { data, error } = await supabase.from('brain_courses').update(course).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ success: false, message: 'Course could not be saved.' });
    res.json({ success: true, course: data });
  });
  return router;
};
module.exports.validateCourse = validateCourse;
module.exports.courseInput = courseInput;
