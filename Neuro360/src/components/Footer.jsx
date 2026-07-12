import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Linkedin, Facebook, Youtube, Instagram } from 'lucide-react';
import { WHATSAPP_URL } from '../config/whatsapp';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useContactForm } from '../context/ContactFormContext';
import { useProfessionalForm } from '../context/ProfessionalFormContext';
import { useProgramForm } from '../context/ProgramFormContext';
import DemoReportPopup from './DemoReportPopup';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const Footer = () => {
  const navigate = useNavigate();
  const { openContactForm } = useContactForm();
  const { openProfessionalForm } = useProfessionalForm();
  const { openProgramForm } = useProgramForm();
  const [formData, setFormData] = useState({
    email: '',
    country_code: '+91',
    contact_number: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquiryType, setInquiryType] = useState('partnership');
  const [showDemoReport, setShowDemoReport] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'contact_number'
      ? value.replace(/\D/g, '').slice(0, 10)
      : value;
    setFormData(prev => ({
      ...prev,
      [name]: nextValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.email.trim() || !formData.contact_number.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!/^\d{10}$/.test(formData.contact_number.trim())) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSubmitting(true);

    const fullContactNumber = `${formData.country_code} ${formData.contact_number.trim()}`;

    try {
      // Save to Supabase (using 'name' column to store email)
      const { data, error } = await supabase
        .from('franchise_inquiries')
        .insert([
          {
            name: formData.email.trim(),
            contact_number: fullContactNumber,
            inquiry_type: inquiryType
          }
        ]);

      if (error) throw error;

      // Send email notification via backend API
      try {
        const emailResponse = await fetch(`${API_BASE_URL}/partnership-inquiry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email.trim(),
            contact_number: fullContactNumber,
            inquiry_type: inquiryType
          })
        });

        const emailResult = await emailResponse.json();

        if (emailResult.success) {
        } else {
          console.error('Email notification failed:', emailResult.message);
        }
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't fail the whole submission if email fails
      }

      toast.success('Inquiry submitted successfully! We will contact you soon.');

      // Reset form
      setFormData({
        email: '',
        country_code: '+91',
        contact_number: ''
      });
    } catch (error) {
      console.error('Error submitting franchise inquiry:', error);
      toast.error('Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <footer className="bg-black text-white py-8 sm:py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-6 md:gap-8">
          {/* Left Column - Brand & Socials */}
          <div className="sm:col-span-2 md:col-span-1 space-y-4 sm:space-y-6 flex flex-col items-center sm:items-start">
            {/* Logo */}
            <div className="flex items-center justify-center sm:justify-start">
              <img
                src="/IBW Logo.png"
                alt="Limitless Brain Lab"
                className="h-16 sm:h-24 md:h-32 w-16 sm:w-24 md:w-32 max-w-[80px] sm:max-w-[120px] md:max-w-none object-contain"
              />
            </div>

            {/* Socials */}
            <div className="w-full flex flex-col items-center sm:items-start">
              <h3 className="text-xs sm:text-sm md:text-lg font-semibold text-gray-400 uppercase tracking-wider mb-3 sm:mb-4">Socials</h3>
              <div className="flex gap-3">
                <a href="https://www.linkedin.com/in/drswetaadatia/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-8 sm:h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors">
                  <Linkedin className="h-4 w-4" />
                </a>
                <a href="https://www.facebook.com/sweta.adatia" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-8 sm:h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="https://www.youtube.com/@drsweta.adatia" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-8 sm:h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors" title="YouTube English">
                  <Youtube className="h-4 w-4" />
                </a>
                <a href="https://www.youtube.com/@drsweta.adatiahindi" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-8 sm:h-8 bg-red-800 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors" title="YouTube Hindi">
                  <Youtube className="h-4 w-4" />
                </a>
                <a href="https://www.instagram.com/drsweta.adatia/?hl=en" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-8 sm:h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-8 sm:h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              </div>
            </div>

          </div>

          {/* Quick Links Column */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-sm md:text-lg font-semibold text-gray-400 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3 sm:space-y-3">
              <li key="demo-report"><button onClick={() => setShowDemoReport(true)} className="text-sm sm:text-sm md:text-base hover:text-[#F5D05D] transition-colors text-left">Request Demo Report</button></li>
              <li key="guide"><Link to="/guide-to-brainwaves" className="text-sm sm:text-sm md:text-base hover:text-[#F5D05D] transition-colors">Guide to Brainwaves</Link></li>
              {/* <li key="brochure"><a href="/assets/neurosense brochure.pdf" download className="text-sm sm:text-sm md:text-base hover:text-[#F5D05D] transition-colors">Download Brochure</a></li> */}
              {/* <li key="clinics"><Link to="/technicians" className="text-sm sm:text-sm md:text-base hover:text-[#F5D05D] transition-colors">For Clinics</Link></li> */}
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-sm md:text-lg font-semibold text-gray-400 uppercase tracking-wider">Resources</h3>
            <ul className="space-y-3 sm:space-y-3">
              <li key="limitless-brain-lab"><a href="https://www.limitlessbrainacademy.com" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-sm md:text-base hover:text-[#F5D05D] transition-colors">Limitless Brain Academy</a></li>
              {/* <li key="practice"><Link to="/about-us" className="text-sm sm:text-sm md:text-base hover:text-[#F5D05D] transition-colors">Neuropsychiatry Practice</Link></li> */}
              <li key="faq"><Link to="/faq" className="text-sm sm:text-sm md:text-base hover:text-[#F5D05D] transition-colors">100X Brain Optimisation Program</Link></li>
            </ul>
          </div>

          {/* Company & Franchise Column */}
          <div className="sm:col-span-2 md:col-span-1 space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-sm md:text-lg font-semibold text-gray-400 uppercase tracking-wider">Company</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li><Link to="/page/privacy-policy" className="text-sm sm:text-sm md:text-base hover:text-[#F5D05D] transition-colors">Privacy Policy</Link></li>
            </ul>

            {/* Login Buttons */}
            <div className="mt-3 sm:mt-4 flex flex-row gap-2">
              <button
                onClick={() => navigate('/patient/login')}
                className="bg-[#323956] hover:bg-[#232D3C] text-white px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 transform hover:scale-105 text-center cursor-pointer"
              >
                Patient Login
              </button>
              <button
                onClick={() => navigate('/clinic/login')}
                className="bg-[#323956] hover:bg-[#232D3C] text-white px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 transform hover:scale-105 text-center cursor-pointer"
              >
                Clinic Login
              </button>
            </div>

            {/* Partnership / Investment Inquiry Form - Responsive */}
            <div className="mt-4 sm:mt-6 p-4 sm:p-5 md:p-8 bg-[#F5D05D]/20 rounded-xl border border-[#F5D05D]/30 shadow-lg">
              {/* Inquiry Type Toggle */}
              <div className="flex gap-2 mb-3 sm:mb-4">
                <button
                  type="button"
                  onClick={() => setInquiryType('partnership')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${inquiryType === 'partnership' ? 'bg-[#F5D05D] text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                >
                  Partnership Inquiry
                </button>
                <button
                  type="button"
                  onClick={() => setInquiryType('investment')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${inquiryType === 'investment' ? 'bg-[#F5D05D] text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                >
                  Investment Inquiry
                </button>
              </div>
              <p className="text-[#F5D05D] text-xs sm:text-sm mb-3 italic">Equity Investments Also Open — Inquire for investment</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Email Input */}
                <div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Your email"
                    className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5D05D] transition-all"
                    required
                  />
                </div>

                {/* Country Code + Phone Number */}
                <div className="w-full flex gap-2">
                  <select
                    name="country_code"
                    value={formData.country_code}
                    onChange={handleInputChange}
                    className="w-[108px] sm:w-28 px-1 sm:px-2 py-2.5 bg-gray-800 text-white rounded-lg text-[10px] sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F5D05D] transition-all flex-shrink-0"
                  >
                    <option value="+91">🇮🇳+91</option>
                    <option value="+971">🇦🇪+971</option>
                    <option value="+1">🇺🇸+1</option>
                    <option value="+44">🇬🇧+44</option>
                    <option value="+966">🇸🇦+966</option>
                    <option value="+974">🇶🇦+974</option>
                    <option value="+965">🇰🇼+965</option>
                    <option value="+968">🇴🇲+968</option>
                    <option value="+973">🇧🇭+973</option>
                    <option value="+20">🇪🇬+20</option>
                    <option value="+961">🇱🇧+961</option>
                    <option value="+962">🇯🇴+962</option>
                    <option value="+92">🇵🇰+92</option>
                    <option value="+880">🇧🇩+880</option>
                    <option value="+94">🇱🇰+94</option>
                  </select>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    className="flex-1 min-w-0 px-3 py-2.5 bg-gray-800 text-white rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5D05D] transition-all"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 sm:py-3 bg-[#F5D05D] hover:bg-[#E5C04D] text-gray-900 rounded-lg text-sm md:text-base font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    inquiryType === 'partnership' ? 'Submit Partnership Inquiry' : 'Submit Investment Inquiry'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Short Disclaimer */}
        <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-7 md:pt-8 border-t border-gray-800">
          <p className="text-[10px] sm:text-xs text-gray-500 text-center max-w-4xl mx-auto leading-relaxed mb-4">
            <strong>Disclaimer:</strong> NeuroSense provides educational and wellness-based brain insights. The NeuroSense scan is not a medical or diagnostic tool and does not replace clinical evaluation. All reports must be interpreted by a qualified professional. Please consult your healthcare provider for any medical concerns.
          </p>
          <div className="text-center">
            <p className="text-xs sm:text-sm md:text-base text-gray-400">&copy; 2026 Limitless Brain Lab. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
    <DemoReportPopup isOpen={showDemoReport} onClose={() => setShowDemoReport(false)} />
    </>
  );
};

export default Footer;
