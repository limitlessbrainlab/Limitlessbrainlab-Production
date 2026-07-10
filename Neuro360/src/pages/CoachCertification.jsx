import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { WHATSAPP_URL } from '../config/whatsapp';
import Footer from '../components/Footer';
import { useProgramForm } from '../context/ProgramFormContext';
import {
  ChevronLeft,
  Heart,
  Moon,
  Target,
  BookOpen,
  Smile,
  GraduationCap,
  Users,
  Award,
  Clock,
  CheckCircle,
  ExternalLink,
  Star,
  Briefcase,
  FileText,
  Calendar,
  Globe,
  Zap,
  ArrowRight
} from 'lucide-react';

const CoachCertification = () => {
  const navigate = useNavigate();
  const [selectedSchool, setSelectedSchool] = useState(null);
  const { openProgramForm } = useProgramForm();

  // The 5 Pillars - Core Curriculum
  const pillars = [
    {
      number: 1,
      title: 'Stress & ANS Mastery',
      subtitle: 'Regulate the nervous system on demand',
      icon: Heart,
      gradient: 'from-rose-500 to-red-600',
      modules: ['Autonomic Nervous System', 'Breathing Techniques', 'HRV Training', 'Stress Response Patterns']
    },
    {
      number: 2,
      title: 'Sleep & Recovery Mastery',
      subtitle: 'Build consistent sleep & recovery routines',
      icon: Moon,
      gradient: 'from-indigo-500 to-purple-600',
      modules: ['Sleep Architecture', 'Circadian Rhythm', 'Sleep Hygiene', 'Recovery Protocols']
    },
    {
      number: 3,
      title: 'Focus & Attention Mastery',
      subtitle: 'Train attention control and deep focus',
      icon: Target,
      gradient: 'from-amber-500 to-orange-600',
      modules: ['Attention Networks', 'Flow States', 'Distraction Management', 'Concentration Training']
    },
    {
      number: 4,
      title: 'Learning, Memory & Creativity',
      subtitle: 'Encoding, spacing, and recall tactics',
      icon: BookOpen,
      gradient: 'from-blue-500 to-cyan-600',
      modules: ['Memory Systems', 'Learning Optimization', 'Creative Problem Solving', 'Neuroplasticity']
    },
    {
      number: 5,
      title: 'Emotional Regulation & Resilience',
      subtitle: 'Skills to notice, name, and reframe',
      icon: Smile,
      gradient: 'from-pink-500 to-rose-600',
      modules: ['Emotional Intelligence', 'Cognitive Reframing', 'Resilience Building', 'Mindfulness Practice']
    }
  ];

  // School/Certification Options
  const schoolOptions = [
    {
      id: 'foundation',
      name: 'Foundation Certificate',
      duration: '8 weeks',
      format: 'Online Self-Paced',
      price: '₹24,999',
      features: [
        'All 5 Pillars core curriculum',
        'Video lessons & workbooks',
        'Self-assessment tools',
        'Community access',
        'Certificate of Completion'
      ],
      color: 'from-blue-500 to-indigo-600',
      icon: BookOpen,
      badge: 'Most Popular'
    },
    {
      id: 'practitioner',
      name: 'Certified Practitioner',
      duration: '16 weeks',
      format: 'Online + Live Sessions',
      price: '₹49,999',
      features: [
        'Everything in Foundation',
        'Live coaching sessions with Dr. Shweta',
        'Client assessment training',
        'Case study practice',
        'Practitioner certification',
        '1-on-1 mentorship calls'
      ],
      color: 'from-purple-500 to-pink-600',
      icon: Award,
      badge: 'Professional'
    },
    {
      id: 'master',
      name: 'Master Coach Program',
      duration: '6 months',
      format: 'Hybrid (Online + In-Person)',
      price: '₹99,999',
      features: [
        'Everything in Practitioner',
        'Advanced neuroscience modules',
        'Business setup guidance',
        'In-person intensive workshop',
        'Neuro360 affiliate partnership',
        'Ongoing supervision & support',
        'Master Coach certification'
      ],
      color: 'from-amber-500 to-orange-600',
      icon: Star,
      badge: 'Elite'
    }
  ];

  // Syllabus details for each school
  const syllabusDetails = {
    foundation: {
      weeks: [
        { week: '1-2', topic: 'Pillar 1: Stress & ANS Mastery', description: 'Understanding the autonomic nervous system and mastering regulation techniques' },
        { week: '3-4', topic: 'Pillar 2: Sleep & Recovery', description: 'Sleep science, circadian optimization, and recovery protocols' },
        { week: '5', topic: 'Pillar 3: Focus & Attention', description: 'Attention training, flow states, and concentration techniques' },
        { week: '6', topic: 'Pillar 4: Learning & Memory', description: 'Memory systems, learning strategies, and neuroplasticity' },
        { week: '7', topic: 'Pillar 5: Emotional Regulation', description: 'Emotional intelligence and resilience building' },
        { week: '8', topic: 'Integration & Assessment', description: 'Bringing it all together, final assessment' }
      ]
    },
    practitioner: {
      weeks: [
        { week: '1-4', topic: 'Foundation Curriculum', description: 'Complete 5 Pillars foundation with deeper understanding' },
        { week: '5-8', topic: 'Client Assessment', description: 'Learn to assess clients, use Limitless Brain Lab tools, create personalized plans' },
        { week: '9-12', topic: 'Coaching Skills', description: 'Active listening, questioning techniques, session structure' },
        { week: '13-14', topic: 'Case Studies', description: 'Practice with real scenarios, supervised coaching sessions' },
        { week: '15-16', topic: 'Certification & Launch', description: 'Final assessment, certification, practice setup guidance' }
      ]
    },
    master: {
      weeks: [
        { week: 'Month 1-2', topic: 'Practitioner Curriculum', description: 'Complete practitioner training with advanced modules' },
        { week: 'Month 3', topic: 'Advanced Neuroscience', description: 'Deep dive into brain science, research methods, evidence-based practice' },
        { week: 'Month 4', topic: 'Specialized Populations', description: 'Working with executives, athletes, students, clinical considerations' },
        { week: 'Month 5', topic: 'Business & Marketing', description: 'Practice setup, marketing, client acquisition, pricing strategies' },
        { week: 'Month 6', topic: 'In-Person Intensive + Certification', description: '3-day workshop, final assessment, Master Coach certification' }
      ]
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-purple-50/30 to-slate-50">
      <NavBar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] text-white pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full mb-4">
                <GraduationCap className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Certification Program</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Become a Certified<br />
                <span className="text-[#F5D05D]">Brain Health Coach</span>
              </h1>
              <p className="text-lg text-blue-100 mb-6 max-w-xl">
                Transform lives through neuroscience-backed coaching. Dr. Shweta's 5 Pillars of Mastery program
                trains you to become a certified brain health and performance coach.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={openProgramForm}
                  className="px-6 py-3 bg-[#F5D05D] text-gray-900 font-semibold rounded-xl hover:bg-[#E5C04D] transition-colors flex items-center justify-center"
                >
                  Apply Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
                <a
                  href="/assets/coach-certification-brochure.pdf"
                  download
                  className="px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors flex items-center justify-center"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Download Brochure
                </a>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-[#F5D05D]/30 to-purple-500/30 flex items-center justify-center">
                  <GraduationCap className="h-32 w-32 sm:h-40 sm:w-40 text-white/80" />
                </div>
                <div className="absolute -top-4 -right-4 px-4 py-2 bg-[#F5D05D] text-gray-900 rounded-lg font-bold text-sm">
                  Next Batch: Feb 2025
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Why Become a Coach - Moved to top */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Why Become a Brain Health Coach?</h2>
            <p className="text-gray-600">Join a growing movement of certified professionals</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Growing Demand</h4>
              <p className="text-sm text-gray-600">Mental wellness is a $120B+ industry with increasing demand for qualified coaches.</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-7 w-7 text-green-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Flexible Career</h4>
              <p className="text-sm text-gray-600">Work from anywhere, set your own hours, and build a practice that fits your life.</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="h-7 w-7 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Make Impact</h4>
              <p className="text-sm text-gray-600">Help others transform their lives through better brain health and mental performance.</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Award className="h-7 w-7 text-amber-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Credentialed</h4>
              <p className="text-sm text-gray-600">Earn recognized certification backed by Dr. Shweta and the Limitless Brain Lab platform.</p>
            </div>
          </div>
        </div>

        {/* The 5 Pillars - Core Curriculum */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full mb-4">
              <FileText className="h-5 w-5 mr-2" />
              <span className="font-medium">Core Curriculum</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">The 5 Pillars of Brain Mastery</h2>
            <p className="text-gray-600">The foundation of all certification programs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.number}
                  className="p-4 bg-gray-50 rounded-xl text-center hover:shadow-md transition-shadow"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-xs font-bold text-gray-400">PILLAR {pillar.number}</span>
                  <h3 className="font-bold text-sm text-gray-900 mt-1">{pillar.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{pillar.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Certification Paths */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-700 rounded-full mb-4">
              <GraduationCap className="h-5 w-5 mr-2" />
              <span className="font-medium">Certification Paths</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Choose Your Certification Path</h2>
            <p className="text-gray-600">Three levels to match your goals and career aspirations</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {schoolOptions.map((school) => {
              const Icon = school.icon;
              return (
                <div
                  key={school.id}
                  className={`relative bg-white rounded-2xl border-2 transition-all cursor-pointer hover:shadow-xl ${
                    selectedSchool === school.id
                      ? 'border-[#323956] shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedSchool(selectedSchool === school.id ? null : school.id)}
                >
                  {/* Badge */}
                  {school.badge && (
                    <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r ${school.color} text-white text-xs font-bold rounded-full shadow-md`}>
                      {school.badge}
                    </div>
                  )}

                  {/* Card Header */}
                  <div className={`bg-gradient-to-r ${school.color} p-5 text-white rounded-t-2xl`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-2xl font-bold">{school.price}</span>
                    </div>
                    <h3 className="text-lg font-bold">{school.name}</h3>
                    <div className="flex items-center space-x-3 mt-2 text-white/80 text-sm">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {school.duration}
                      </span>
                      <span className="flex items-center">
                        <Globe className="h-4 w-4 mr-1" />
                        {school.format}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <ul className="space-y-2.5">
                      {school.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`w-full mt-4 py-3 font-semibold rounded-xl transition-all ${
                        selectedSchool === school.id
                          ? `bg-gradient-to-r ${school.color} text-white`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {selectedSchool === school.id ? 'View Syllabus Below' : 'Select & View Syllabus'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Syllabus Details (Shown when a school is selected) */}
        {selectedSchool && (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200 animate-fade-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {schoolOptions.find(s => s.id === selectedSchool)?.name} - Syllabus
                </h2>
                <p className="text-sm text-gray-600">Detailed curriculum breakdown</p>
              </div>
            </div>

            <div className="space-y-4">
              {syllabusDetails[selectedSchool]?.weeks.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-20 flex-shrink-0">
                    <span className="text-sm font-bold text-[#323956]">{item.week}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.topic}</h4>
                    <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] rounded-2xl p-8 text-white">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold mb-2">Ready to Start Your Coaching Journey?</h3>
              <p className="text-blue-200">
                Join Dr. Shweta's 5 Pillars of Mastery program. Limited seats available for each batch.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={openProgramForm}
                className="px-6 py-3 bg-[#F5D05D] text-gray-900 font-semibold rounded-xl hover:bg-[#E5C04D] transition-colors whitespace-nowrap flex items-center justify-center"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Apply Now
              </button>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors whitespace-nowrap flex items-center justify-center"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                Contact Us
              </a>
            </div>
          </div>
        </div>

        {/* Early Bird Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
          <Star className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Early Bird Offer:</strong> Enroll before the next batch starts and get 20% off on any certification program. Limited seats available for each batch.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CoachCertification;
