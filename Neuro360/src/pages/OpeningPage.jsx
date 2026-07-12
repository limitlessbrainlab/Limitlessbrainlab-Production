import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Zap,
  Heart,
  Target,
  Battery,
  Smile,
  GraduationCap,
  Lightbulb,
  ChevronRight,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const OpeningPage = () => {
  const navigate = useNavigate();
  const [activeParameter, setActiveParameter] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    // Auto-cycle through parameters for visual effect
    const interval = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % 7);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // The 7 NeuroSense neurological parameters
  const parameters = [
    {
      id: 'cognition',
      name: 'Cognition',
      icon: Brain,
      color: '#06b6d4',
      gradient: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      description: 'Mental processing speed, reasoning, and cognitive flexibility',
      details: 'Measures your brain\'s ability to process information, solve problems, and adapt thinking patterns.',
      position: { top: '5%', left: '50%', transform: 'translateX(-50%)' },
      brainRegion: 'Prefrontal Cortex'
    },
    {
      id: 'stress',
      name: 'Stress',
      icon: Heart,
      color: '#ef4444',
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: 'Autonomic nervous system balance and stress response',
      details: 'Evaluates your sympathetic vs parasympathetic nervous system activity and stress resilience.',
      position: { top: '20%', right: '5%' },
      brainRegion: 'Amygdala & HPA Axis'
    },
    {
      id: 'focus',
      name: 'Focus & Attention',
      icon: Target,
      color: '#f97316',
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      description: 'Sustained attention, concentration, and mental clarity',
      details: 'Assesses your ability to maintain focus, filter distractions, and sustain attention on tasks.',
      position: { top: '50%', right: '0%', transform: 'translateY(-50%)' },
      brainRegion: 'Anterior Cingulate'
    },
    {
      id: 'burnout',
      name: 'Burnout & Fatigue',
      icon: Battery,
      color: '#8b5cf6',
      gradient: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200',
      description: 'Mental exhaustion, energy levels, and recovery capacity',
      details: 'Measures signs of mental fatigue, burnout indicators, and your brain\'s recovery patterns.',
      position: { bottom: '20%', right: '5%' },
      brainRegion: 'Default Mode Network'
    },
    {
      id: 'emotional',
      name: 'Emotional Regulation',
      icon: Smile,
      color: '#ec4899',
      gradient: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      description: 'Emotional stability, mood balance, and self-regulation',
      details: 'Evaluates your ability to manage emotions, maintain mood stability, and respond to emotional triggers.',
      position: { bottom: '5%', left: '50%', transform: 'translateX(-50%)' },
      brainRegion: 'Limbic System'
    },
    {
      id: 'learning',
      name: 'Learning',
      icon: GraduationCap,
      color: '#3b82f6',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Memory encoding, retention, and knowledge acquisition',
      details: 'Assesses your brain\'s capacity for learning new information, memory formation, and recall.',
      position: { bottom: '20%', left: '5%' },
      brainRegion: 'Hippocampus'
    },
    {
      id: 'creativity',
      name: 'Creativity',
      icon: Lightbulb,
      color: '#eab308',
      gradient: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      description: 'Creative thinking, innovation, and ideation ability',
      details: 'Measures your capacity for original thinking, problem-solving creativity, and idea generation.',
      position: { top: '50%', left: '0%', transform: 'translateY(-50%)' },
      brainRegion: 'Right Hemisphere'
    }
  ];

  const handleParameterClick = (param) => {
    // Navigate to detailed information page
    navigate(`/dashboard/neurosense-details?parameter=${param.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="bg-white/20 rounded-xl p-3">
                <Brain className="h-8 w-8" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">Limitless Brain Lab Brain Analysis</h1>
            </div>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto">
              Discover your brain's potential through 7 key neurological parameters. Click on any parameter to explore detailed insights.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Interactive Brain Model Section */}
        <div className={`relative mb-12 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Brain Visualization Container */}
          <div className="relative w-full max-w-4xl mx-auto aspect-square md:aspect-[4/3]">
            {/* Central Brain SVG */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80">
                {/* Pulsing glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>

                {/* Brain SVG */}
                <svg viewBox="0 0 200 200" className="w-full h-full relative z-10">
                  <defs>
                    <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#323956" />
                      <stop offset="50%" stopColor="#4a5578" />
                      <stop offset="100%" stopColor="#323956" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Brain outline - Left hemisphere */}
                  <path
                    d="M100 20 C60 20 30 50 25 90 C20 130 40 160 60 175 C80 190 100 185 100 185"
                    fill="none"
                    stroke="url(#brainGradient)"
                    strokeWidth="3"
                    filter="url(#glow)"
                    className="transition-all duration-500"
                  />

                  {/* Brain outline - Right hemisphere */}
                  <path
                    d="M100 20 C140 20 170 50 175 90 C180 130 160 160 140 175 C120 190 100 185 100 185"
                    fill="none"
                    stroke="url(#brainGradient)"
                    strokeWidth="3"
                    filter="url(#glow)"
                    className="transition-all duration-500"
                  />

                  {/* Brain folds - Left */}
                  <path
                    d="M40 60 Q60 70 50 90 Q40 110 55 120"
                    fill="none"
                    stroke="#4a5578"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                  <path
                    d="M45 100 Q65 95 60 115 Q55 135 70 145"
                    fill="none"
                    stroke="#4a5578"
                    strokeWidth="2"
                    opacity="0.6"
                  />

                  {/* Brain folds - Right */}
                  <path
                    d="M160 60 Q140 70 150 90 Q160 110 145 120"
                    fill="none"
                    stroke="#4a5578"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                  <path
                    d="M155 100 Q135 95 140 115 Q145 135 130 145"
                    fill="none"
                    stroke="#4a5578"
                    strokeWidth="2"
                    opacity="0.6"
                  />

                  {/* Central connection */}
                  <line x1="100" y1="50" x2="100" y2="150" stroke="#4a5578" strokeWidth="2" opacity="0.4" />

                  {/* Neural connection dots */}
                  {parameters.map((param, idx) => {
                    const angle = (idx * 360 / 7 - 90) * (Math.PI / 180);
                    const cx = 100 + 55 * Math.cos(angle);
                    const cy = 100 + 55 * Math.sin(angle);
                    return (
                      <g key={param.id}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={activeParameter === param.id || pulseIndex === idx ? 8 : 5}
                          fill={param.color}
                          className="transition-all duration-300 cursor-pointer"
                          style={{
                            filter: activeParameter === param.id || pulseIndex === idx ? `drop-shadow(0 0 8px ${param.color})` : 'none'
                          }}
                          onMouseEnter={() => setActiveParameter(param.id)}
                          onMouseLeave={() => setActiveParameter(null)}
                          onClick={() => handleParameterClick(param)}
                        />
                        {/* Connecting line to center */}
                        <line
                          x1="100"
                          y1="100"
                          x2={cx}
                          y2={cy}
                          stroke={param.color}
                          strokeWidth="1"
                          opacity={activeParameter === param.id || pulseIndex === idx ? 0.8 : 0.3}
                          className="transition-all duration-300"
                        />
                      </g>
                    );
                  })}

                  {/* Center point */}
                  <circle cx="100" cy="100" r="8" fill="#323956" />
                  <circle cx="100" cy="100" r="4" fill="#E4EFFF" />
                </svg>

                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center mt-32 md:mt-40">
                    <Sparkles className="h-5 w-5 mx-auto text-[#323956] mb-1" />
                    <span className="text-xs font-medium text-[#323956]">Limitless Brain Lab</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parameter Cards positioned around the brain */}
            {parameters.map((param, index) => {
              const Icon = param.icon;
              const isActive = activeParameter === param.id || pulseIndex === index;

              return (
                <div
                  key={param.id}
                  className={`absolute transition-all duration-500 ${isActive ? 'scale-110 z-20' : 'scale-100 z-10'}`}
                  style={param.position}
                >
                  <button
                    onClick={() => handleParameterClick(param)}
                    onMouseEnter={() => setActiveParameter(param.id)}
                    onMouseLeave={() => setActiveParameter(null)}
                    className={`
                      group flex items-center space-x-2 px-3 py-2 md:px-4 md:py-3 rounded-xl
                      bg-white dark:bg-gray-800 shadow-lg border-2 transition-all duration-300
                      hover:shadow-xl cursor-pointer
                      ${isActive ? `border-${param.color} shadow-lg` : 'border-gray-200 dark:border-gray-700'}
                    `}
                    style={{
                      borderColor: isActive ? param.color : undefined,
                      boxShadow: isActive ? `0 4px 20px ${param.color}40` : undefined
                    }}
                  >
                    <div
                      className={`p-2 rounded-lg transition-all duration-300`}
                      style={{ backgroundColor: `${param.color}20` }}
                    >
                      <Icon
                        className="h-4 w-4 md:h-5 md:w-5 transition-all duration-300"
                        style={{ color: param.color }}
                      />
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {param.name}
                      </p>
                      {isActive && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[150px] truncate">
                          {param.brainRegion}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 text-gray-400 transition-all duration-300 ${isActive ? 'translate-x-1 opacity-100' : 'opacity-0'}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Parameter Detail Cards Grid */}
        <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Explore All 7 Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {parameters.map((param, index) => {
              const Icon = param.icon;
              return (
                <button
                  key={param.id}
                  onClick={() => handleParameterClick(param)}
                  onMouseEnter={() => setActiveParameter(param.id)}
                  onMouseLeave={() => setActiveParameter(null)}
                  className={`
                    group p-5 rounded-2xl border-2 text-left transition-all duration-300
                    bg-white dark:bg-gray-800 hover:shadow-xl
                    ${activeParameter === param.id ? 'border-opacity-100 shadow-lg' : 'border-gray-200 dark:border-gray-700'}
                  `}
                  style={{
                    borderColor: activeParameter === param.id ? param.color : undefined,
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110`}
                      style={{ backgroundColor: `${param.color}15` }}
                    >
                      <Icon
                        className="h-6 w-6 transition-all duration-300"
                        style={{ color: param.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-opacity-90">
                        {param.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {param.description}
                      </p>
                      <div className="flex items-center text-xs font-medium" style={{ color: param.color }}>
                        <span>{param.brainRegion}</span>
                        <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className={`mt-12 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] rounded-2xl p-6 md:p-8 text-white text-center">
            <h3 className="text-xl md:text-2xl font-bold mb-3">Ready to Discover Your Brain Profile?</h3>
            <p className="text-blue-200 mb-6 max-w-xl mx-auto">
              Get a comprehensive Limitless Brain Lab assessment and receive personalized insights for optimizing your brain health.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/neurosense-booking')}
                className="px-6 py-3 bg-white text-[#323956] font-semibold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center"
              >
                <Zap className="h-5 w-5 mr-2" />
                Book Assessment
              </button>
              <button
                onClick={() => navigate('/dashboard/welcome')}
                className="px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors flex items-center justify-center"
              >
                View Dashboard
                <ChevronRight className="h-5 w-5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpeningPage;
