import React, { useState, useEffect, useRef } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { ChevronUp, ChevronDown, Brain, Target, Zap } from 'lucide-react';
import { useProgramForm } from '../context/ProgramFormContext';

const FAQ = () => {
  const { openProgramForm } = useProgramForm();
  const [openIndex, setOpenIndex] = useState(0);
  const [isVisible, setIsVisible] = useState({
    hero: false,
    cards: false,
    about: false,
    accordion: false
  });

  const heroRef = useRef(null);
  const cardsRef = useRef(null);
  const aboutRef = useRef(null);
  const accordionRef = useRef(null);

  useEffect(() => {
    // Trigger hero animation on mount
    setTimeout(() => setIsVisible(prev => ({ ...prev, hero: true })), 100);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target.dataset.section;
            setIsVisible(prev => ({ ...prev, [section]: true }));
          }
        });
      },
      { threshold: 0.2 }
    );

    if (cardsRef.current) observer.observe(cardsRef.current);
    if (aboutRef.current) observer.observe(aboutRef.current);
    if (accordionRef.current) observer.observe(accordionRef.current);

    return () => observer.disconnect();
  }, []);

  const performancePlanItems = [
    {
      title: "Turns Brain Data into Clear Action",
      description: "Clients often receive brain reports but don't know what to do next. The 100X Performance Plan bridges this gap by converting brain insights into practical, step-by-step upgrades that fit seamlessly into daily life."
    },
    {
      title: "Improves Focus Without Burnout",
      description: "By identifying attention leaks and cognitive overload patterns, the plan helps clients build deep focus and mental clarity without relying on excessive effort, stimulants, or long working hours."
    },
    {
      title: "Triggers Flow States Consistently",
      description: "Rather than waiting for motivation, clients learn how to engineer flow by aligning tasks, timing, and brain states so peak performance becomes repeatable, not accidental."
    },
    {
      title: "Enhances Emotional Regulation & Decision-Making",
      description: "Small neuro-aligned shifts improve emotional balance, stress resilience, and impulse control, leading to better decisions under pressure. This is a critical marker of top 100X performers."
    },
    {
      title: "Builds Sustainable High Performance",
      description: "The plan avoids extremes. By focusing on marginal gains, clients experience long-term consistency, improved energy, and performance that compounds over time without exhaustion or overwhelm."
    },
    {
      title: "Creates Measurable Progress",
      description: "Clients don't just feel better, they see progress in clarity, productivity, confidence, and execution. Each 100X gain stacks, creating a powerful performance curve over weeks and months."
    }
  ];

  const neurosenseFAQs = [
    {
      question: "How do I schedule a NeuroSense assessment?",
      answer: "You can schedule your NeuroSense assessment directly through our platform by clicking 'Book Assessment' on your dashboard. Choose a convenient time slot, and our team will guide you through the process. The assessment can be done at a partner clinic or remotely depending on the type of scan."
    },
    {
      question: "What is a qEEG assessment and how does it work?",
      answer: "A qEEG (Quantitative Electroencephalogram) is a non-invasive brain mapping technique that records electrical activity across your brain using sensors placed on the scalp. The data is then analysed to create a detailed map of your brain's function, identifying areas of strength and areas that may benefit from optimisation."
    },
    {
      question: "Is NeuroSense a medical diagnostic test?",
      answer: "No, NeuroSense is not a medical diagnostic test. It is a brain wellness and performance assessment tool designed to provide insights into cognitive function, stress levels, and brain health. It does not diagnose medical conditions. For medical concerns, please consult a qualified healthcare professional."
    },
    {
      question: "Who is on the multidisciplinary support team?",
      answer: "Our team includes neurologists, neuroscience researchers, certified brain coaches, yoga and wellness experts, nutritionists, and mantra therapists. Together, they provide a holistic approach to brain wellness, combining clinical expertise with integrative wellness practices."
    },
    {
      question: "How accurate are the NeuroSense results?",
      answer: "NeuroSense results are based on validated neuroscience methodologies and qEEG analysis. The accuracy depends on the quality of the brain recording and the specific parameters being measured. Our algorithms are continuously refined based on the latest research to ensure reliable and meaningful insights."
    },
    {
      question: "What types of recommendations will I receive?",
      answer: "Based on your assessment, you'll receive personalised recommendations across multiple areas including breathing protocols (ANS Reset), meditation practices, physical exercises (MOVERS protocol), nutritional guidance, frequency-based therapies, and lifestyle modifications — all tailored to your specific brain profile."
    },
    {
      question: "How often should I repeat the scan?",
      answer: "We recommend repeating your NeuroSense assessment every 6-8 weeks. This allows enough time for the recommended protocols and lifestyle changes to take effect, and provides a clear picture of your brain's progress and areas for continued improvement."
    },
    {
      question: "How do I track my progress?",
      answer: "Your patient dashboard provides comprehensive progress tracking including weekly MOVERS protocol completion, brain parameter trends over time, care program adherence, and comparative reports between assessments. You can view all your data in one place."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, your data security is our top priority. All personal and brain data is encrypted and stored securely using industry-standard protocols. We comply with data protection regulations and never share your information with third parties without your explicit consent."
    },
    {
      question: "How do I interpret my report?",
      answer: "Your NeuroSense report includes detailed explanations for each brain parameter measured. Additionally, our brain coaches are available to walk you through your results, explain what each score means, and help you understand the personalised care plan designed for your unique brain profile."
    },
    {
      question: "What areas can NeuroSense help with?",
      answer: "NeuroSense can help with a wide range of areas including stress management, anxiety reduction, focus and attention improvement, sleep optimisation, emotional regulation, burnout recovery, cognitive enhancement, creativity boosting, and overall brain wellness and performance."
    }
  ];

  const [openFAQIndex, setOpenFAQIndex] = useState(-1);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  const toggleNeurosenseFAQ = (index) => {
    setOpenFAQIndex(openFAQIndex === index ? -1 : index);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-fadeInDown {
          animation: fadeInDown 0.8s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.6s ease-out forwards;
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.8s ease-out forwards;
        }
        .animate-slideInRight {
          animation: slideInRight 0.8s ease-out forwards;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
      `}</style>

      <NavBar />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="bg-gradient-to-br from-[#323956] to-[#1a1f2e] text-white pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-10 sm:pb-14 md:pb-18 lg:pb-20 px-3 sm:px-5 md:px-8 lg:px-10 overflow-hidden"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 md:mb-5 lg:mb-6 opacity-0 leading-tight ${
              isVisible.hero ? 'animate-fadeInDown' : ''
            }`}
          >
            The 100X Performance Plan
          </h1>
          <p
            className={`text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-300 max-w-3xl mx-auto mb-4 sm:mb-6 md:mb-7 lg:mb-8 opacity-0 leading-relaxed ${
              isVisible.hero ? 'animate-fadeInUp delay-200' : ''
            }`}
          >
            Unlock elite performance through precision brain optimisation
          </p>
          <button
            onClick={openProgramForm}
            className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 sm:py-3 md:py-3.5 lg:py-4 bg-[#F5D05D] hover:bg-[#e5c04d] text-[#323956] rounded-full text-xs sm:text-sm md:text-base lg:text-lg font-semibold transition-all hover:scale-105 shadow-lg opacity-0 cursor-pointer ${
              isVisible.hero ? 'animate-fadeInUp delay-300' : ''
            }`}
          >
            Join Our Waitlist
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Your Coaches */}
          <div className={`mt-8 sm:mt-10 md:mt-12 opacity-0 ${isVisible.hero ? 'animate-fadeInUp delay-500' : ''}`}>
            <div className="inline-flex items-center gap-2 mb-4 sm:mb-6 md:mb-8">
              <div className="h-px w-6 sm:w-8 md:w-12 bg-gradient-to-r from-transparent to-[#F5D05D]/60"></div>
              <p className="text-[#F5D05D] text-[10px] sm:text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">Your Coaches</p>
              <div className="h-px w-6 sm:w-8 md:w-12 bg-gradient-to-l from-transparent to-[#F5D05D]/60"></div>
            </div>
            <div className="flex items-center justify-center gap-6 sm:gap-10 md:gap-16 lg:gap-20">
              {/* Sajiv Nair */}
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="relative mb-2 sm:mb-3">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden border-[2px] sm:border-[3px] border-white/20 shadow-xl group-hover:border-[#F5D05D] transition-all duration-500 group-hover:shadow-[0_0_25px_rgba(245,208,93,0.3)]">
                    <img
                      src="/Dr Sajiv Nair.jpg"
                      alt="Sajiv Nair"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-[#F5D05D] rounded-full flex items-center justify-center shadow-lg border-2 border-[#323956]">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-[#323956]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                </div>
                <h3 className="text-white text-xs sm:text-sm md:text-base lg:text-lg font-bold group-hover:text-[#F5D05D] transition-colors duration-300">Sajiv Nair</h3>
                <p className="text-gray-400 text-[9px] sm:text-[10px] md:text-xs mt-0.5">Performance Coach</p>
              </div>
              {/* Dr Sweta Adatia */}
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="relative mb-2 sm:mb-3">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden border-[2px] sm:border-[3px] border-white/20 shadow-xl group-hover:border-[#F5D05D] transition-all duration-500 group-hover:shadow-[0_0_25px_rgba(245,208,93,0.3)]">
                    <img
                      src="/dr.sweta.JPG"
                      alt="Dr Sweta Adatia"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-[#F5D05D] rounded-full flex items-center justify-center shadow-lg border-2 border-[#323956]">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-[#323956]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                </div>
                <h3 className="text-white text-xs sm:text-sm md:text-base lg:text-lg font-bold group-hover:text-[#F5D05D] transition-colors duration-300">Dr Sweta Adatia</h3>
                <p className="text-gray-400 text-[9px] sm:text-[10px] md:text-xs mt-0.5">Neurologist & Founder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow">
        {/* About Section */}
        <section className="py-8 sm:py-10 md:py-12 lg:py-16 px-3 sm:px-5 md:px-8 lg:px-10 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            {/* Feature Cards */}
            <div
              ref={cardsRef}
              data-section="cards"
              className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 lg:gap-8 mb-6 sm:mb-8 md:mb-10 lg:mb-12"
            >
              <div
                className={`bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 text-center opacity-0 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                  isVisible.cards ? 'animate-fadeInUp' : ''
                }`}
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-[#323956]/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 hover:bg-[#323956]/20 transition-colors">
                  <Brain className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-[#323956]" />
                </div>
                <h3 className="text-[11px] sm:text-xs md:text-sm lg:text-base font-semibold text-gray-900 mb-0.5 sm:mb-1 md:mb-2">Brain Optimization</h3>
                <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-gray-600 leading-snug">Precision-designed framework for your unique brain</p>
              </div>
              <div
                className={`bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 text-center opacity-0 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                  isVisible.cards ? 'animate-fadeInUp delay-200' : ''
                }`}
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-[#323956]/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 hover:bg-[#323956]/20 transition-colors">
                  <Target className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-[#323956]" />
                </div>
                <h3 className="text-[11px] sm:text-xs md:text-sm lg:text-base font-semibold text-gray-900 mb-0.5 sm:mb-1 md:mb-2">100X Upgrades</h3>
                <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-gray-600 leading-snug">High-leverage improvements that compound daily</p>
              </div>
              <div
                className={`bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 text-center opacity-0 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                  isVisible.cards ? 'animate-fadeInUp delay-400' : ''
                }`}
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-[#323956]/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 hover:bg-[#323956]/20 transition-colors">
                  <Zap className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-[#323956]" />
                </div>
                <h3 className="text-[11px] sm:text-xs md:text-sm lg:text-base font-semibold text-gray-900 mb-0.5 sm:mb-1 md:mb-2">Peak Performance</h3>
                <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-gray-600 leading-snug">Achieve flow states and elite results</p>
              </div>
            </div>

            {/* About Card */}
            <div
              ref={aboutRef}
              data-section="about"
              className={`bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-5 md:p-6 lg:p-8 shadow-sm border border-gray-100 opacity-0 hover:shadow-md transition-shadow duration-300 ${
                isVisible.about ? 'animate-scaleIn' : ''
              }`}
            >
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#323956] mb-2.5 sm:mb-4 md:mb-5 lg:mb-6">
                What is The 100X Performance Plan?
              </h2>
              <p className="text-[13px] sm:text-sm md:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
                The 100X Performance Plan is a precision-designed brain optimisation framework focused on unlocking elite performance by improving the smallest, most impactful levers of your brain and behavior. Instead of chasing drastic change, the plan works on high-leverage 100X upgrades across cognition, focus, emotional regulation, energy, and decision-making, all mapped directly to your individual brain analysis.
              </p>
              <p className="text-[13px] sm:text-sm md:text-base text-gray-700 leading-relaxed">
                This plan is built on the science of flow states, neuroplasticity, and peak performance, translating complex brain data into simple, actionable strategies you can apply daily. Every recommendation, whether it's related to sleep timing, focus blocks, emotional mastery, nutrition, or recovery, is personalized to how your brain is wired.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section
          ref={accordionRef}
          data-section="accordion"
          className="py-8 sm:py-10 md:py-12 lg:py-16 px-3 sm:px-5 md:px-8 lg:px-10 bg-white"
        >
          <div className="max-w-3xl mx-auto">
            <div className={`text-center mb-5 sm:mb-8 md:mb-10 lg:mb-12 opacity-0 ${isVisible.accordion ? 'animate-fadeIn' : ''}`}>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
                How the 100X Performance Plan Helps Clients
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">
                Discover the key benefits of our brain optimisation framework
              </p>
            </div>

            {/* Accordion */}
            <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
              {performancePlanItems.map((item, index) => (
                <div
                  key={index}
                  className={`rounded-lg sm:rounded-xl border overflow-hidden transition-all duration-300 opacity-0 ${
                    openIndex === index
                      ? 'border-[#323956] shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isVisible.accordion ? 'animate-fadeInUp' : ''}`}
                  style={{ animationDelay: isVisible.accordion ? `${index * 0.1}s` : '0s' }}
                >
                  {/* Question Header */}
                  <button
                    onClick={() => toggleFAQ(index)}
                    className={`w-full px-3 sm:px-4 md:px-5 lg:px-6 py-2.5 sm:py-3 md:py-4 lg:py-5 text-left flex items-center justify-between transition-all duration-300 ${
                      openIndex === index ? 'bg-[#323956] text-white' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 min-w-0">
                      <span className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-bold flex-shrink-0 transition-all duration-300 ${
                        openIndex === index
                          ? 'bg-white text-[#323956]'
                          : 'bg-[#323956]/10 text-[#323956]'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-[13px] sm:text-sm md:text-base font-medium leading-snug">
                        {item.title}
                      </span>
                    </span>
                    <span className={`flex-shrink-0 ml-2 transition-transform duration-300 ${
                      openIndex === index ? 'text-white rotate-180' : 'text-gray-400'
                    }`}>
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    </span>
                  </button>

                  {/* Answer Content */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-2.5 sm:py-3 md:py-4 lg:py-5 bg-gray-50 border-t border-gray-100">
                      <p className="text-[12px] sm:text-xs md:text-sm lg:text-base text-gray-700 leading-relaxed pl-7 sm:pl-8 md:pl-10 lg:pl-12">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NeuroSense FAQs Section */}
        <section className="py-8 sm:py-10 md:py-12 lg:py-16 px-3 sm:px-5 md:px-8 lg:px-10 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-5 sm:mb-8 md:mb-10 lg:mb-12">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
                NeuroSense Assessment FAQs
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">
                Everything you need to know about your brain wellness journey
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
              {neurosenseFAQs.map((faq, index) => (
                <div
                  key={index}
                  className={`rounded-lg sm:rounded-xl border overflow-hidden transition-all duration-300 ${
                    openFAQIndex === index
                      ? 'border-[#323956] shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <button
                    onClick={() => toggleNeurosenseFAQ(index)}
                    className={`w-full px-3 sm:px-4 md:px-5 lg:px-6 py-2.5 sm:py-3 md:py-4 lg:py-5 text-left flex items-center justify-between transition-all duration-300 ${
                      openFAQIndex === index ? 'bg-[#323956] text-white' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 min-w-0">
                      <span className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-bold flex-shrink-0 transition-all duration-300 ${
                        openFAQIndex === index
                          ? 'bg-white text-[#323956]'
                          : 'bg-[#323956]/10 text-[#323956]'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-[13px] sm:text-sm md:text-base font-medium leading-snug">
                        {faq.question}
                      </span>
                    </span>
                    <span className={`flex-shrink-0 ml-2 transition-transform duration-300 ${
                      openFAQIndex === index ? 'text-white rotate-180' : 'text-gray-400'
                    }`}>
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    </span>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFAQIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-2.5 sm:py-3 md:py-4 lg:py-5 bg-gray-50 border-t border-gray-100">
                      <p className="text-[12px] sm:text-xs md:text-sm lg:text-base text-gray-700 leading-relaxed pl-7 sm:pl-8 md:pl-10 lg:pl-12">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Get in Touch Section */}
        <section className="py-10 sm:py-14 md:py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center px-3 sm:px-5 md:px-6">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#323956] mb-2 sm:mb-3">Still Have Questions?</h2>
            <p className="text-gray-500 mb-4 sm:mb-5 md:mb-6 text-xs sm:text-sm md:text-base">We'd love to hear from you. Reach out and our team will get back to you shortly.</p>
            <button
              onClick={openProgramForm}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-3.5 bg-gradient-to-r from-[#323956] to-[#4A6FA5] text-white rounded-full font-semibold text-xs sm:text-sm md:text-base hover:shadow-lg hover:shadow-[#323956]/25 transition-all duration-300 hover:scale-105"
            >
              Get in Touch
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
