import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, BarChart3, Shield, CheckCircle, Users, Brain, User, Mail, Phone as PhoneIcon, MapPin, Building, Award, Briefcase, Clock, X } from 'lucide-react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useContactForm } from '../context/ContactFormContext';
import { toast } from 'react-hot-toast';
import { countryCodes } from '../utils/countryCodes';
import { supabase } from '../lib/supabaseClient';

const OnboardingPopup = ({ isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', email: '', countryCode: '+91', phone: '', cityCountry: '',
    organization: '', certifications: '', professionalCategory: [], otherCategory: '',
    yearsExperience: '', clientSegments: [], otherSegments: ''
  });

  const professionalCategories = [
    'Life / Executive / Performance Coach', 'Wellness & Holistic Practitioner',
    'Therapist (Non-clinical)', 'Educator / Student Mentor',
    'Yoga & Meditation Facilitator', 'Breathwork / Mind-Body Practitioner',
    'Integrative Health Professional', 'Other'
  ];
  const experienceOptions = ['<1 year', '1-3 years', '3-7 years', '7-12 years', '12+ years'];
  const clientSegmentOptions = [
    'Children & Teens', 'College Students', 'Working Professionals', 'Corporate Leaders',
    'Athletes / Performers', 'Individuals with Stress/Anxiety', 'Wellness & Lifestyle Clients', 'Others'
  ];

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleCategoryChange = (cat) => setFormData(prev => ({
    ...prev, professionalCategory: prev.professionalCategory.includes(cat)
      ? prev.professionalCategory.filter(c => c !== cat) : [...prev.professionalCategory, cat]
  }));
  const handleSegmentChange = (seg) => setFormData(prev => ({
    ...prev, clientSegments: prev.clientSegments.includes(seg)
      ? prev.clientSegments.filter(s => s !== seg) : [...prev.clientSegments, seg]
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone || !formData.cityCountry) {
      toast.error('Please fill in all required fields'); return;
    }
    if (formData.professionalCategory.length === 0) {
      toast.error('Please select at least one professional category'); return;
    }
    setIsSubmitting(true);
    try {
      let categories = [...formData.professionalCategory];
      if (categories.includes('Other') && formData.otherCategory)
        categories = categories.map(c => c === 'Other' ? `Other: ${formData.otherCategory.toUpperCase()}` : c);
      let segments = [...formData.clientSegments];
      if (segments.includes('Others') && formData.otherSegments)
        segments = segments.map(s => s === 'Others' ? `Others: ${formData.otherSegments.toUpperCase()}` : s);

      await supabase.from('professional_onboarding').insert([{
        full_name: formData.fullName.toUpperCase(), email: formData.email,
        phone: `${formData.countryCode} ${formData.phone}`,
        city_country: formData.cityCountry.toUpperCase(),
        organization: formData.organization ? formData.organization.toUpperCase() : null,
        certifications: formData.certifications ? formData.certifications.toUpperCase() : null,
        professional_category: categories, years_experience: formData.yearsExperience || null,
        client_segments: segments, created_at: new Date().toISOString()
      }]);
      toast.success('Your application has been submitted successfully!');
      onClose();
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[95%] sm:max-w-[600px] md:max-w-[700px] max-h-[95vh] sm:max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#323956] to-[#1a1f36] px-5 sm:px-8 py-5 sm:py-6 text-center">
          <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1.5 sm:p-2 transition-all">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-white mb-1">Clinic Onboarding Request</h2>
          <p className="text-gray-300 text-xs sm:text-sm">Fill out the form below to get started</p>
        </div>

        {/* Form */}
        <div className="p-5 sm:p-8 overflow-y-auto max-h-[calc(95vh-160px)] sm:max-h-[calc(90vh-180px)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5"><User className="w-4 h-4" />Full Name <span className="text-red-500">*</span></label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter your full name" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent uppercase" required />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5"><Mail className="w-4 h-4" />Email <span className="text-red-500">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent" required />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5"><PhoneIcon className="w-4 h-4" />Mobile / WhatsApp <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <select name="countryCode" value={formData.countryCode} onChange={handleChange} className="w-[120px] px-2 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent">
                  {countryCodes.map((c) => <option key={`${c.code}-${c.country}`} value={c.code} disabled={c.disabled}>{c.disabled ? c.country : `${c.flag} ${c.code}`}</option>)}
                </select>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone number" className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent" required />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5"><MapPin className="w-4 h-4" />City & Country <span className="text-red-500">*</span></label>
              <input type="text" name="cityCountry" value={formData.cityCountry} onChange={handleChange} placeholder="e.g., Mumbai, India" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent uppercase" required />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5"><Building className="w-4 h-4" />Organization</label>
              <input type="text" name="organization" value={formData.organization} onChange={handleChange} placeholder="Organization name" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent uppercase" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5"><Award className="w-4 h-4" />Certifications / Licenses</label>
              <input type="text" name="certifications" value={formData.certifications} onChange={handleChange} placeholder="e.g., ICF, RYT-200" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent uppercase" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Briefcase className="w-4 h-4" />Professional Category <span className="text-red-500">*</span><span className="text-xs text-gray-500">(Select all)</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {professionalCategories.map((cat) => (
                  <label key={cat} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all text-sm ${formData.professionalCategory.includes(cat) ? 'border-[#323956] bg-[#323956]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="checkbox" checked={formData.professionalCategory.includes(cat)} onChange={() => handleCategoryChange(cat)} className="w-4 h-4 text-[#323956] rounded" />
                    {cat}
                  </label>
                ))}
              </div>
              {formData.professionalCategory.includes('Other') && (
                <input type="text" name="otherCategory" value={formData.otherCategory} onChange={handleChange} placeholder="Specify category" className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent uppercase" />
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5"><Clock className="w-4 h-4" />Years of Experience</label>
              <select name="yearsExperience" value={formData.yearsExperience} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent">
                <option value="">Select experience</option>
                {experienceOptions.map((exp) => <option key={exp} value={exp}>{exp}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Users className="w-4 h-4" />Client Segments <span className="text-xs text-gray-500">(Select all)</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {clientSegmentOptions.map((seg) => (
                  <label key={seg} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all text-sm ${formData.clientSegments.includes(seg) ? 'border-[#323956] bg-[#323956]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="checkbox" checked={formData.clientSegments.includes(seg)} onChange={() => handleSegmentChange(seg)} className="w-4 h-4 text-[#323956] rounded" />
                    {seg}
                  </label>
                ))}
              </div>
              {formData.clientSegments.includes('Others') && (
                <input type="text" name="otherSegments" value={formData.otherSegments} onChange={handleChange} placeholder="Specify segments" className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent uppercase" />
              )}
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-gradient-to-r from-[#323956] to-[#1a1f36] hover:from-[#232D3C] hover:to-[#0f1220] text-white rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Technicians = () => {
  const navigate = useNavigate();
  const { openContactForm } = useContactForm();
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const observerRefs = useRef([]);

  // Scroll-triggered animations
  useEffect(() => {
    const scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-scroll-section');
            if (sectionId) {
              setVisibleSections((prev) => new Set([...prev, sectionId]));
              entry.target.classList.add('animate-in');
            }
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const elements = document.querySelectorAll('[data-scroll-section]');
    elements.forEach((el) => {
      scrollObserver.observe(el);
      observerRefs.current.push(el);
    });

    return () => {
      observerRefs.current.forEach((el) => {
        if (el) scrollObserver.unobserve(el);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <NavBar />

      <style>{`
        /* Scroll-triggered animations */
        .scroll-fade-left {
          opacity: 0;
          transform: translateX(-100px) translateY(20px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .scroll-fade-left.animate-in {
          opacity: 1;
          transform: translateX(0) translateY(0);
        }

        .scroll-fade-right {
          opacity: 0;
          transform: translateX(100px) translateY(20px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .scroll-fade-right.animate-in {
          opacity: 1;
          transform: translateX(0) translateY(0);
        }

        .scroll-fade-up {
          opacity: 0;
          transform: translateY(60px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .scroll-fade-up.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        .scroll-fade-down {
          opacity: 0;
          transform: translateY(-60px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .scroll-fade-down.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        .card-slide-alternate:nth-child(odd) {
          opacity: 0;
          transform: translateX(-120px) translateY(40px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-slide-alternate:nth-child(even) {
          opacity: 0;
          transform: translateX(120px) translateY(40px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-in .card-slide-alternate:nth-child(odd) {
          opacity: 1;
          transform: translateX(0) translateY(0);
        }

        .animate-in .card-slide-alternate:nth-child(even) {
          opacity: 1;
          transform: translateX(0) translateY(0);
        }

        .animate-in .card-slide-alternate:nth-child(1) {
          transition-delay: 0.15s;
        }

        .animate-in .card-slide-alternate:nth-child(2) {
          transition-delay: 0.3s;
        }

        .animate-in .card-slide-alternate:nth-child(3) {
          transition-delay: 0.45s;
        }

        .animate-in .card-slide-alternate:nth-child(4) {
          transition-delay: 0.6s;
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative text-white pt-20 sm:pt-24 md:pt-28 lg:pt-36 pb-8 sm:pb-12 md:pb-16 lg:pb-20 min-h-[300px] sm:min-h-[380px] md:min-h-[480px] lg:min-h-[600px]" style={{
        backgroundImage: 'url(/Technicians.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center right',
        backgroundRepeat: 'no-repeat'
      }}>
        {/* Overlay for text readability - stronger on mobile */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-800/80 to-gray-900/40 sm:from-gray-900/90 sm:via-gray-800/70 sm:to-transparent"></div>

        <div className="relative max-w-6xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-full sm:max-w-xl md:max-w-2xl text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 lg:mb-6 leading-tight">
              Get NeuroSense – The First Clinical-Grade, Precision Brain Mapping Tool For Your Practice
            </h1>
            <p className="text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl text-gray-200 mb-4 sm:mb-5 md:mb-6 lg:mb-8 leading-relaxed">
              Qualitative brain assessments can often yield variable results. Overcome this limitation with our advanced, quantitative QEEG-based brain mapping software for accurate, reliable insights.
            </p>

            <button
              onClick={() => setShowOnboarding(true)}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2.5 sm:px-5 sm:py-3 md:px-6 md:py-3.5 lg:px-8 lg:py-4 bg-[#323956] hover:bg-[#232D3C] text-white rounded-full text-xs sm:text-sm md:text-base lg:text-lg font-medium transition-all hover:scale-105 shadow-lg"
            >
              Get Started Today
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow py-6 sm:py-8 md:py-12 lg:py-16">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8">

          {/* Why NeuroSense Section */}
          <div className="mb-8 sm:mb-12 md:mb-16 lg:mb-20">
            <div className="text-center mb-5 sm:mb-7 md:mb-10 lg:mb-12">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
                Why Limitless Brain Lab for Clinics/Wellness units?
              </h2>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to deliver a professional brain coaching service packed in one unit.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8" data-scroll-section="features-grid">
              {/* Feature 1 */}
              <div className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 hover:border-gray-300 hover:shadow-2xl transition-all duration-300 card-slide-alternate">
                <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-gray-100 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 md:mb-5 lg:mb-6 group-hover:bg-[#323956] transition-colors">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-[#323956] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">
                  Easy to Use
                </h3>
                <p className="text-xs sm:text-[13px] md:text-sm lg:text-base text-gray-700 leading-relaxed">
                  Intuitive interface designed for technicians. Set up sessions quickly and focus on what matters, your clients.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 hover:border-gray-300 hover:shadow-2xl transition-all duration-300 card-slide-alternate">
                <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-gray-100 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 md:mb-5 lg:mb-6 group-hover:bg-[#323956] transition-colors">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-[#323956] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">
                  Real-Time Monitoring
                </h3>
                <p className="text-xs sm:text-[13px] md:text-sm lg:text-base text-gray-700 leading-relaxed">
                  Track client progress in real-time with detailed analytics and comprehensive reporting tools.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 hover:border-gray-300 hover:shadow-2xl transition-all duration-300 card-slide-alternate sm:col-span-2 md:col-span-1">
                <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-gray-100 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 md:mb-5 lg:mb-6 group-hover:bg-[#323956] transition-colors">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-[#323956] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">
                  Professional Support
                </h3>
                <p className="text-xs sm:text-[13px] md:text-sm lg:text-base text-gray-700 leading-relaxed">
                  Access to training resources, technical support and a community of performance coaches.
                </p>
              </div>
            </div>
          </div>

          {/* Key Capabilities Section */}
          <div className="mb-8 sm:mb-12 md:mb-16 lg:mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 md:gap-8 lg:gap-12 items-center">
              {/* Left Content */}
              <div className="order-2 md:order-1">
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 lg:mb-8 leading-snug">
                  What is possible with Limitless Brain Lab Advanced Suite Made For Clinics/Clinicians/Coaches.
                </h2>
                <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
                  <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-[#323956] rounded-md sm:rounded-lg flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[13px] sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-900 mb-0.5 sm:mb-1 md:mb-2">Limitless Brain Lab reporting</h3>
                      <p className="text-xs sm:text-[13px] md:text-sm lg:text-base text-gray-700 leading-relaxed">
                        Easily report the various brain health parameters. All parameters available on your dashboard.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-[#323956] rounded-md sm:rounded-lg flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[13px] sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-900 mb-0.5 sm:mb-1 md:mb-2">Protocol customization</h3>
                      <p className="text-xs sm:text-[13px] md:text-sm lg:text-base text-gray-700 leading-relaxed">
                        Customize the MOVERS protocol for each client. Make it hyper personal.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-[#323956] rounded-md sm:rounded-lg flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[13px] sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-900 mb-0.5 sm:mb-1 md:mb-2">Progress tracking</h3>
                      <p className="text-xs sm:text-[13px] md:text-sm lg:text-base text-gray-700 leading-relaxed">
                        Monitor the client improvement with detailed metrics and visual progress.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-[#323956] rounded-md sm:rounded-lg flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[13px] sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-900 mb-0.5 sm:mb-1 md:mb-2">Secure Data Mangement</h3>
                      <p className="text-xs sm:text-[13px] md:text-sm lg:text-base text-gray-700 leading-relaxed">
                        HIPPA compliant data storage for confidentiality.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Image/Visual */}
              <div className="flex justify-center order-1 md:order-2">
                <div className="relative rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden w-full">
                  <video
                    src="/Limitless brain lab model.mp4"
                    className="w-full max-w-2xl h-[200px] sm:h-[280px] md:h-[350px] lg:h-[420px] xl:h-[500px] object-cover rounded-xl sm:rounded-2xl md:rounded-3xl"
                    controls
                    autoPlay
                    muted
                    loop
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>

          {/* Training & Resources Section */}
          <div className="mb-8 sm:mb-12 md:mb-16 lg:mb-20">
            <div className="bg-gradient-to-br from-[#E4EFFF] to-gray-50 rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-5 md:p-8 lg:p-10 xl:p-12 shadow-xl">
              <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-10">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">
                  Training & Resources
                </h2>
                <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-700">
                  Comprehensive support to help you succeed
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-5 lg:gap-8" data-scroll-section="training-cards">
                <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg card-slide-alternate">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-[#323956] rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                    <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-900 mb-1 sm:mb-1.5 md:mb-2 lg:mb-3">
                    Expert Training
                  </h3>
                  <p className="text-[10px] sm:text-xs md:text-[13px] lg:text-sm xl:text-base text-gray-700 leading-relaxed">
                    Access comprehensive training materials, video tutorials, and certification programs to enhance your skills.
                  </p>
                </div>

                <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg card-slide-alternate">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-[#323956] rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                    <BarChart3 className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-900 mb-1 sm:mb-1.5 md:mb-2 lg:mb-3">
                    Clinical Resources
                  </h3>
                  <p className="text-[10px] sm:text-xs md:text-[13px] lg:text-sm xl:text-base text-gray-700 leading-relaxed">
                    Evidence based protocols, research papers, and best practice guidelines at your fingertips.
                  </p>
                </div>

                <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg card-slide-alternate">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-[#323956] rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                    <Shield className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-900 mb-1 sm:mb-1.5 md:mb-2 lg:mb-3">
                    24/7 Support
                  </h3>
                  <p className="text-[10px] sm:text-xs md:text-[13px] lg:text-sm xl:text-base text-gray-700 leading-relaxed">
                    Round the clock technical support to ensure smooth operations and client satisfaction.
                  </p>
                </div>

                <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg card-slide-alternate">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-[#323956] rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                    <Zap className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-900 mb-1 sm:mb-1.5 md:mb-2 lg:mb-3">
                    Community Access
                  </h3>
                  <p className="text-[10px] sm:text-xs md:text-[13px] lg:text-sm xl:text-base text-gray-700 leading-relaxed">
                    Connect with fellow coaches, share experiences, and learn from the best.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Discovery Call CTA Section */}
        <div className="py-6 sm:py-8 md:py-12 lg:py-16 px-3 sm:px-5 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#323956] to-[#1a1f2e] rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 text-center shadow-2xl">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-2 sm:mb-3 md:mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg mb-4 sm:mb-5 md:mb-6 lg:mb-8 max-w-2xl mx-auto">
                Book a discovery call to learn how Limitless Brain Lab can transform your practice or personal brain wellness journey.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4 justify-center items-center">
                <a
                  href="/neurosense-booking?type=clinic#contact-form"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 sm:px-5 sm:py-3 md:px-6 md:py-3.5 lg:px-8 lg:py-4 bg-white hover:bg-gray-100 text-[#323956] text-xs sm:text-sm md:text-base lg:text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  I'm a Clinic
                </a>
                <a
                  href="/neurosense-booking?type=individual#contact-form"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 sm:px-5 sm:py-3 md:px-6 md:py-3.5 lg:px-8 lg:py-4 bg-[#F5D05D] hover:bg-[#e5c04d] text-[#323956] text-xs sm:text-sm md:text-base lg:text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  I'm an Individual
                </a>
              </div>

              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm mt-3 sm:mt-4 md:mt-5 lg:mt-6">
                Book Your Discovery Call Today
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <OnboardingPopup isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </div>
  );
};

export default Technicians;
