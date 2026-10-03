const assert = require('node:assert/strict');
const { validateCourse, courseInput, checkoutReturnOrigin } = require('../routes/brainCourses');

assert.deepEqual(validateCourse({
  slug: 'memory-course', title: 'Memory Course', author: 'Dr A', category: 'memory',
  course_url: 'https://academy.example/course', currency: 'INR', sale_price: 2999, is_free: false,
}), { valid: true });
assert.equal(validateCourse({ course_url: 'http://academy.example', sale_price: 1, currency: 'INR' }).valid, false);
assert.equal(validateCourse({ course_url: 'https://academy.example', sale_price: 0, currency: 'INR', is_free: false }).valid, false);
assert.deepEqual(courseInput({ title: 'YouTube course', course_url: 'https://youtu.be/example', original_price: '', sale_price: '29', is_free: false }), {
  title: 'YouTube course', course_url: 'https://youtu.be/example', original_price: null, sale_price: 29, is_free: false,
});
assert.equal(checkoutReturnOrigin('https://limitlessbrainlab.com', 'https://limitlessbrainlab-production.vercel.app'), 'https://limitlessbrainlab.com');
assert.equal(checkoutReturnOrigin('https://unexpected.example', 'https://limitlessbrainlab-production.vercel.app'), 'https://limitlessbrainlab-production.vercel.app');
console.log('brainCoursesRoute.test.cjs: ok');
