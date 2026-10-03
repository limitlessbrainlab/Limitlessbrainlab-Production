const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(path.join(__dirname, 'supabase/migrations/20261003114500_add_free_yoga_nidra_brain_course.sql'), 'utf8');

assert.match(migration, /'yoga-nidra'/);
assert.match(migration, /'https:\/\/drive\.google\.com\/file\/d\/1G7M7EiWU7tHzFkb0Gy6KIPNwUt1p3pn8\/view'/);
assert.match(migration, /is_free = true/);
assert.match(migration, /sale_price = null/);
console.log('test-brain-course-yoga-nidra.cjs: ok');
