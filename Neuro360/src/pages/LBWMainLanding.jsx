import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Activity,
  Users,
  Target,
  TrendingUp,
  Heart,
  Zap,
  BookOpen,
  BarChart3,
  Award,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

const LBWMainLanding = () => {
  const navigate = useNavigate();
  const [visibleSections, setVisibleSections] = useState(new Set());
  const observerRefs = useRef([]);
  const [animatedStats, setAnimatedStats] = useState({
    activeUsers: 0,
    successRate: 0,
    coaches: 0
  });
  const statsAnimated = useRef(false);

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

              // Trigger counter animation for stats section
              if (sectionId === 'stats' && !statsAnimated.current) {
                statsAnimated.current = true;
                animateCounter('activeUsers', 0, 1000, 2000);
                animateCounter('successRate', 0, 95, 2000);
                animateCounter('coaches', 0, 5, 1500);
              }
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

  // Counter animation function
  const animateCounter = (key, start, end, duration) => {
    const startTime = performance.now();
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = Math.floor(start + (end - start) * easedProgress);

      setAnimatedStats((prev) => ({ ...prev, [key]: currentValue }));

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  };

  const features = [
    {
      title: 'Brain Wellness Assessments',
      description: 'Evidence based assessments including ADHD, anxiety, stress, memory, and mood evaluations',
      icon: <Brain className="w-8 h-8" />,
      path: '/assessments',
      color: 'from-[#323956] to-[#323956]',
      items: ['ADHD Rating Scale', 'GAD 7 Anxiety', 'PSS 10 Stress', 'Memory Tests', 'Mood Evaluation']
    },
    {
      title: 'Expert Coaching',
      description: 'Connect with certified brain wellness coaches for personalized guidance',
      icon: <Users className="w-8 h-8" />,
      path: '/coaching',
      color: 'from-[#323956] to-[#323956]',
      items: ['Brain Performance', 'Nervous System', 'qEEG Consultation', 'Stress Management', 'ADHD Support']
    },
    {
      title: 'Progress Tracking',
      description: 'Monitor your brain fitness journey with detailed analytics and insights',
      icon: <TrendingUp className="w-8 h-8" />,
      path: '/lbw/progress',
      color: 'from-[#323956] to-[#323956]',
      items: ['Weekly Reports', 'Goal Setting', 'Improvement Metrics', 'Personalized Insights']
    },
    {
      title: 'Educational Content',
      description: 'Learn about brain wellness with our comprehensive resource library',
      icon: <BookOpen className="w-8 h-8" />,
      path: '/lbw/content',
      color: 'from-[#323956] to-[#323956]',
      items: ['Video Tutorials', 'Articles', 'Research Papers', 'Webinars']
    },
    {
      title: 'Personal Dashboard',
      description: 'Your central hub for all brain wellness activities and data',
      icon: <BarChart3 className="w-8 h-8" />,
      path: '/lbw/dashboard',
      color: 'from-[#323956] to-[#323956]',
      items: ['Activity Overview', 'Upcoming Sessions', 'Recent Results', 'Recommendations']
    },
    {
      title: 'Community + Inspiration',
      description: 'Connect with like-minded individuals and get inspired on your brain wellness journey',
      icon: <Heart className="w-8 h-8" />,
      path: '/community',
      color: 'from-[#323956] to-[#323956]',
      items: ['Success Stories', 'Community Forums', 'Live Events', 'Peer Support']
    }
  ];

  const stats = [
    { number: '1,000', label: 'Active Users' },
    { number: '95%', label: 'Success Rate' },
    { number: '5+', label: 'Expert Coaches' },
    { number: '24/7', label: 'Support Available' }
  ];

  const testimonials = [
    {
      name: 'Success Story 1',
      role: 'Corporate Clarity',
      content: 'Through brain assessments and qEEG insights, a senior leader moved from mental overload to focused, calm decision-making. With expert coaching and progress tracking, performance became sustainable, not stressful.',
      rating: 5
    },
    {
      name: 'Success Story 2',
      role: 'Student Confidence',
      content: 'A child struggling with focus and anxiety unlocked hidden potential through brain-first assessment and guided coaching. Improved attention, emotional balance, and confidence followed, without pressure or labels.',
      rating: 5
    },
    {
      name: 'Success Story 3',
      role: 'Burnout to Brain Fitness',
      content: 'A high performer reversed burnout by understanding and regulating stress circuits through qEEG-led optimization. Energy, sleep, and emotional resilience were restored through structured brain fitness tracking.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4EFFF] via-white to-gray-50 overflow-x-hidden">
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

      {/* Hero Section with Banner */}
      <section className="relative overflow-hidden pt-14 sm:pt-16 md:pt-20 min-h-[280px] sm:min-h-[350px] md:min-h-[450px] lg:min-h-[550px]">
        {/* Banner Background Image */}
        <div className="absolute inset-0">
          <img
            src="/aboutus page banner image.jpeg"
            alt="Brain Wellness Banner"
            className="w-full h-full object-cover object-right-top sm:object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-b sm:bg-gradient-to-r from-[#323956]/95 via-[#323956]/85 to-[#323956]/50 sm:from-[#323956]/90 sm:via-[#323956]/70 sm:to-[#323956]/30 md:from-[#323956]/80 md:via-[#323956]/50 md:to-transparent"></div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-10 md:py-14 lg:py-20 relative">
          <div className="max-w-2xl">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 sm:mb-3 md:mb-5 leading-tight">
              Limitless Brain Wellness
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white/90 font-medium mb-2 sm:mb-3 md:mb-4 italic">
              Transform your brain. Elevate your life.
            </p>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/80 mb-4 sm:mb-6 md:mb-8 leading-relaxed max-w-xl">
              Comprehensive brain fitness platform with evidence based assessments, expert brain coaching and personalized MOVERS protocols.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
              <button
                onClick={() => navigate('/neurosense-booking?type=individual')}
                className="px-4 sm:px-5 md:px-6 lg:px-8 py-2.5 sm:py-3 md:py-3.5 lg:py-4 bg-[#323956] text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-base lg:text-lg hover:bg-[#232D3C] hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Request Assessment
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-6 sm:py-8 md:py-12 lg:py-16 bg-white" data-scroll-section="stats">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            <div className="text-center card-slide-alternate">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-[#323956]">
                {animatedStats.activeUsers.toLocaleString()}
              </div>
              <div className="text-[11px] sm:text-xs md:text-sm lg:text-base text-gray-600 mt-1 sm:mt-2">Active Users</div>
            </div>
            <div className="text-center card-slide-alternate">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-[#323956]">
                {animatedStats.successRate}%
              </div>
              <div className="text-[11px] sm:text-xs md:text-sm lg:text-base text-gray-600 mt-1 sm:mt-2">Success Rate</div>
            </div>
            <div className="text-center card-slide-alternate">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-[#323956]">
                {animatedStats.coaches}+
              </div>
              <div className="text-[11px] sm:text-xs md:text-sm lg:text-base text-gray-600 mt-1 sm:mt-2">Expert Coaches</div>
            </div>
            <div className="text-center card-slide-alternate">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-[#323956]">
                24/7
              </div>
              <div className="text-[11px] sm:text-xs md:text-sm lg:text-base text-gray-600 mt-1 sm:mt-2">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20" data-scroll-section="features">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-5 sm:mb-8 md:mb-12 scroll-fade-up">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
              Complete Brain Wellness Suite
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need for optimal brain health and cognitive performance
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-5 lg:gap-8" data-scroll-section="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group card-slide-alternate"
              >
                <div className={`h-1 sm:h-1.5 md:h-2 bg-gradient-to-r ${feature.color}`}></div>
                <div className="p-3 sm:p-4 md:p-6 lg:p-8">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-gradient-to-r ${feature.color} rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4 lg:mb-6 text-white group-hover:scale-110 transition-transform [&_svg]:w-4 [&_svg]:h-4 sm:[&_svg]:w-5 sm:[&_svg]:h-5 md:[&_svg]:w-6 md:[&_svg]:h-6 lg:[&_svg]:w-8 lg:[&_svg]:h-8`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl font-bold text-gray-900 mb-1 sm:mb-1.5 md:mb-2 lg:mb-3 leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-600 mb-2 sm:mb-3 md:mb-4 lg:mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4 lg:mb-6 hidden sm:block">
                    {feature.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-gray-600">
                        <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-[#323956] flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-white" data-scroll-section="process">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-5 sm:mb-8 md:mb-12 scroll-fade-down">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
              Your Journey to Brain Wellness
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 max-w-3xl mx-auto">
              A simple, science-backed process to optimize your cognitive health
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8" data-scroll-section="process-steps">
            {[
              { step: '1', title: 'Assess', desc: 'Take your Limitless Brain Lab qEEG assessment', icon: <Brain /> },
              { step: '2', title: 'Analyze', desc: 'Get your detailed insights with over 17 brain wellness parameters', icon: <Activity /> },
              { step: '3', title: 'Connect', desc: 'Match with expert coaches and customized protocols', icon: <Users /> },
              { step: '4', title: 'Transform', desc: 'Track progress and achieve your goals', icon: <Sparkles /> }
            ].map((item, index) => (
              <div key={index} className="text-center card-slide-alternate">
                <div className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-[#323956] rounded-full flex items-center justify-center text-white mx-auto mb-2 sm:mb-3 md:mb-4 [&_svg]:w-5 [&_svg]:h-5 sm:[&_svg]:w-6 sm:[&_svg]:h-6 md:[&_svg]:w-8 md:[&_svg]:h-8 lg:[&_svg]:w-10 lg:[&_svg]:h-10">
                  {item.icon}
                </div>
                <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1 md:mb-2">{item.title}</h3>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-600 leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20" data-scroll-section="testimonials">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-5 sm:mb-7 md:mb-10 lg:mb-12 scroll-fade-up">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
              Success Stories
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands who have transformed their brain health
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8" data-scroll-section="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 lg:p-8 card-slide-alternate">
                <div className="flex mb-2 sm:mb-3 md:mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-[13px] md:text-sm lg:text-base text-gray-600 mb-3 sm:mb-4 md:mb-6 italic leading-relaxed">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-xs sm:text-sm md:text-base text-gray-900">{testimonial.name}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <Footer />
    </div>
  );
};

export default LBWMainLanding;