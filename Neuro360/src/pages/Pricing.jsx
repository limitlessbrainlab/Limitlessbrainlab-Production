import React from 'react';
import { Brain, Check, Sparkles, ArrowRight, Star } from 'lucide-react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useContactForm } from '../context/ContactFormContext';

const Pricing = () => {
  const { openContactForm } = useContactForm();

  const bundles = [
    {
      id: 'neurosense-bundle',
      title: 'Neurosense Bundle',
      description: 'All 4 assessments in one package',
      includes: [
        'Neuro Age Estimator',
        'Neuro Performance Score',
        'Brain Burnout Score',
        'Brain Fitness Score'
      ],
      originalPrice: { usd: 89.95 },
      salePrice: { usd: 19.99 },
      popular: true
    },
    {
      id: 'digital-brain-check',
      title: 'Digital Brain Check',
      description: 'Essential brain assessment bundle',
      includes: [
        'Neuro Age Estimator',
        'Brain Burnout Score',
        'Neuro Performance Score'
      ],
      originalPrice: { usd: 30 },
      salePrice: { usd: 19 }
    },
    {
      id: 'digital-platinum-brain-check',
      title: 'Digital Platinum Brain Check',
      description: 'Complete brain health assessment package',
      includes: [
        'Neuro Age Estimator',
        'Brain Fitness Score',
        'Brain Burnout Score',
        'Brain Performance Score',
        'Limitless Brain Lab QEEG',
        'CogniFit Assessment'
      ],
      originalPrice: { usd: 96 },
      salePrice: { usd: 69 }
    },
    {
      id: 'digital-diamond-brain-check',
      title: 'Digital Diamond Brain Check',
      description: 'Ultimate brain assessment package',
      includes: [
        'Neuro Age Estimator',
        'Brain Fitness Score',
        'Brain Burnout Score',
        'Brain Performance Score',
        'Limitless Brain Lab QEEG'
      ],
      originalPrice: { usd: 47 },
      salePrice: { usd: 32 }
    }
  ];

  const services = [
    {
      id: 'neuro-age-estimator',
      title: 'Neuro Age Estimator',
      shortDesc: 'Compare your brain age vs chronological age',
      link: null,
      originalPrice: { usd: 19.99, aed: 73, inr: 1699 },
      salePrice: { usd: 9.99, aed: 37, inr: 849 },
      popular: true
    },
    {
      id: 'brain-performance-score',
      title: 'Neuro Performance Score',
      shortDesc: 'Evaluate clarity, speed & mental stamina',
      link: null,
      originalPrice: { usd: 19.99, aed: 73, inr: 1699 },
      salePrice: { usd: 9.99, aed: 37, inr: 849 }
    },
    {
      id: 'brain-burnout-score',
      title: 'Brain Burnout Score',
      shortDesc: 'Assess stress load & recovery capacity',
      link: null,
      originalPrice: { usd: 19.99, aed: 73, inr: 1699 },
      salePrice: { usd: 9.99, aed: 37, inr: 849 }
    },
    {
      id: 'brain-fitness-advanced',
      title: 'Brain Fitness Score',
      shortDesc: 'Measure focus, resilience & cognitive stamina',
      link: null,
      originalPrice: { usd: 9.99, aed: 37, inr: 849 },
      salePrice: { usd: 2.99, aed: 11, inr: 249 }
    },
    {
      id: 'cognifit-assessment',
      title: 'CogniFit Assessment',
      shortDesc: 'Test attention, memory & processing speed',
      link: null,
      originalPrice: { usd: 99, aed: 364, inr: 8399 },
      salePrice: { usd: 49, aed: 180, inr: 4159 }
    },
    {
      id: 'neurosense-qeeg',
      title: 'Limitless Brain Lab QEEG',
      shortDesc: '22-channel brain mapping assessment',
      link: null,
      originalPrice: { usd: 9.99, aed: 37, inr: 849 },
      salePrice: { usd: 6.99, aed: 26, inr: 594 },
      premium: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Hero Section */}
      <section className="pt-20 pb-8 sm:pt-24 sm:pb-12 bg-white">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#323956]/10 text-[#323956] px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Special Launch Pricing
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#323956] mb-3">
            Brain Assessment Pricing
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-xl mx-auto">
            Science-backed assessments to understand and optimize your brain health
          </p>
        </div>
      </section>

      {/* Bundle Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
          {/* Section Header */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#323956] mb-2">Choose Your Bundle</h2>
            <p className="text-gray-500 text-sm sm:text-base">Save more with our assessment packages</p>
          </div>

          {/* Bundle Cards Grid - 3 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">

            {/* 1st - Digital Brain Check - Starter */}
            <div className="relative bg-white rounded-2xl p-5 sm:p-6 overflow-hidden shadow-xl border-2 border-gray-100 hover:border-[#323956]/30 transform hover:scale-[1.02] transition-all duration-300 flex flex-col">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#323956]/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

              <div className="relative flex flex-col flex-1">
                {/* Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-[#323956]/10 text-[#323956] px-3 py-1 rounded-full text-[9px] font-bold uppercase">
                    Starter
                  </span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[9px] font-semibold">
                    Save 37%
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold text-[#323956] mb-1">Digital Brain Check</h3>
                <p className="text-gray-500 text-xs mb-4">Essential assessment bundle</p>

                {/* Features */}
                <div className="space-y-1.5 mb-5 flex-1">
                  {bundles[0].includes.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#323956] flex-shrink-0" />
                      <span className="text-gray-600 text-xs">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Price & CTA */}
                <div className="pt-4 border-t border-gray-100 mt-auto">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-gray-400 line-through text-sm">${bundles[0].originalPrice.usd}</span>
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#323956]">${bundles[0].salePrice.usd}</span>
                  </div>
                  <button
                    onClick={openContactForm}
                    className="w-full bg-[#323956] hover:bg-[#1a1f36] text-white px-6 py-3 rounded-xl text-sm font-bold transition-all hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2nd - Digital Platinum Brain Check - Best Value */}
            <div className="relative bg-gradient-to-br from-[#323956] via-[#3d4a6e] to-[#1a1f36] rounded-2xl p-5 sm:p-6 text-white shadow-2xl transform hover:scale-[1.02] transition-all duration-300 ring-2 ring-[#F5D05D] flex flex-col mt-4 md:mt-0">
              {/* Popular Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F5D05D] text-[#323956] px-4 py-1 rounded-full text-[10px] font-bold uppercase shadow-lg z-10">
                Most Popular
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#F5D05D]/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

              <div className="relative flex flex-col flex-1 mt-2">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-gradient-to-r from-[#F5D05D] to-[#e5c04d] text-[#323956] px-3 py-1 rounded-full text-[9px] font-bold uppercase">
                    Best Value
                  </span>
                  <span className="bg-white/10 text-white px-2 py-1 rounded-full text-[9px] font-semibold">
                    Save 28%
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold mb-1">Digital Platinum Brain Check</h3>
                <p className="text-white/50 text-xs mb-4">Complete assessment package</p>

                {/* Features */}
                <div className="space-y-1.5 mb-5 flex-1">
                  {bundles[1].includes.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#F5D05D] flex-shrink-0" />
                      <span className="text-white/80 text-xs">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Price & CTA */}
                <div className="pt-4 border-t border-white/10 mt-auto">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-white/40 line-through text-sm">${bundles[1].originalPrice.usd}</span>
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">${bundles[1].salePrice.usd}</span>
                  </div>
                  <button
                    onClick={openContactForm}
                    className="w-full bg-gradient-to-r from-[#F5D05D] to-[#e5c04d] hover:from-[#e5c04d] hover:to-[#d4af3d] text-[#323956] px-6 py-3 rounded-xl text-sm font-bold transition-all hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    Get Platinum
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 3rd - Digital Diamond Brain Check - Ultimate */}
            <div className="relative bg-gradient-to-br from-[#1a1f36] via-[#2a3050] to-[#1a1f36] rounded-2xl p-5 sm:p-6 text-white overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-all duration-300 border border-cyan-500/30 flex flex-col sm:col-span-2 md:col-span-1 sm:max-w-md sm:mx-auto md:max-w-none">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-400/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

              <div className="relative flex flex-col flex-1">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase shadow-lg">
                    Ultimate
                  </span>
                  <span className="bg-white/10 text-white px-2 py-1 rounded-full text-[9px] font-semibold">
                    Save 32%
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold mb-1">Digital Diamond Brain Check</h3>
                <p className="text-white/50 text-xs mb-4">Ultimate assessment package</p>

                {/* Features */}
                <div className="space-y-1.5 mb-5 flex-1">
                  {bundles[2].includes.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span className="text-white/80 text-xs">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Price & CTA */}
                <div className="pt-4 border-t border-white/10 mt-auto">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-white/40 line-through text-sm">${bundles[2].originalPrice.usd}</span>
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">${bundles[2].salePrice.usd}</span>
                  </div>
                  <button
                    onClick={openContactForm}
                    className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    Get Diamond
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Individual Assessments */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#323956] text-center mb-2">
            Individual Assessments
          </h2>
          <p className="text-center text-gray-500 text-sm sm:text-base mb-6 sm:mb-8">
            Choose specific assessments based on your needs
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {services.map((service) => (
              <div
                key={service.id}
                className={`relative bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border flex flex-col ${
                  service.popular ? 'border-[#F5D05D] ring-1 ring-[#F5D05D]/30 mt-1' : service.premium ? 'border-gray-100 mt-1' : 'border-gray-100'
                }`}
              >
                {/* Badges */}
                {service.popular && (
                  <div className="absolute -top-2 left-4 bg-[#F5D05D] text-[#323956] px-2 py-0.5 rounded-full text-[9px] font-bold uppercase flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Popular
                  </div>
                )}
                {service.premium && (
                  <div className="absolute -top-2 left-4 bg-[#323956] text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                    Premium
                  </div>
                )}

                {/* Content */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-[#323956]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-[#323956]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 mb-0.5">
                      {service.title}
                    </h3>
                    <p className="text-xs text-gray-500 min-h-[32px]">
                      {service.shortDesc}
                    </p>
                  </div>
                </div>

                {/* Pricing */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-gray-400 line-through text-xs">${service.originalPrice.usd}</span>
                      <span className="text-lg font-bold text-[#323956]">${service.salePrice.usd}</span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      AED {service.salePrice.aed} | INR {service.salePrice.inr}
                    </div>
                  </div>

                  {service.link ? (
                    <a
                      href={service.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#323956] hover:bg-[#1a1f36] text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      Start
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  ) : (
                    <button
                      onClick={openContactForm}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                    >
                      Enquire
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-white border-t">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8 text-center">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#323956] mb-2">
            Need Help Choosing?
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-5">
            Book a free discovery call to find the right assessment for you
          </p>
          <button
            onClick={openContactForm}
            className="inline-flex items-center gap-2 bg-[#323956] hover:bg-[#1a1f36] text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-lg text-sm sm:text-base font-semibold transition-all hover:scale-105"
          >
            Book Discovery Call
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
