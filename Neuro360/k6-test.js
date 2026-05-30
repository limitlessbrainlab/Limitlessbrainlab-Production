import http from 'k6/http';
import { check, sleep } from 'k6';

// Configure base URL — update if your server runs on a different port
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export const options = {
  stages: [
    { duration: '10s', target: 10 },  // ramp up to 10 users
    { duration: '30s', target: 10 },  // hold at 10 users
    { duration: '10s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.05'],   // less than 5% failures
  },
};

export default function () {
  // GET — static file / health check
  const uploads = http.get(`${BASE_URL}/uploads/placeholder.png`);
  check(uploads, {
    'uploads status 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  // GET — inquiries endpoint
  const inquiries = http.get(`${BASE_URL}/api/inquiries/partnership`);
  check(inquiries, {
    'inquiries status ok': (r) => r.status === 200,
  });

  // GET — website payments
  const payments = http.get(`${BASE_URL}/api/website-payments`);
  check(payments, {
    'payments status ok': (r) => r.status === 200,
  });

  // POST — contact form (read-only safe payload)
  const contactPayload = JSON.stringify({
    name: 'K6 Load Test',
    email: 'k6test@example.com',
    message: 'Load test — please ignore',
  });
  const contactRes = http.post(`${BASE_URL}/api/contact`, contactPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(contactRes, {
    'contact status ok': (r) => r.status === 200 || r.status === 201,
  });

  // POST — feedback
  const feedbackPayload = JSON.stringify({
    name: 'K6 Test',
    email: 'k6test@example.com',
    rating: 5,
    feedback: 'Automated load test feedback',
  });
  const feedbackRes = http.post(`${BASE_URL}/api/feedback`, feedbackPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(feedbackRes, {
    'feedback status ok': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);
}
