const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const server = fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8');

assert.match(server, /const loginClient = createClient\(supabaseUrl, supabaseServiceKey, \{ auth: \{ persistSession: false, autoRefreshToken: false \} \}\);/);
assert.match(server, /loginClient\.auth\.signInWithPassword/);
console.log('adminLoginClientIsolation.test.cjs: ok');
