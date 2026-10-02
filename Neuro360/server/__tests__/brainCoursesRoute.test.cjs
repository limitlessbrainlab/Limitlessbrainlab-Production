const assert = require('node:assert/strict');
const { validateCourse } = require('../routes/brainCourses');

assert.deepEqual(validateCourse({
  slug: 'memory-course', title: 'Memory Course', author: 'Dr A', category: 'memory',
  course_url: 'https://academy.example/course', currency: 'INR', sale_price: 2999, is_free: false,
}), { valid: true });
assert.equal(validateCourse({ course_url: 'http://academy.example', sale_price: 1, currency: 'INR' }).valid, false);
assert.equal(validateCourse({ course_url: 'https://academy.example', sale_price: 0, currency: 'INR', is_free: false }).valid, false);
console.log('brainCoursesRoute.test.cjs: ok');
