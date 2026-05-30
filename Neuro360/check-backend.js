/**
 * Backend Health Check Script
 * Run this to verify backend is running properly
 */

const http = require('http');

console.log('\n🔍 Checking Backend Server Status...\n');

// Test backend health endpoint
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Backend is RUNNING!');
      console.log('📡 Status Code:', res.statusCode);
      console.log('📄 Response:', data);
      console.log('\n✅ Backend is working correctly!\n');
      console.log('You can now test PDF generation in the app.');
    } else {
      console.log('⚠️  Backend responded but with error');
      console.log('📡 Status Code:', res.statusCode);
      console.log('📄 Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Backend is NOT RUNNING!');
  console.log('📛 Error:', error.message);
  console.log('\n🔧 To fix this, run one of these commands:\n');
  console.log('   Option 1: npm run dev:backend');
  console.log('   Option 2: cd server && npm start');
  console.log('   Option 3: npm run dev:full (starts frontend + backend)\n');
});

req.on('timeout', () => {
  console.log('⏱️  Backend health check timed out');
  console.log('Backend might be starting or unresponsive');
  req.destroy();
});

req.end();
