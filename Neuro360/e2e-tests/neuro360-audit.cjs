const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const issues = [];
let screenshotIndex = 0;

async function screenshot(page, name) {
  const filename = path.join(SCREENSHOT_DIR, `${String(++screenshotIndex).padStart(2,'0')}-${name}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  return filename;
}

function logIssue(url, issue, severity) {
  issues.push({ url, issue, severity });
  console.log(`[${severity}] ${url} — ${issue}`);
}

async function collectConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  return errors;
}

async function waitForLoad(page, timeout = 8000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch {
    // continue even if networkidle times out
  }
}

async function checkForWhiteScreen(page, url) {
  const bodyText = await page.evaluate(() => document.body?.innerText?.trim() || '');
  const hasContent = bodyText.length > 50;
  if (!hasContent) logIssue(url, 'White screen or nearly empty page body', 'Critical');
}

async function checkBrokenImages(page, url) {
  const brokenImages = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs
      .filter(img => !img.complete || img.naturalWidth === 0)
      .map(img => img.src || img.getAttribute('src') || 'unknown src');
  });
  if (brokenImages.length > 0) {
    logIssue(url, `Broken images (${brokenImages.length}): ${brokenImages.slice(0,3).join(', ')}`, 'Medium');
  }
  return brokenImages.length;
}

async function checkOverflow(page, url) {
  const hasOverflow = await page.evaluate(() => {
    return document.body.scrollWidth > window.innerWidth + 5;
  });
  if (hasOverflow) logIssue(url, 'Horizontal overflow detected (layout issue)', 'Medium');
}

async function testLandingPage(page) {
  console.log('\n=== 1. LANDING PAGE ===');
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitForLoad(page);

  await screenshot(page, 'landing-page');
  await checkForWhiteScreen(page, BASE_URL);
  await checkBrokenImages(page, BASE_URL);
  await checkOverflow(page, BASE_URL);

  // Check h1 or main heading
  const headingCount = await page.locator('h1, h2').count();
  if (headingCount === 0) logIssue(BASE_URL, 'No headings found on landing page', 'High');

  // Check navigation
  const navLinks = await page.locator('nav a').count();
  if (navLinks === 0) logIssue(BASE_URL, 'No navigation links found', 'High');
  else console.log(`  Nav links found: ${navLinks}`);

  // Check pricing section
  const pricingSection = await page.locator('text=/pricing|price|plan|subscribe/i').count();
  if (pricingSection === 0) logIssue(BASE_URL, 'No pricing section visible on landing page', 'Medium');

  // Check contact form exists somewhere
  const contactLink = await page.locator('a[href*="contact"]').count();
  const contactBtn = await page.getByText('Contact Us', { exact: false }).count();
  if (contactLink === 0 && contactBtn === 0) logIssue(BASE_URL, 'No contact link/form found on landing page', 'Low');

  // Check footer
  const footer = await page.locator('footer').count();
  if (footer === 0) logIssue(BASE_URL, 'No footer element found', 'Low');

  if (errors.length > 0) {
    logIssue(BASE_URL, `Console errors: ${errors.slice(0,3).join(' | ')}`, 'High');
  }
  console.log(`  Console errors: ${errors.length}`);
  page.removeAllListeners('console');
  page.removeAllListeners('pageerror');
}

async function testLoginPage(page) {
  console.log('\n=== 2. LOGIN PAGE ===');
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitForLoad(page);

  await screenshot(page, 'login-page');
  await checkForWhiteScreen(page, `${BASE_URL}/login`);
  await checkBrokenImages(page, `${BASE_URL}/login`);

  // Check form elements
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
  const passwordInput = page.locator('input[type="password"]');
  const submitBtn = page.locator('button[type="submit"], button:has-text("login"), button:has-text("sign in")');

  const hasEmail = await emailInput.count() > 0;
  const hasPassword = await passwordInput.count() > 0;
  const hasSubmit = await submitBtn.count() > 0;

  if (!hasEmail) logIssue(`${BASE_URL}/login`, 'Email input not found', 'Critical');
  if (!hasPassword) logIssue(`${BASE_URL}/login`, 'Password input not found', 'Critical');
  if (!hasSubmit) logIssue(`${BASE_URL}/login`, 'Submit button not found', 'Critical');

  console.log(`  Email input: ${hasEmail}, Password: ${hasPassword}, Submit: ${hasSubmit}`);

  // Try invalid login — use force:true to bypass animation instability
  if (hasEmail && hasPassword && hasSubmit) {
    await emailInput.first().fill('invalid@test.com');
    await passwordInput.first().fill('wrongpassword123');
    // The button uses animate-bounce-soft which makes it "unstable" per Playwright
    // Use force click or wait for animation to settle
    try {
      await page.waitForTimeout(1500); // let bounce animation settle
      await submitBtn.first().click({ force: true, timeout: 5000 });
    } catch {
      // fallback: press Enter on the form
      await passwordInput.first().press('Enter');
    }
    await page.waitForTimeout(3000);

    const errorMsg = await page.locator('text=/invalid|error|incorrect|wrong|failed|not found/i').count();
    if (errorMsg === 0) {
      logIssue(`${BASE_URL}/login`, 'No error message shown for invalid login credentials', 'High');
    } else {
      console.log('  Error message shown for invalid credentials: OK');
    }
    await screenshot(page, 'login-invalid-credentials');
  }

  if (errors.length > 0) {
    logIssue(`${BASE_URL}/login`, `Console errors: ${errors.slice(0,3).join(' | ')}`, 'High');
  }
  page.removeAllListeners('console');
  page.removeAllListeners('pageerror');
}

async function testPricingPage(page) {
  console.log('\n=== 3. PRICING PAGE ===');
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitForLoad(page);

  await screenshot(page, 'pricing-page');
  await checkForWhiteScreen(page, `${BASE_URL}/pricing`);
  await checkBrokenImages(page, `${BASE_URL}/pricing`);
  await checkOverflow(page, `${BASE_URL}/pricing`);

  const pricingText = await page.locator('text=/\\$|₹|price|plan|per month/i').count();
  console.log(`  Pricing items visible: ${pricingText}`);

  if (errors.length > 0) logIssue(`${BASE_URL}/pricing`, `Console errors: ${errors.slice(0,2).join(' | ')}`, 'High');
  page.removeAllListeners('console');
}

async function testContactPage(page) {
  console.log('\n=== 4. CONTACT PAGE ===');
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto(`${BASE_URL}/contact`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitForLoad(page);

  await screenshot(page, 'contact-page');
  await checkForWhiteScreen(page, `${BASE_URL}/contact`);
  await checkBrokenImages(page, `${BASE_URL}/contact`);

  const form = await page.locator('form').count();
  if (form === 0) logIssue(`${BASE_URL}/contact`, 'No form found on contact page', 'High');

  if (errors.length > 0) logIssue(`${BASE_URL}/contact`, `Console errors: ${errors.slice(0,2).join(' | ')}`, 'High');
  page.removeAllListeners('console');
}

async function testAdminPanel(page, email, password) {
  console.log('\n=== 5. SUPER ADMIN PANEL ===');

  // Login first
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitForLoad(page);

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitBtn = page.locator('button[type="submit"]').first();

  if (await emailInput.count() > 0) {
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await submitBtn.click();
    await page.waitForTimeout(4000);
  }

  const currentUrl = page.url();
  console.log(`  After login redirect: ${currentUrl}`);

  // Navigate to admin
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitForLoad(page);

  const adminUrl = page.url();
  console.log(`  Admin URL: ${adminUrl}`);
  await screenshot(page, 'admin-panel');

  if (adminUrl.includes('/login') || adminUrl.includes('/access-denied')) {
    logIssue(`${BASE_URL}/admin`, 'Admin panel redirects to login — cannot test (no credentials)', 'Medium');
    return;
  }

  await checkForWhiteScreen(page, `${BASE_URL}/admin`);
  await checkBrokenImages(page, `${BASE_URL}/admin`);

  // Check sidebar tabs
  const tabs = ['Dashboard', 'Clinics', 'Reports', 'Payments', 'Analytics', 'Settings'];
  for (const tab of tabs) {
    const tabEl = page.locator(`text="${tab}", button:has-text("${tab}"), a:has-text("${tab}")`).first();
    if (await tabEl.count() > 0) {
      await tabEl.click();
      await page.waitForTimeout(2000);
      const errors = [];
      page.once('pageerror', err => errors.push(err.message));
      await checkForWhiteScreen(page, `${BASE_URL}/admin#${tab}`);
      await screenshot(page, `admin-tab-${tab.toLowerCase()}`);
      console.log(`  Admin tab "${tab}": loaded`);
      if (errors.length > 0) logIssue(`${BASE_URL}/admin`, `Tab "${tab}" console error: ${errors[0]}`, 'High');
    } else {
      logIssue(`${BASE_URL}/admin`, `Tab "${tab}" not found in admin sidebar`, 'Medium');
    }
  }
}

async function testClinicDashboard(page) {
  console.log('\n=== 6. CLINIC DASHBOARD ===');
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(`${BASE_URL}/clinic`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitForLoad(page);

  const clinicUrl = page.url();
  console.log(`  Clinic URL (may redirect): ${clinicUrl}`);

  await screenshot(page, 'clinic-dashboard');

  if (clinicUrl.includes('/login')) {
    logIssue(`${BASE_URL}/clinic`, 'Clinic dashboard redirects to login — not accessible without credentials', 'Medium');
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    return;
  }

  await checkForWhiteScreen(page, `${BASE_URL}/clinic`);
  await checkBrokenImages(page, `${BASE_URL}/clinic`);
  await checkOverflow(page, `${BASE_URL}/clinic`);

  const tabs = ['Overview', 'Patients', 'Reports', 'Subscription', 'Settings'];
  for (const tab of tabs) {
    const tabEl = page.locator(`text="${tab}", button:has-text("${tab}"), a:has-text("${tab}")`).first();
    if (await tabEl.count() > 0) {
      await tabEl.click();
      await page.waitForTimeout(2000);
      await screenshot(page, `clinic-tab-${tab.toLowerCase()}`);
      console.log(`  Clinic tab "${tab}": found and clicked`);
    } else {
      logIssue(`${BASE_URL}/clinic`, `Tab "${tab}" not found in clinic dashboard`, 'Medium');
    }
  }

  if (errors.length > 0) logIssue(`${BASE_URL}/clinic`, `Console errors: ${errors.slice(0,2).join(' | ')}`, 'High');
  page.removeAllListeners('console');
  page.removeAllListeners('pageerror');
}

async function testPatientDashboard(page) {
  console.log('\n=== 7. PATIENT DASHBOARD ===');
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(`${BASE_URL}/patient`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitForLoad(page);

  const patientUrl = page.url();
  console.log(`  Patient URL (may redirect): ${patientUrl}`);

  await screenshot(page, 'patient-dashboard');

  if (patientUrl.includes('/login')) {
    logIssue(`${BASE_URL}/patient`, 'Patient dashboard redirects to login — not accessible without credentials', 'Medium');
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    return;
  }

  await checkForWhiteScreen(page, `${BASE_URL}/patient`);
  await checkBrokenImages(page, `${BASE_URL}/patient`);
  await checkOverflow(page, `${BASE_URL}/patient`);

  if (errors.length > 0) logIssue(`${BASE_URL}/patient`, `Console errors: ${errors.slice(0,3).join(' | ')}`, 'High');
  page.removeAllListeners('console');
  page.removeAllListeners('pageerror');
}

async function testAdditionalPages(page) {
  console.log('\n=== 8. ADDITIONAL PUBLIC PAGES ===');

  const pagesToTest = [
    { url: `${BASE_URL}/about`, name: 'about' },
    { url: `${BASE_URL}/faq`, name: 'faq' },
    { url: `${BASE_URL}/science`, name: 'science' },
    { url: `${BASE_URL}/guide-to-brainwaves`, name: 'guide-brainwaves' },
    { url: `${BASE_URL}/brain-coach`, name: 'brain-coach' },
    { url: `${BASE_URL}/supplements-nootropics`, name: 'supplements' },
    { url: `${BASE_URL}/five-pillars`, name: 'five-pillars' },
  ];

  for (const { url, name } of pagesToTest) {
    const errors = [];
    const pageErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => pageErrors.push(err.message));

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const bodyText = await page.evaluate(() => document.body?.innerText?.trim() || '');

      if (bodyText.length < 50 && !currentUrl.includes('/login')) {
        logIssue(url, 'Page appears empty or crashed', 'High');
      }

      const brokenImgCount = await checkBrokenImages(page, url);
      await checkOverflow(page, url);

      if (errors.length > 0 || pageErrors.length > 0) {
        const allErrors = [...errors, ...pageErrors];
        logIssue(url, `Console/page errors: ${allErrors.slice(0,2).join(' | ')}`, 'High');
      }

      await screenshot(page, `page-${name}`);
      console.log(`  ${url}: OK (body chars: ${bodyText.length}, broken imgs: ${brokenImgCount}, errors: ${errors.length + pageErrors.length})`);
    } catch (e) {
      logIssue(url, `Failed to load: ${e.message}`, 'Critical');
    }

    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
  }
}

async function testForgotPassword(page) {
  console.log('\n=== 9. FORGOT PASSWORD ===');
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'domcontentloaded', timeout: 12000 });
  await waitForLoad(page);
  await screenshot(page, 'forgot-password');
  await checkForWhiteScreen(page, `${BASE_URL}/forgot-password`);
  await checkBrokenImages(page, `${BASE_URL}/forgot-password`);

  const emailInput = await page.locator('input[type="email"]').count();
  if (emailInput === 0) logIssue(`${BASE_URL}/forgot-password`, 'No email input on forgot password page', 'High');

  if (errors.length > 0) logIssue(`${BASE_URL}/forgot-password`, `Console errors: ${errors.slice(0,2).join(' | ')}`, 'High');
  page.removeAllListeners('console');
}

async function testMobileView(page) {
  console.log('\n=== 10. MOBILE RESPONSIVENESS ===');
  await page.setViewportSize({ width: 375, height: 812 }); // iPhone SE

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitForLoad(page);
  await screenshot(page, 'mobile-landing');
  await checkOverflow(page, `${BASE_URL} (mobile 375px)`);

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 12000 });
  await waitForLoad(page);
  await screenshot(page, 'mobile-login');
  await checkOverflow(page, `${BASE_URL}/login (mobile 375px)`);

  // Reset viewport
  await page.setViewportSize({ width: 1280, height: 800 });
}

async function main() {
  console.log('Starting Neuro360 E2E Audit...\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  const sections = [
    () => testLandingPage(page),
    () => testLoginPage(page),
    () => testPricingPage(page),
    () => testContactPage(page),
    () => testAdminPanel(page, 'admin@neuro360.com', 'admin123'),
    () => testClinicDashboard(page),
    () => testPatientDashboard(page),
    () => testAdditionalPages(page),
    () => testForgotPassword(page),
    () => testMobileView(page),
  ];

  for (const section of sections) {
    try {
      await section();
    } catch (err) {
      console.error('Section error (continuing):', err.message);
    }
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('ISSUES FOUND:');
  console.log('='.repeat(60));

  const critical = issues.filter(i => i.severity === 'Critical');
  const high = issues.filter(i => i.severity === 'High');
  const medium = issues.filter(i => i.severity === 'Medium');
  const low = issues.filter(i => i.severity === 'Low');

  console.log(`\nCRITICAL (${critical.length}):`);
  critical.forEach(i => console.log(`  • [${i.url}] ${i.issue}`));

  console.log(`\nHIGH (${high.length}):`);
  high.forEach(i => console.log(`  • [${i.url}] ${i.issue}`));

  console.log(`\nMEDIUM (${medium.length}):`);
  medium.forEach(i => console.log(`  • [${i.url}] ${i.issue}`));

  console.log(`\nLOW (${low.length}):`);
  low.forEach(i => console.log(`  • [${i.url}] ${i.issue}`));

  console.log(`\nTotal issues: ${issues.length}`);
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);

  // Write JSON report
  fs.writeFileSync(
    path.join(__dirname, 'audit-report.json'),
    JSON.stringify({ issues, screenshotDir: SCREENSHOT_DIR, totalIssues: issues.length }, null, 2)
  );
  console.log('Report saved to: e2e-tests/audit-report.json');
}

main().catch(console.error);
