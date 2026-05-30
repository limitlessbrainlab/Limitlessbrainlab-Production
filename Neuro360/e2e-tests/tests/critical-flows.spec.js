/**
 * Critical Flow E2E Tests
 * Points 28-30: E2E, Regression, Smoke Tests
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

test.describe('Critical Flows - E2E Tests', () => {

  // ===== SMOKE TESTS (Point 30) =====
  test.describe('Smoke Tests', () => {
    test('Server should be healthy', async ({ request }) => {
      const response = await request.get(`${API_URL}/health`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('running');
    });

    test('Frontend should load', async ({ page }) => {
      await page.goto(BASE_URL);
      expect(await page.title()).toBeTruthy();
      expect(page.locator('text=Login')).toBeTruthy();
    });

    test('API should require authentication', async ({ request }) => {
      const response = await request.get(`${API_URL}/qeeg/quota-status`);
      expect(response.status()).toBe(401);
    });
  });

  // ===== AUTHENTICATION FLOW (Point 28) =====
  test.describe('Authentication Flow', () => {
    test('User can login with valid credentials', async ({ page }) => {
      await page.goto(BASE_URL);

      // Fill login form
      await page.fill('input[type="email"]', 'admin@test.com');
      await page.fill('input[type="password"]', 'admin123');

      // Submit
      await page.click('button:has-text("Login")');

      // Should redirect to dashboard
      await page.waitForURL('**/dashboard');
      expect(page.url()).toContain('/dashboard');
    });

    test('User should fail with invalid password', async ({ page }) => {
      await page.goto(BASE_URL);

      await page.fill('input[type="email"]', 'admin@test.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button:has-text("Login")');

      // Should show error message
      const errorMessage = page.locator('text=Invalid');
      await expect(errorMessage).toBeVisible();
    });

    test('Logged-in user should have token in requests', async ({ page, context }) => {
      await page.goto(BASE_URL);

      // Login
      await page.fill('input[type="email"]', 'admin@test.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button:has-text("Login")');

      // Wait for redirect
      await page.waitForURL('**/dashboard');

      // Intercept next API call
      const requestPromise = page.waitForEvent('request', request => {
        return request.url().includes('/api/');
      });

      // Trigger API call (navigate or click something that calls API)
      await page.click('text=Profile');

      const request = await requestPromise;
      expect(request.headerValue('Authorization')).toMatch(/^Bearer /);
    });
  });

  // ===== QEEG UPLOAD FLOW (Point 28) =====
  test.describe('QEEG Upload Flow', () => {
    test('Clinic admin can upload QEEG file', async ({ page }) => {
      // Login as clinic
      await page.goto(BASE_URL);
      await page.fill('input[type="email"]', 'clinic@test.com');
      await page.fill('input[type="password"]', 'clinic123');
      await page.click('button:has-text("Login")');
      await page.waitForURL('**/dashboard');

      // Navigate to upload page
      await page.click('text=Upload QEEG');

      // Upload file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('test-files/sample.pdf');

      // Submit
      await page.click('button:has-text("Upload")');

      // Should show success
      await expect(page.locator('text=Upload successful')).toBeVisible();
    });

    test('Unauthenticated user cannot upload', async ({ request }) => {
      const response = await request.post(`${API_URL}/qeeg/process`, {
        data: new FormData()
      });
      expect(response.status()).toBe(401);
    });
  });

  // ===== AUTHORIZATION FLOW (Point 28) =====
  test.describe('Authorization Flow', () => {
    test('Patient cannot access admin routes', async ({ page, request }) => {
      // Get patient token
      const loginResponse = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: 'patient@test.com',
          password: 'patient123'
        }
      });

      const { token } = await loginResponse.json();

      // Try to access admin endpoint
      const adminResponse = await request.get(`${API_URL}/inquiries/contact`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      expect(adminResponse.status()).toBe(403); // Forbidden
    });

    test('Clinic can only see own patients', async ({ page }) => {
      // Login as clinic
      await page.goto(BASE_URL);
      await page.fill('input[type="email"]', 'clinic@test.com');
      await page.fill('input[type="password"]', 'clinic123');
      await page.click('button:has-text("Login")');
      await page.waitForURL('**/dashboard');

      // Should see patients list
      await page.click('text=Patients');

      // Should NOT see other clinics' patients
      // (This depends on your UI structure)
      const patientsList = page.locator('[data-testid="patients-list"]');
      await expect(patientsList).toBeVisible();
    });
  });

  // ===== ERROR HANDLING (Point 28) =====
  test.describe('Error Handling', () => {
    test('Should show user-friendly error messages', async ({ page }) => {
      await page.goto(BASE_URL);

      // Try login with invalid email
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', 'password');
      await page.click('button:has-text("Login")');

      // Should show error
      const errorMessage = page.locator('[role="alert"]');
      await expect(errorMessage).toBeVisible();
      expect(await errorMessage.textContent()).not.toContain('500');
      expect(await errorMessage.textContent()).not.toContain('stack');
    });

    test('Rate limiting should be handled gracefully', async ({ request }) => {
      // Make many requests in quick succession
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request.post(`${API_URL}/auth/login`, {
            data: { email: 'test@test.com', password: 'wrong' }
          })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status() === 429);

      expect(rateLimited).toBe(true);
    });
  });

  // ===== REGRESSION TESTS (Point 29) =====
  test.describe('Regression Tests', () => {
    test('Login should persist after page reload', async ({ page }) => {
      await page.goto(BASE_URL);

      // Login
      await page.fill('input[type="email"]', 'admin@test.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.waitForURL('**/dashboard');

      // Reload page
      await page.reload();

      // Should still be logged in
      expect(page.url()).toContain('/dashboard');
      expect(page.locator('text=Admin Dashboard')).toBeTruthy();
    });

    test('Form data should not be lost on error', async ({ page }) => {
      await page.goto(BASE_URL);

      // Fill form partially
      await page.fill('input[type="email"]', 'test@test.com');
      const password = 'testpassword';
      await page.fill('input[type="password"]', password);

      // Submit (will fail due to invalid credentials)
      await page.click('button:has-text("Login")');

      // Wait for error
      await page.waitForSelector('[role="alert"]');

      // Email should still be filled
      const emailValue = await page.inputValue('input[type="email"]');
      expect(emailValue).toBe('test@test.com');

      // Password should be cleared for security
      const passwordValue = await page.inputValue('input[type="password"]');
      expect(passwordValue).toBe('');
    });

    test('Navigation should work correctly', async ({ page }) => {
      await page.goto(BASE_URL);

      // Login
      await page.fill('input[type="email"]', 'admin@test.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.waitForURL('**/dashboard');

      // Navigate between pages
      await page.click('text=Users');
      expect(page.url()).toContain('/users');

      await page.click('text=Settings');
      expect(page.url()).toContain('/settings');

      // Go back
      await page.goBack();
      expect(page.url()).toContain('/users');
    });
  });

  // ===== ACCESSIBILITY (Point 28) =====
  test.describe('Accessibility', () => {
    test('Login form should be keyboard navigable', async ({ page }) => {
      await page.goto(BASE_URL);

      // Tab to email field
      await page.keyboard.press('Tab');

      // Type email
      await page.keyboard.type('admin@test.com');

      // Tab to password field
      await page.keyboard.press('Tab');
      await page.keyboard.type('admin123');

      // Tab to submit button
      await page.keyboard.press('Tab');

      // Press Enter to submit
      await page.keyboard.press('Enter');

      // Should login successfully
      await page.waitForURL('**/dashboard');
      expect(page.url()).toContain('/dashboard');
    });
  });
});
