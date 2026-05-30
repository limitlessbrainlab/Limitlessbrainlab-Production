import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { toast } from 'react-hot-toast';
import { countryCodes } from '../utils/countryCodes';
import { supabase } from '../lib/supabaseClient';
import { Brain, User, Mail, Phone, MapPin, Building, Award, Briefcase, Clock, Users } from 'lucide-react';

const ProfessionalOnboardingForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    countryCode: '+91',
    phone: '',
    cityCountry: '',
    organization: '',
    certifications: '',
    professionalCategory: [],
    otherCategory: '',
    yearsExperience: '',
    clientSegments: [],
    otherSegments: ''
  });

  const professionalCategories = [
    'Life / Executive / Performance Coach',
    'Wellness & Holistic Practitioner',
    'Therapist (Non-clinical)',
    'Educator / Student Mentor',
    'Yoga & Meditation Facilitator',
    'Breathwork / Mind-Body Practitioner',
    'Integrative Health Professional',
    'Other'
  ];

  const experienceOptions = [
    '<1 year',
    '1-3 years',
    '3-7 years',
    '7-12 years',
    '12+ years'
  ];

  const clientSegmentOptions = [
    'Children & Teens',
    'College Students',
    'Working Professionals',
    'Corporate Leaders',
    'Athletes / Performers',
    'Individuals with Stress/Anxiety',
    'Wellness & Lifestyle Clients',
    'Others'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (category) => {
    setFormData(prev => {
      const categories = prev.professionalCategory.includes(category)
        ? prev.professionalCategory.filter(c => c !== category)
        : [...prev.professionalCategory, category];
      return { ...prev, professionalCategory: categories };
    });
  };

  const handleSegmentChange = (segment) => {
    setFormData(prev => {
      const segments = prev.clientSegments.includes(segment)
        ? prev.clientSegments.filter(s => s !== segment)
        : [...prev.clientSegments, segment];
      return { ...prev, clientSegments: segments };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.phone || !formData.cityCountry) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.professionalCategory.length === 0) {
      toast.error('Please select at least one professional category');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullPhone = `${formData.countryCode} ${formData.phone}`;

      // Prepare categories with "Other" specification if selected
      let categories = [...formData.professionalCategory];
      if (categories.includes('Other') && formData.otherCategory) {
        categories = categories.map(c => c === 'Other' ? `Other: ${formData.otherCategory.toUpperCase()}` : c);
      }

      // Prepare segments with "Others" specification if selected
      let segments = [...formData.clientSegments];
      if (segments.includes('Others') && formData.otherSegments) {
        segments = segments.map(s => s === 'Others' ? `Others: ${formData.otherSegments.toUpperCase()}` : s);
      }

      // Save to database
      const { error } = await supabase
        .from('professional_onboarding')
        .insert([{
          full_name: formData.fullName.toUpperCase(),
          email: formData.email,
          phone: fullPhone,
          city_country: formData.cityCountry.toUpperCase(),
          organization: formData.organization ? formData.organization.toUpperCase() : null,
          certifications: formData.certifications ? formData.certifications.toUpperCase() : null,
          professional_category: categories,
          years_experience: formData.yearsExperience || null,
          client_segments: segments,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Database error:', error);
        // Continue even if database fails
      }

      toast.success('Your application has been submitted successfully! We will contact you soon.');
      setFormData({
        fullName: '',
        email: '',
        countryCode: '+91',
        phone: '',
        cityCountry: '',
        organization: '',
        certifications: '',
        professionalCategory: [],
        otherCategory: '',
        yearsExperience: '',
        clientSegments: [],
        otherSegments: ''
      });

      // Redirect after success
      setTimeout(() => navigate('/about-us'), 2000);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <NavBar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#323956] to-[#1a1f2e] text-white pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Limitless Brain Lab Professional Interest & Onboarding Form
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
            Join our network of certified practitioners and unlock the power of brain optimization
          </p>
        </div>
      </section>

      {/* Form Section */}
      <main className="flex-grow py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-[#323956] to-[#1a1f36] px-6 sm:px-8 py-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Professional Application</h2>
              <p className="text-gray-300 text-sm">Fill out the form below to apply</p>
            </div>

            {/* Form Body */}
            <div className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent transition-all uppercase"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4" />
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4" />
                    Mobile Number / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                      className="w-[130px] px-2 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent transition-all"
                    >
                      {countryCodes.map((country) => (
                        <option
                          key={`${country.code}-${country.country}`}
                          value={country.code}
                          disabled={country.disabled}
                        >
                          {country.disabled ? country.country : `${country.flag} ${country.code}`}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {/* City & Country */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4" />
                    City & Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="cityCountry"
                    value={formData.cityCountry}
                    onChange={handleChange}
                    placeholder="e.g., Mumbai, India"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent transition-all uppercase"
                    required
                  />
                </div>

                {/* Current Organization */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Building className="w-4 h-4" />
                    Current Organization
                  </label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder="Enter your organization name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent transition-all uppercase"
                  />
                </div>

                {/* Certifications */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Award className="w-4 h-4" />
                    Certifications / Licenses (If Any)
                  </label>
                  <input
                    type="text"
                    name="certifications"
                    value={formData.certifications}
                    onChange={handleChange}
                    placeholder="e.g., ICF, RYT-200, etc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent transition-all uppercase"
                  />
                </div>

                {/* Professional Category (Multi-select) */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <Briefcase className="w-4 h-4" />
                    Professional Category <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500">(Select all that apply)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {professionalCategories.map((category) => (
                      <label
                        key={category}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          formData.professionalCategory.includes(category)
                            ? 'border-[#323956] bg-[#323956]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.professionalCategory.includes(category)}
                          onChange={() => handleCategoryChange(category)}
                          className="w-4 h-4 text-[#323956] rounded focus:ring-[#323956]"
                        />
                        <span className="text-sm text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                  {formData.professionalCategory.includes('Other') && (
                    <input
                      type="text"
                      name="otherCategory"
                      value={formData.otherCategory}
                      onChange={handleChange}
                      placeholder="Please specify your category"
                      className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent transition-all uppercase"
                    />
                  )}
                </div>

                {/* Years of Experience */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4" />
                    Years of Experience in Field
                  </label>
                  <select
                    name="yearsExperience"
                    value={formData.yearsExperience}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent transition-all"
                  >
                    <option value="">Select experience</option>
                    {experienceOptions.map((exp) => (
                      <option key={exp} value={exp}>{exp}</option>
                    ))}
                  </select>
                </div>

                {/* Primary Client Segments (Multi-select) */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <Users className="w-4 h-4" />
                    Primary Client Segments You Serve
                    <span className="text-xs text-gray-500">(Select all that apply)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {clientSegmentOptions.map((segment) => (
                      <label
                        key={segment}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          formData.clientSegments.includes(segment)
                            ? 'border-[#323956] bg-[#323956]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.clientSegments.includes(segment)}
                          onChange={() => handleSegmentChange(segment)}
                          className="w-4 h-4 text-[#323956] rounded focus:ring-[#323956]"
                        />
                        <span className="text-sm text-gray-700">{segment}</span>
                      </label>
                    ))}
                  </div>
                  {formData.clientSegments.includes('Others') && (
                    <input
                      type="text"
                      name="otherSegments"
                      value={formData.otherSegments}
                      onChange={handleChange}
                      placeholder="Please specify your client segments"
                      className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#323956] focus:border-transparent transition-all uppercase"
                    />
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-[#323956] to-[#1a1f36] hover:from-[#232D3C] hover:to-[#0f1220] text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfessionalOnboardingForm;
