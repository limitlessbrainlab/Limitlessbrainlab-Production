-- ========================================
-- Static Pages Table
-- Manages CMS content for static pages (Privacy Policy, Terms of Service, Cookie Policy)
-- Editable from the SuperAdmin panel
-- ========================================
-- Execute this SQL in Supabase Dashboard > SQL Editor

-- Create static_pages table
CREATE TABLE IF NOT EXISTS static_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,              -- e.g. 'privacy-policy', 'terms-of-service', 'cookie-policy'
  title TEXT NOT NULL,
  content TEXT NOT NULL,                  -- HTML content (rich text)
  is_active BOOLEAN DEFAULT TRUE,
  updated_by TEXT,                        -- admin email who last updated
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Indexes
-- ========================================

-- Index on slug for efficient lookups
CREATE INDEX IF NOT EXISTS idx_static_pages_slug
  ON static_pages (slug);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

-- Enable RLS on the table
ALTER TABLE static_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow full read access (anon + authenticated)
CREATE POLICY "Allow public read access"
ON static_pages
FOR SELECT
TO anon, authenticated
USING (TRUE);

-- Policy: Allow insert (anon + authenticated - app handles auth)
CREATE POLICY "Allow insert"
ON static_pages
FOR INSERT
TO anon, authenticated
WITH CHECK (TRUE);

-- Policy: Allow update (anon + authenticated - app handles auth)
CREATE POLICY "Allow update"
ON static_pages
FOR UPDATE
TO anon, authenticated
USING (TRUE)
WITH CHECK (TRUE);

-- Policy: Allow delete (anon + authenticated - app handles auth)
CREATE POLICY "Allow delete"
ON static_pages
FOR DELETE
TO anon, authenticated
USING (TRUE);

-- ========================================
-- Seed Data: Default Static Pages
-- ========================================

INSERT INTO static_pages (slug, title, content) VALUES
('privacy-policy', 'Privacy Policy', '<h2>Privacy Policy</h2>
<p><strong>Effective Date:</strong> January 1, 2025</p>
<p>Limitless Brain Lab ("we", "us", or "our") operates the NeuroSense360 platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.</p>

<h3>1. Information We Collect</h3>
<p>We may collect personal information that you voluntarily provide, including but not limited to:</p>
<ul>
<li>Name, email address, phone number</li>
<li>Brain health assessment responses</li>
<li>Payment information (processed securely via Stripe)</li>
<li>Communication preferences</li>
</ul>

<h3>2. How We Use Your Information</h3>
<p>We use the information we collect to:</p>
<ul>
<li>Provide and maintain our brain health assessment services</li>
<li>Process transactions and send related information</li>
<li>Send you technical notices and support messages</li>
<li>Respond to your comments, questions, and requests</li>
<li>Improve our services and develop new features</li>
</ul>

<h3>3. Data Security</h3>
<p>We implement appropriate technical and organizational security measures to protect your personal data. All assessment data is encrypted and stored securely.</p>

<h3>4. Third-Party Services</h3>
<p>We may use third-party services such as Stripe for payment processing, JotForm for assessments, and analytics tools. These services have their own privacy policies.</p>

<h3>5. Your Rights</h3>
<p>You have the right to access, update, or delete your personal information. Contact us at info@limitlessbrainlab.com for any privacy-related requests.</p>

<h3>6. Contact Us</h3>
<p>If you have questions about this Privacy Policy, please contact us at:<br/>Email: info@limitlessbrainlab.com</p>'),

('terms-of-service', 'Terms of Service', '<h2>Terms of Service</h2>
<p><strong>Effective Date:</strong> January 1, 2025</p>
<p>Welcome to NeuroSense360. By accessing or using our services, you agree to be bound by these Terms of Service.</p>

<h3>1. Services</h3>
<p>NeuroSense360 provides brain health assessments, cognitive performance evaluations, and related neurological consultation services through our platform.</p>

<h3>2. User Accounts</h3>
<p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>

<h3>3. Payment Terms</h3>
<p>Certain services require payment. All payments are processed securely through Stripe. Prices are displayed in USD, AED, and INR as applicable.</p>

<h3>4. Intellectual Property</h3>
<p>All content, assessments, algorithms, and materials on the platform are owned by Limitless Brain Lab and protected by intellectual property laws.</p>

<h3>5. Disclaimer</h3>
<p>Our assessments are for informational purposes and do not constitute medical diagnosis. Always consult a qualified healthcare professional for medical advice.</p>

<h3>6. Limitation of Liability</h3>
<p>Limitless Brain Lab shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.</p>

<h3>7. Contact</h3>
<p>For questions regarding these terms, contact us at info@limitlessbrainlab.com</p>'),

('cookie-policy', 'Cookie Policy', '<h2>Cookie Policy</h2>
<p><strong>Effective Date:</strong> January 1, 2025</p>
<p>This Cookie Policy explains how NeuroSense360 uses cookies and similar technologies.</p>

<h3>1. What Are Cookies</h3>
<p>Cookies are small text files stored on your device when you visit our website. They help us provide a better user experience.</p>

<h3>2. Types of Cookies We Use</h3>
<ul>
<li><strong>Essential Cookies:</strong> Required for the platform to function properly (authentication, security).</li>
<li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our platform.</li>
<li><strong>Preference Cookies:</strong> Remember your settings and preferences.</li>
</ul>

<h3>3. Managing Cookies</h3>
<p>You can control cookies through your browser settings. Note that disabling certain cookies may affect platform functionality.</p>

<h3>4. Contact</h3>
<p>For questions about our cookie practices, contact us at info@limitlessbrainlab.com</p>');
