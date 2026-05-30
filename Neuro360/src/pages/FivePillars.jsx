import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeatureGate from '../components/access/FeatureGate';
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
  Video,
  Globe,
  Zap
} from 'lucide-react';

const FivePillars = () => {
  const navigate = useNavigate();
  const [selectedSchool, setSelectedSchool] = useState(null);

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-purple-50/30 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <button
            onClick={() => navigate('/dashboard/welcome')}
            className="flex items-center space-x-2 text-blue-200 hover:text-white mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-2.5 sm:space-x-4">
            <div className="bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 flex-shrink-0">
              <GraduationCap className="h-5 w-5 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 className="text-base sm:text-2xl md:text-3xl font-bold">5 Pillars of Mastery</h1>
              <p className="text-blue-200 mt-0.5 sm:mt-1 text-[11px] sm:text-sm md:text-base">
                Become a Certified Brain Health Coach
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {/* Introduction */}
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-purple-200 dark:border-purple-700">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md flex-shrink-0">
              <Briefcase className="h-5 w-5 sm:h-8 sm:w-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                Start Your Journey as a Brain Health Coach
              </h2>
              <p className="text-xs sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                Dr. Shweta's 5 Pillars of Mastery certification program trains you to become a certified brain health coach.
                Choose from three educational pathways designed for different career goals—from personal development to building a professional coaching practice.
              </p>
            </div>
          </div>
        </div>

        {/* The 5 Pillars - Core Curriculum */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-6">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#E4EFFF] dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-[#323956] dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white">Core Curriculum: The 5 Pillars</h2>
              <p className="text-[11px] sm:text-sm text-gray-600 dark:text-gray-400">Foundation of all certification programs</p>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.number}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl"
                >
                  <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-0.5">
                      <span className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500">PILLAR {pillar.number}</span>
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">{pillar.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{pillar.subtitle}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {pillar.modules.slice(0, 3).map((module, idx) => (
                      <span key={idx} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                        {module}
                      </span>
                    ))}
                    {pillar.modules.length > 3 && (
                      <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-200 dark:bg-gray-600 rounded-full text-gray-600 dark:text-gray-400">
                        +{pillar.modules.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FivePillars;
