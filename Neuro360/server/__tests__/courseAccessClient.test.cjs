const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const client = fs.readFileSync(path.join(__dirname, '../../src/services/apiClient.js'), 'utf8');
const courses = fs.readFileSync(path.join(__dirname, '../../src/pages/BrainCourses.jsx'), 'utf8');

assert.match(client, /localStorage\.getItem\('authToken'\)/);
assert.match(client, /!error\.config\?\.skipAuthRedirect/);
assert.match(courses, /skipAuthRedirect:\s*true/);
assert.match(courses, /Promise\.allSettled/);
console.log('courseAccessClient.test.cjs: ok');
