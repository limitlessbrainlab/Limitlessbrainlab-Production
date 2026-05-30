import React, { useState } from 'react';
import { X, Send, MapPin, User, Mail, Phone, MessageSquare, CheckCircle, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { countryCodes } from '../utils/countryCodes';

const EnquiryForm = ({ isOpen, onClose, initialLocation = '' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+91',
    city: initialLocation,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.city) {
      toast.error('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      const fullPhone = formData.phone ? `${formData.countryCode} ${formData.phone}` : null;

      const { data, error } = await supabase
        .from('clinic_enquiries')
        .insert([
          {
            name: formData.name.toUpperCase(),
            email: formData.email,
            phone: fullPhone,
            city: formData.city.toUpperCase(),
            message: formData.message ? formData.message.toUpperCase() : null,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.error('Error saving enquiry:', error);
        toast.error('Failed to submit enquiry. Please try again.');
        return;
      }

      setIsSuccess(true);
      toast.success('Thank you! We\'ll notify you when we launch in your area.');

      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          countryCode: '+91',
          city: '',
          message: '',
        });
        setIsSuccess(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      countryCode: '+91',
      city: '',
      message: '',
    });
    setIsSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 backdrop-blur-md"
      style={{ animation: 'fadeIn 0.3s ease-out' }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[95vw] sm:max-w-[85vw] md:max-w-[550px] lg:max-w-[600px] max-h-[90vh] sm:max-h-[88vh] overflow-hidden"
        style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success State */}
        {isSuccess ? (
          <div className="p-6 sm:p-8 md:p-12 text-center">
            <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mb-4 sm:mb-6">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25"></div>
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Thank You!</h3>
            <p className="text-gray-600 text-sm sm:text-base max-w-sm mx-auto">
              Your request has been submitted successfully. We'll notify you when we launch in your area.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#323956] via-[#3d4566] to-[#1a1f36] px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 overflow-hidden">
              <div className="hidden sm:block absolute top-0 right-0 w-32 md:w-40 h-32 md:h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="hidden sm:block absolute bottom-0 left-0 w-24 md:w-32 h-24 md:h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

              <button
                onClick={handleClose}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1.5 sm:p-2 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative flex items-center gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">Request a Clinic</h2>
                  <p className="text-gray-300/90 text-[11px] sm:text-xs md:text-sm mt-0.5 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    We'll notify the NeuroSense team
                  </p>
                </div>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-4 sm:p-5 md:p-6 lg:p-8 overflow-y-auto max-h-[calc(90vh-100px)] sm:max-h-[calc(88vh-110px)] md:max-h-[calc(88vh-120px)] bg-gradient-to-b from-gray-50/80 to-white">
              <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-5">
                Don't see a clinic near you? Let us know! We're constantly expanding our network.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Name Field */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700">
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-200 ${focusedField === 'name' ? 'bg-[#323956] text-white' : 'bg-gray-100 text-[#323956]'}`}>
                      <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder="Enter your full name"
                    className="w-full h-10 sm:h-11 md:h-12 px-3 sm:px-4 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl text-sm focus:ring-0 focus:border-[#323956] focus:shadow-lg focus:shadow-[#323956]/10 transition-all duration-200 placeholder-gray-400 uppercase"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700">
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-200 ${focusedField === 'email' ? 'bg-[#323956] text-white' : 'bg-gray-100 text-[#323956]'}`}>
                      <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder="your.email@example.com"
                    className="w-full h-10 sm:h-11 md:h-12 px-3 sm:px-4 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl text-sm focus:ring-0 focus:border-[#323956] focus:shadow-lg focus:shadow-[#323956]/10 transition-all duration-200 placeholder-gray-400"
                  />
                </div>

                {/* Phone Field */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700">
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-200 ${focusedField === 'phone' ? 'bg-[#323956] text-white' : 'bg-gray-100 text-[#323956]'}`}>
                      <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    Phone Number
                  </label>
                  <div className="flex gap-2 sm:gap-3">
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                      className="w-[110px] sm:w-[120px] md:w-[130px] h-10 sm:h-11 md:h-12 px-2 sm:px-3 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-0 focus:border-[#323956] transition-all duration-200 cursor-pointer"
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
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="98765 43210"
                      className="flex-1 h-10 sm:h-11 md:h-12 px-3 sm:px-4 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl text-sm focus:ring-0 focus:border-[#323956] focus:shadow-lg focus:shadow-[#323956]/10 transition-all duration-200 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* City Field */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700">
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-200 ${focusedField === 'city' ? 'bg-[#323956] text-white' : 'bg-gray-100 text-[#323956]'}`}>
                      <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    City / Region <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('city')}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder="Enter your city or region"
                    className="w-full h-10 sm:h-11 md:h-12 px-3 sm:px-4 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl text-sm focus:ring-0 focus:border-[#323956] focus:shadow-lg focus:shadow-[#323956]/10 transition-all duration-200 placeholder-gray-400 uppercase"
                  />
                </div>

                {/* Message Field */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700">
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-200 ${focusedField === 'message' ? 'bg-[#323956] text-white' : 'bg-gray-100 text-[#323956]'}`}>
                      <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    Additional Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('message')}
                    onBlur={() => setFocusedField(null)}
                    rows={3}
                    placeholder="Tell us more about your requirements..."
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl text-sm focus:ring-0 focus:border-[#323956] focus:shadow-lg focus:shadow-[#323956]/10 transition-all duration-200 resize-none placeholder-gray-400 uppercase"
                  />
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full sm:flex-1 h-11 sm:h-12 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all duration-200 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:flex-1 h-11 sm:h-12 md:h-14 bg-gradient-to-r from-[#323956] via-[#3d4566] to-[#1a1f36] hover:from-[#252a45] hover:via-[#323956] hover:to-[#0f1220] text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Submit Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default EnquiryForm;
