/**
 * Insert Privacy Policy / Legal Disclaimer into static_pages table
 * Run: node insert-privacy-policy.js
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const privacyPolicyContent = `
<div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.8;">

<h1 style="text-align: center; color: #323956; font-size: 28px; margin-bottom: 8px;">LEGAL DISCLAIMER – NEUROSENSE PLATFORM</h1>
<p style="text-align: center; color: #666; margin-bottom: 32px;"><strong>Effective Date:</strong> April 5, 2026</p>

<h2 style="color: #323956; border-bottom: 2px solid #F5D05D; padding-bottom: 6px;">1. INTRODUCTION</h2>
<p>This Disclaimer governs the use of the NeuroSense platform, including but not limited to its website, software, reports, assessments, tools, and services (collectively referred to as the "Platform").</p>
<p>By accessing or using the Platform, you ("User") acknowledge that you have read, understood, and agreed to be bound by this Disclaimer.</p>

<h2 style="color: #323956; border-bottom: 2px solid #F5D05D; padding-bottom: 6px;">2. NATURE OF SERVICES</h2>
<p>NeuroSense provides brain wellness, cognitive performance insights, and integrative lifestyle guidance based on data-driven and questionnaire-based assessments.</p>
<p>All information, content, and outputs provided through the Platform are intended solely for:</p>
<ul>
  <li>Educational purposes</li>
  <li>Informational purposes</li>
  <li>Wellness and performance optimization</li>
</ul>
<p><strong>The Platform does not provide medical advice, diagnosis, or treatment.</strong></p>

<h2 style="color: #323956; border-bottom: 2px solid #F5D05D; padding-bottom: 6px;">3. NON-MEDICAL DEVICE AND NON-DIAGNOSTIC TOOL</h2>
<p>The NeuroSense brain scan and associated assessments:</p>
<ul>
  <li>Are not medical devices</li>
  <li>Are not diagnostic tools</li>
  <li>Do not detect, diagnose, prevent, or treat any neurological, psychiatric, or medical condition</li>
</ul>
<p>The outputs generated (including but not limited to scores, indices, interpretations, and recommendations) are:</p>
<ul>
  <li>Indicative in nature</li>
  <li>Based on algorithmic and interpretative models</li>
  <li>Not a substitute for clinical investigation</li>
</ul>
<p>NeuroSense does not replace MRI, CT scan, clinical EEG, laboratory testing, or any other medical diagnostic procedure.</p>

<h2 style="color: #323956; border-bottom: 2px solid #F5D05D; padding-bottom: 6px;">4. PROFESSIONAL INTERPRETATION REQUIREMENT</h2>
<p>All outputs, reports, and recommendations generated through the Platform must be:</p>
<ul>
  <li>Interpreted by a qualified and licensed healthcare professional or a trained NeuroSense practitioner</li>
  <li>Considered in conjunction with the User's complete medical, psychological, and lifestyle profile</li>
</ul>
<p><strong>Users are strictly advised not to self-diagnose, self-medicate, or independently interpret results.</strong></p>

<h2 style="color: #323956; border-bottom: 2px solid #F5D05D; padding-bottom: 6px;">5. NO DOCTOR–PATIENT RELATIONSHIP</h2>
<p>Use of the Platform does not create:</p>
<ul>
  <li>A doctor–patient relationship</li>
  <li>A therapist–client relationship</li>
  <li>Any form of medical advisory relationship</li>
</ul>
<p>between the User and NeuroSense, Limitless Brain Lab, or any associated professionals.</p>

<h2 style="color: #323956; border-bottom: 2px solid #F5D05D; padding-bottom: 6px;">6. INTEGRATIVE WELLNESS RECOMMENDATIONS</h2>
<p>The Platform may provide recommendations including but not limited to:</p>
<ul>
  <li>Breathing practices and pranayama</li>
  <li>Meditation and neuro-meditation</li>
  <li>Nutritional guidance and supplements</li>
  <li>Lifestyle modifications</li>
  <li>Neurofeedback and neuromodulation approaches</li>
</ul>
<p>Such recommendations are:</p>
<ul>
  <li>General in nature</li>
  <li>Not personalized medical prescriptions</li>
  <li>To be followed at the User's discretion</li>
</ul>
<p>Users are advised to consult a qualified healthcare provider before initiating any intervention.</p>

<h2 style="color: #323956; border-bottom: 2px solid #F5D05D; padding-bottom: 6px;">7. LIMITATION OF LIABILITY</h2>
<p>To the fullest extent permitted by applicable law, NeuroSense, its affiliates, partners, directors, employees, and associated entities shall not be liable for:</p>
<ul>
  <li>Any direct, indirect, incidental, or consequential damages</li>
  <li>Any decisions made based on Platform outputs</li>
  <li>Any misuse or misinterpretation of reports or recommendations</li>
  <li>Any adverse outcomes arising from reliance on the Platform</li>
</ul>
<p><strong>All use of the Platform is at the User's sole risk.</strong></p>

<h2 style="color: #323956; border-bottom: 2px solid #F5D05D; padding-bottom: 6px;">8. NO WARRANTIES</h2>
<p>The Platform and all content are provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied, including but not limited to:</p>
<ul>
  <li>Accuracy</li>
  <li>Completeness</li>
  <li>Reliability</li>
  <li>Fitness for a particular purpose</li>
</ul>
<p>NeuroSense does not guarantee specific outcomes or results.</p>

<h2 style="color: #323956; border-bottom: 2px solid #F5D05D; padding-bottom: 6px;">9. SCIENTIFIC AND TECHNICAL LIMITATIONS</h2>
<p>The User acknowledges that:</p>
<ul>
  <li>Brain science, neuroscience, and integrative wellness are evolving fields</li>
  <li>Outputs are based on current models, algorithms, and available data</li>
  <li>Interpretations may vary across professionals</li>
</ul>
<p>NeuroSense reserves the right to update, modify, or change the Platform without prior notice.</p>

<h2 style="color: #323956; border-bottom: 2px solid #F5D05D; padding-bottom: 6px;">10. THIRD-PARTY LINKS AND SERVICES</h2>
<p>The Platform may contain links to third-party websites or services. NeuroSense:</p>
<ul>
  <li>Does not control or endorse third-party content</li>
  <li>Is not responsible for the accuracy, legality, or reliability of such content</li>
</ul>
<p>Use of third-party services is at the User's own risk.</p>

<h2 style="color: #323956; border-bottom: 2px solid #F5D05D; padding-bottom: 6px;">11. USER RESPONSIBILITY AND CONSENT</h2>
<p>By using the Platform, the User expressly agrees that:</p>
<ul>
  <li>They understand the non-medical nature of NeuroSense</li>
  <li>They will seek professional medical advice when required</li>
  <li>They assume full responsibility for their decisions and actions</li>
  <li>They will not rely solely on the Platform for health-related decisions</li>
</ul>

<h2 style="color: #323956; border-bottom: 2px solid #F5D05D; padding-bottom: 6px;">12. GOVERNING LAW</h2>
<p>This Disclaimer shall be governed by and construed in accordance with the laws of the United Arab Emirates, and any disputes shall be subject to the exclusive jurisdiction of the courts of the UAE.</p>

<h2 style="color: #323956; border-bottom: 2px solid #F5D05D; padding-bottom: 6px;">13. CONTACT INFORMATION</h2>
<p>For any questions, clarifications, or professional guidance, Users may contact NeuroSense through official communication channels provided on the Platform or via <a href="mailto:limitlessbrainlab@gmail.com" style="color: #323956;">limitlessbrainlab@gmail.com</a></p>

</div>
`;

async function insertPrivacyPolicy() {
  // Check if it already exists
  const { data: existing } = await supabase
    .from('static_pages')
    .select('id')
    .eq('slug', 'privacy-policy')
    .single();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('static_pages')
      .update({
        title: 'Privacy Policy & Legal Disclaimer',
        content: privacyPolicyContent,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('slug', 'privacy-policy');

    if (error) {
      console.error('Error updating privacy policy:', error);
    } else {
      console.log('Privacy policy updated successfully');
    }
  } else {
    // Insert new
    const { error } = await supabase
      .from('static_pages')
      .insert({
        title: 'Privacy Policy & Legal Disclaimer',
        slug: 'privacy-policy',
        content: privacyPolicyContent,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error inserting privacy policy:', error);
    } else {
      console.log('Privacy policy inserted successfully');
    }
  }
}

insertPrivacyPolicy();
