import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { Brain, User, Mail, Phone, MessageSquare, Briefcase, Building, Activity, HelpCircle, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { countryCodes } from '../utils/countryCodes';

const ProgramJoinForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState('next');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    countryCode: '+91',
    email: '',
    message: '',
    profession: '',
    industry: '',
    brainFitnessScore: '',
    hasDoneBrainScan: ''
  });

  const industries = [
    'Technology',
    'Healthcare',
    'Finance & Banking',
    'Education',
    'Manufacturing',
    'Retail',
    'Media & Entertainment',
    'Real Estate',
    'Consulting',
    'Legal',
    'Government',
    'Non-Profit',
    'Other'
  ];

  const professions = [
    'CEO / Founder',
    'C-Suite Executive',
    'Director / VP',
    'Manager',
    'Entrepreneur',
    'Professional',
    'Consultant',
    'Student',
    'Other'
  ];

  const steps = [
    {
      id: 'name',
      question: "What's your full name?",
      subtext: "Let's start with your name",
      icon: User,
      type: 'text',
      placeholder: 'Type your full name...',
      required: true,
      field: 'name'
    },
    {
      id: 'email',
      question: "What's your email address?",
      subtext: "We'll use this to contact you",
      icon: Mail,
      type: 'email',
      placeholder: 'name@example.com',
      required: true,
      field: 'email'
    },
    {
      id: 'phone',
      question: "What's your phone number?",
      subtext: "For quick communication",
      icon: Phone,
      type: 'phone',
      placeholder: 'Enter your phone number',
      required: true,
      field: 'phone'
    },
    {
      id: 'profession',
      question: "What's your profession?",
      subtext: "Help us understand your background",
      icon: Briefcase,
      type: 'select',
      options: professions,
      placeholder: 'Select your profession',
      required: false,
      field: 'profession'
    },
    {
      id: 'industry',
      question: "Which industry do you work in?",
      subtext: "This helps us personalize your experience",
      icon: Building,
      type: 'select',
      options: industries,
      placeholder: 'Select your industry',
      required: false,
      field: 'industry'
    },
    {
      id: 'brainFitnessScore',
      question: "Do you know your Brain Fitness Score?",
      subtext: "Enter if you have it, or skip",
      icon: Activity,
      type: 'text',
      placeholder: 'e.g., 75/100',
      required: false,
      field: 'brainFitnessScore'
    },
    {
      id: 'hasDoneBrainScan',
      question: "Have you done your brain scan yet?",
      subtext: "Select one option",
      icon: HelpCircle,
      type: 'radio',
      options: ['Yes', 'No', 'Planning to'],
      required: false,
      field: 'hasDoneBrainScan'
    },
    {
      id: 'message',
      question: "Any message or goals you'd like to share?",
      subtext: "Optional - Tell us what you're looking to achieve",
      icon: MessageSquare,
      type: 'textarea',
      placeholder: 'Share your goals, questions, or anything else...',
      required: false,
      field: 'message'
    }
  ];

  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentStepData = steps[currentStep];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionSelect = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateCurrentStep = () => {
    const step = steps[currentStep];
    if (step.required && !formData[step.field]) {
      toast.error(`Please fill in this field`);
      return false;
    }
    if (step.type === 'email' && formData[step.field]) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData[step.field])) {
        toast.error('Please enter a valid email address');
        return false;
      }
    }
    return true;
  };

  const goToNext = () => {
    if (!validateCurrentStep()) return;

    if (currentStep < totalSteps - 1) {
      setDirection('next');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setDirection('prev');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && currentStepData.type !== 'textarea') {
      e.preventDefault();
      if (currentStep === totalSteps - 1) {
        handleSubmit();
      } else {
        goToNext();
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullPhone = `${formData.countryCode} ${formData.phone}`;

      const { error } = await supabase
        .from('program_inquiries')
        .insert([{
          name: formData.name.toUpperCase(),
          email: formData.email,
          phone: fullPhone,
          message: formData.message ? formData.message.toUpperCase() : formData.message,
          profession: formData.profession,
          industry: formData.industry,
          brain_fitness_score: formData.brainFitnessScore || null,
          has_done_brain_scan: formData.hasDoneBrainScan,
          program_type: '100X Brain Optimization',
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Database error:', error);
      }

      toast.success('Your application has been submitted successfully!');
      setTimeout(() => navigate('/faq'), 2000);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const IconComponent = currentStepData.icon;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-[#323956] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="pt-6 pb-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <img
              src="/IBW Logo.png"
              alt="NeuroSense Logo"
              className="h-24 w-auto object-contain"
            />
          </div>
          <div className="text-gray-500 text-sm font-medium">
            Step {currentStep + 1} of {totalSteps}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Question Card */}
          <div
            className={`transition-all duration-300 transform ${
              isAnimating
                ? direction === 'next'
                  ? '-translate-x-8 opacity-0'
                  : 'translate-x-8 opacity-0'
                : 'translate-x-0 opacity-100'
            }`}
          >
            {/* Step Number & Icon */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#323956]/10 flex items-center justify-center">
                <IconComponent className="w-7 h-7 text-[#323956]" />
              </div>
              <div>
                <span className="text-[#323956] text-sm font-medium">Question {currentStep + 1}</span>
              </div>
            </div>

            {/* Question */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#323956] mb-4 leading-tight">
              {currentStepData.question}
            </h1>
            <p className="text-gray-500 text-lg mb-10">
              {currentStepData.subtext}
            </p>

            {/* Input Field */}
            <div className="mb-10">
              {currentStepData.type === 'text' && (
                <input
                  type="text"
                  name={currentStepData.field}
                  value={formData[currentStepData.field]}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder={currentStepData.placeholder}
                  autoFocus
                  className={`w-full bg-transparent border-b-2 border-gray-300 focus:border-[#323956] text-gray-900 text-2xl py-4 outline-none transition-colors placeholder-gray-400${currentStepData.field === 'name' ? ' uppercase' : ''}`}
                />
              )}

              {currentStepData.type === 'email' && (
                <input
                  type="email"
                  name={currentStepData.field}
                  value={formData[currentStepData.field]}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder={currentStepData.placeholder}
                  autoFocus
                  className="w-full bg-transparent border-b-2 border-gray-300 focus:border-[#323956] text-gray-900 text-2xl py-4 outline-none transition-colors placeholder-gray-400"
                />
              )}

              {currentStepData.type === 'phone' && (
                <div className="flex gap-4 items-end">
                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleChange}
                    className="bg-transparent border-b-2 border-gray-300 focus:border-[#323956] text-gray-900 text-xl py-4 outline-none transition-colors cursor-pointer"
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
                    onKeyPress={handleKeyPress}
                    placeholder={currentStepData.placeholder}
                    autoFocus
                    className="flex-1 bg-transparent border-b-2 border-gray-300 focus:border-[#323956] text-gray-900 text-2xl py-4 outline-none transition-colors placeholder-gray-400"
                  />
                </div>
              )}

              {currentStepData.type === 'select' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {currentStepData.options.map((option, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleOptionSelect(currentStepData.field, option)}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        formData[currentStepData.field] === option
                          ? 'border-[#323956] bg-[#323956]/10 text-[#323956]'
                          : 'border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {formData[currentStepData.field] === option && (
                          <Check className="w-4 h-4 text-[#323956]" />
                        )}
                        {option}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {currentStepData.type === 'radio' && (
                <div className="flex flex-wrap gap-4">
                  {currentStepData.options.map((option, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleOptionSelect(currentStepData.field, option)}
                      className={`px-8 py-4 rounded-full border-2 transition-all duration-200 ${
                        formData[currentStepData.field] === option
                          ? 'border-[#323956] bg-[#323956] text-white font-semibold'
                          : 'border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {currentStepData.type === 'textarea' && (
                <textarea
                  name={currentStepData.field}
                  value={formData[currentStepData.field]}
                  onChange={handleChange}
                  placeholder={currentStepData.placeholder}
                  rows={4}
                  autoFocus
                  className="w-full bg-gray-50 border-2 border-gray-300 focus:border-[#323956] rounded-xl text-gray-900 text-lg p-4 outline-none transition-colors placeholder-gray-400 resize-none uppercase"
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={goToPrevious}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-gray-500 hover:text-gray-900 transition-colors ${
                  currentStep === 0 ? 'invisible' : ''
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>

              {currentStep === totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-4 bg-[#323956] hover:bg-[#252a45] text-white rounded-full font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToNext}
                  className="flex items-center gap-2 px-8 py-4 bg-[#323956] hover:bg-[#252a45] text-white rounded-full font-semibold transition-all hover:scale-105"
                >
                  OK
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Keyboard hint */}
            <p className="text-gray-400 text-sm mt-8 text-center">
              Press <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">Enter ↵</span> to continue
            </p>
          </div>
        </div>
      </main>

      {/* Step Indicators */}
      <footer className="pb-8 px-6">
        <div className="max-w-2xl mx-auto flex justify-center gap-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'w-8 bg-[#323956]'
                  : idx < currentStep
                  ? 'w-4 bg-[#323956]/50'
                  : 'w-4 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </footer>
    </div>
  );
};

export default ProgramJoinForm;
