import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ShoppingCart,
  Filter,
  ChevronDown,
  Pill,
  Star,
  ExternalLink,
  Beaker,
  Shield,
  CheckCircle,
  BarChart3,
  AlertCircle
} from 'lucide-react';

const SupplementCard = ({ supplement, paramColor = 'blue' }) => (
  <div className={`p-4 rounded-xl border border-${paramColor}-200 bg-${paramColor}-50 dark:bg-${paramColor}-900/20`}>
    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{supplement?.name}</h4>
    <p className="text-sm text-gray-600 dark:text-gray-400">{supplement?.description}</p>
  </div>
);

const SupplementsNootropics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState('best_selling');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showEligibilityForm, setShowEligibilityForm] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [eligibilityChecks, setEligibilityChecks] = useState({
    row1: false,
    row2: false,
    row3: false
  });
  const [expandedParameter, setExpandedParameter] = useState(null);
  const lowestParams = [];
  const nootropicsByParameter = {};
  const parameterScores = {};

  const toggleCheck = (key) => {
    setEligibilityChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const checkEligibility = () => {
    if (Object.values(eligibilityChecks).every(v => v)) {
      setIsEligible(true);
      setShowEligibilityForm(false);
      toast.success('Eligibility confirmed! You can now view recommendations.');
    }
  };

  const products = [
    { id: 'sys-detox', name: 'Sys-Detox', price: 299, category: 'detox', description: 'Improved metabolism & better bio-optimization. Long term detoxification support.', color: 'from-gray-100 to-gray-200', image: '/nootropics/sys-detox.webp' },
    { id: 'sleep-revive', name: 'Sleep Revive', price: 1799, category: 'sleep', description: 'L-Theanine, Baikal Skullcap & Lemon Balm Tablets for deep, restorative sleep.', color: 'from-emerald-100 to-teal-200', image: '/nootropics/sleep-revive.webp' },
    { id: 'magneshine-b', name: 'Magneshine-B', price: 1199, category: 'brain', description: 'Magnesium & B-Complex supplement for cognitive function and nervous system support.', color: 'from-orange-100 to-amber-200', image: '/nootropics/magneshine-b.webp' },
    { id: 'calm-sleep-major', name: 'Calm Sleep Major', price: 899, category: 'sleep', description: 'Melatonin tablets for relaxation, stress relief, and improved sleep quality.', color: 'from-blue-100 to-indigo-200', image: '/nootropics/calm-sleep-major.webp' },
    { id: 'aswa-ext', name: 'Aswa Ext', price: 899, category: 'brain', description: 'Ashwagandha Extract Capsules for stress reduction, body optimization and immune support.', color: 'from-pink-200 to-rose-300', image: '/nootropics/aswa-ext.webp' },
    { id: 'hd-liposomal-curcum', name: 'HD Liposomal Curcum', price: 2999, category: 'wellness', description: 'Curcumin Tablets with high-dose liposomal delivery for maximum anti-inflammatory benefits.', color: 'from-amber-100 to-yellow-200', image: '/nootropics/hd-liposomal-curcum.webp' },
    { id: 'vit-d3-k2-plus', name: 'Vit D3 K2 Plus', price: 1399, category: 'wellness', description: 'Liposomal Vitamin D3 & Vitamin K2-7 Capsules for bone health and immune function.', color: 'from-teal-200 to-cyan-300', image: '/nootropics/vit-d3-k2-plus.webp' },
    { id: 'vin-o-neuro', name: 'Vin O Neuro', price: 1999, category: 'brain', description: 'Vinpocetine Capsules for cerebral blood flow, memory enhancement and neuroprotection.', color: 'from-green-200 to-emerald-300', image: '/nootropics/vin-o-neuro.webp' },
    { id: 'tryptoplus', name: 'Tryptoplus', price: 699, category: 'sleep', description: '5-HTP Capsules for serotonin support, mood balance and better sleep quality.', color: 'from-teal-100 to-green-200', image: '/nootropics/tryptoplus.webp' },
    { id: 'probiotics', name: 'Probiotics', price: 1199, category: 'gut', description: 'Probiotics-IGE Probiotic Capsules for gut health and digestive wellness.', color: 'from-rose-200 to-pink-300', image: '/nootropics/probiotics.webp' },
    { id: 'natural-probiotic', name: 'Natural Probiotic', price: 999, category: 'gut', description: 'SynBio Capsules with natural probiotic strains for intestinal flora balance.', color: 'from-amber-200 to-orange-300', image: '/nootropics/natural-probiotic.webp' },
    { id: 'neurobiotic', name: 'Neurobiotic', price: 1599, category: 'brain', description: 'Pro-BG Capsules combining probiotics with neuro-supportive compounds for gut-brain axis.', color: 'from-purple-200 to-violet-300', image: '/nootropics/neurobiotic.webp' },
    { id: 'mb-12', name: 'MB-12', price: 699, category: 'brain', description: 'Methylcobalamin Sublingual Tablets for nerve function, energy and cognitive support.', color: 'from-violet-200 to-purple-300', image: '/nootropics/mb-12.webp' },
    { id: 'lipo-trans-resveratrol', name: 'Lipo Trans Resveratrol', price: 1799, category: 'wellness', description: 'Liposomal Resveratrol Capsules for anti-aging, cardiovascular health and longevity.', color: 'from-green-200 to-teal-300', image: '/nootropics/lipo-trans-resveratrol.webp' },
    { id: 'lipo-colostrum', name: 'Lipo Colostrum', price: 1799, category: 'wellness', description: 'Liposomal Colostrum Powder for immune system support and gut lining repair.', color: 'from-teal-200 to-green-300', image: '/nootropics/lipo-colostrum.webp' },
    { id: 'lipo-co-q10', name: 'Lipo Co Q 10', price: 1999, category: 'wellness', description: 'Liposomal Co Q-10 Capsules for cellular energy production and heart health.', color: 'from-green-100 to-lime-200', image: '/nootropics/lipo-co-q10.webp' },
    { id: 'happy-brain', name: 'Happy Brain', price: 1499, category: 'brain', description: 'St. John\'s Wort, Rhodiola & Lemon Balm for mood elevation, stress relief and mental clarity.', color: 'from-purple-200 to-pink-200', image: '/nootropics/happy-brain.webp' },
    { id: 'gut-revive', name: 'Gut Revive', price: 1399, category: 'gut', description: 'Gut restoration formula for digestive health, nutrient absorption and leaky gut repair.', color: 'from-green-100 to-teal-200', image: '/nootropics/gut-revive.webp' },
    { id: 'gut-restore', name: 'Gut Restore', price: 1199, category: 'gut', description: 'IgG Amino, Marshmallow Root & Slippery Elm Capsules for gut lining restoration and inflammation.', color: 'from-teal-200 to-cyan-200', image: '/nootropics/gut-restore.webp' },
    { id: 'dopa', name: 'Dopa', price: 1199, category: 'brain', description: 'Mucuna Pruriens Capsules for dopamine support, motivation and focus enhancement.', color: 'from-indigo-100 to-blue-200', image: '/nootropics/dopa.webp' },
    { id: 'calm-sleep', name: 'Calm Sleep', price: 699, category: 'sleep', description: 'Melatonin Sublingual Tablets for natural sleep induction and circadian rhythm support.', color: 'from-blue-100 to-sky-200', image: '/nootropics/calm-sleep.webp' },
    { id: 'brain-booster', name: 'Brain Booster', price: 899, category: 'brain', description: 'Huperzine A Capsules for memory enhancement, learning ability and acetylcholine support.', color: 'from-green-200 to-emerald-200', image: '/nootropics/brain-booster.webp' },
  ];

  const categories = [
    { id: 'all', label: 'All Products' },
    { id: 'brain', label: 'Brain Health' },
    { id: 'sleep', label: 'Sleep' },
    { id: 'gut', label: 'Gut Health' },
    { id: 'wellness', label: 'Wellness' },
    { id: 'detox', label: 'Detox' }
  ];

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0; // best_selling — default order
  });

  const handleAddToCart = () => {
    window.open('https://www.limitlessbrainshop.com/collections/ksb-nsb-products', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] text-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <button
            onClick={() => navigate('/dashboard/welcome')}
            className="flex items-center space-x-1.5 text-blue-200 hover:text-white mb-3 transition-colors text-xs sm:text-base"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-start space-x-2.5 sm:space-x-4">
            <div className="bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 flex-shrink-0">
              <Beaker className="h-5 w-5 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-3xl font-bold leading-tight">Nootropics</h1>
              <p className="text-blue-200 text-xs sm:text-base mt-1 leading-relaxed">
                Optional, evidence-informed supplements aligned to your brain wellness results; coach/clinician-supervised; education-only.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Hero Banner — commented out per request
        <div className="relative rounded-2xl overflow-hidden mb-6 sm:mb-8 bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#e9d5ff]">
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between p-6 sm:p-10">
            <div className="text-white mb-4 sm:mb-0">
              <h2 className="text-2xl sm:text-4xl font-bold leading-tight mb-2">
                Restore Immune Balance,<br />Regain Strength.
              </h2>
              <p className="text-purple-200 text-sm sm:text-base">Auto-immune supplements.</p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-40 h-32 sm:w-60 sm:h-44 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Pill className="h-16 w-16 sm:h-24 sm:w-24 text-white/60" />
              </div>
            </div>
          </div>
          Background decorations
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-32 bg-white/5 rounded-full translate-y-1/2"></div>
        </div>
        */}

        {/* Filter & Sort Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          {/* Filter Button & Categories */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
            {filterOpen && categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-[#323956] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort & Count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="best_selling">Best selling</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="name">Name</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">{sortedProducts.length} products</span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {sortedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all group"
            >
              {/* Product Image */}
              <div className={`relative aspect-square bg-gradient-to-br ${product.color} flex items-center justify-center overflow-hidden`}>
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <Pill className="h-16 w-16 sm:h-20 sm:w-20 text-gray-500/30 group-hover:scale-110 transition-transform duration-300" />
                )}
                {/* Badge */}
                {product.badge && (
                  <div className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full">
                    {product.badge}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3 sm:p-4">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1 truncate">
                  {product.name}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 min-h-[28px] sm:min-h-[32px]">
                  {product.description}
                </p>
                <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white mb-3">
                  ₹ {product.price.toLocaleString('en-IN')}.00
                </p>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-gray-900 dark:border-gray-300 rounded-lg text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-300 hover:bg-gray-900 hover:text-white dark:hover:bg-gray-300 dark:hover:text-gray-900 transition-colors"
                >
                  View More
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750 rounded-xl p-5 sm:p-6 border border-purple-200 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <Star className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1">Quality Assurance</h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                All supplements are lab-tested, GMP certified, and formulated by experts. Consult your healthcare provider before starting any new supplement regimen.
              </p>
            </div>
          </div>
        </div>

        {/* Eligibility Form */}
        {showEligibilityForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2.5 sm:space-x-3 mb-4 sm:mb-6">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E4EFFF] dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-[#323956] dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white">Eligibility Checklist</h2>
                <p className="text-[11px] sm:text-sm text-gray-600 dark:text-gray-400">Confirm all criteria before accessing recommendations</p>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {[
                { key: 'row1', label: '18+ · Not pregnant/breastfeeding · No major liver/kidney disease' },
                { key: 'row2', label: 'Disclose meds/supplements/allergies · Agree to monitoring & data use' },
                { key: 'row3', label: 'Clinician/coach oversight required' }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => toggleCheck(item.key)}
                  className={`w-full flex items-center space-x-2.5 sm:space-x-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
                    eligibilityChecks[item.key]
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    eligibilityChecks[item.key]
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300 dark:border-gray-500'
                  }`}>
                    {eligibilityChecks[item.key] && <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />}
                  </div>
                  <span className={`flex-1 text-left font-medium text-xs sm:text-base ${
                    eligibilityChecks[item.key] ? 'text-green-800 dark:text-green-200' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={checkEligibility}
              disabled={!Object.values(eligibilityChecks).every(v => v)}
              className={`w-full mt-4 sm:mt-6 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold transition-all text-xs sm:text-base ${
                Object.values(eligibilityChecks).every(v => v)
                  ? 'bg-[#323956] text-white hover:bg-[#232D3C]'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              Confirm Eligibility & View Recommendations
            </button>
          </div>
        )}

        {/* Main Content - Only shown after eligibility confirmed */}
        {isEligible && (
          <>
            {/* Your Lowest Parameters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Your Focus Areas</h2>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
                Based on your brain wellness results, these are your 2 lowest-scoring parameters with personalized supplement recommendations.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {lowestParams.map((param) => {
                  const Icon = param.icon;
                  const isSelected = expandedParameter === param.key;
                  return (
                    <button
                      key={param.key}
                      onClick={() => setExpandedParameter(param.key)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? `border-${param.color}-500 bg-${param.color}-50 dark:bg-${param.color}-900/20`
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-${param.color}-100 dark:bg-${param.color}-900/30 flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 text-${param.color}-600 dark:text-${param.color}-400`} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">{param.label}</h3>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-500 dark:text-gray-400">Score: {param.score}/100</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                param.score < 40 ? 'bg-red-100 text-red-700' :
                                param.score < 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {param.score < 40 ? 'Low' : param.score < 60 ? 'Moderate' : 'Good'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${
                          isSelected ? 'rotate-180' : ''
                        }`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expanded Parameter Recommendations */}
            {expandedParameter && nootropicsByParameter[expandedParameter] && (
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 border border-gray-200 dark:border-gray-700">
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                    Recommendations for {parameterScores[expandedParameter]?.label}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-base">
                    {nootropicsByParameter[expandedParameter].description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {nootropicsByParameter[expandedParameter].supplements.map((supplement, idx) => (
                    <SupplementCard
                      key={idx}
                      supplement={supplement}
                      paramColor={parameterScores[expandedParameter]?.color || 'blue'}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Parameters Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">All Parameters Overview</h2>
              <div className="space-y-3">
                {Object.keys(parameterScores).length === 0 ? (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 text-center">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="h-6 w-6 text-amber-600" />
                    </div>
                    <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">No assessment data available</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Please complete your brain scan report or contact your clinic to see your parameters.</p>
                  </div>
                ) : (
                  Object.entries(parameterScores).map(([key, param]) => {
                    const Icon = param.icon;
                    // Convert percentage to 1/3, 2/3, 3/3 format
                    const scoreOut3 = param.score <= 33 ? 1 : param.score <= 66 ? 2 : 3;
                    const progressWidth = (scoreOut3 / 3) * 100;
                    return (
                      <div key={key} className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-2">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${param.color}-600 flex-shrink-0`} />
                          <span className="font-medium text-xs sm:text-base text-gray-900 dark:text-white truncate">{param.label}</span>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                          <div className="w-16 sm:w-32 h-1.5 sm:h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${progressWidth}%` }}
                            />
                          </div>
                          <span className="text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-300 w-8 sm:w-12 text-right">
                            {scoreOut3}/3
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Disclaimers */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl sm:rounded-2xl p-3 sm:p-5">
              <div className="flex items-start space-x-2.5 sm:space-x-3">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-red-800 dark:text-red-200">Disclaimers</h3>
                  <ul className="text-red-700 dark:text-red-300 text-xs sm:text-sm mt-1.5 sm:mt-2 space-y-1">
                    <li>• This information is for educational purposes only—not medical advice.</li>
                    <li>• Always consult with a healthcare provider before starting any supplement.</li>
                    <li>• Supplements may interact with medications or existing conditions.</li>
                    <li>• Quality and purity of supplements vary—choose reputable brands.</li>
                    <li>• Individual responses vary—what works for others may not work for you.</li>
                    <li>• Report any adverse effects to your coach/clinician immediately.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Coach Connection CTA */}
            <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div>
                  <h3 className="text-sm sm:text-xl font-bold mb-1 sm:mb-2">Ready to Start?</h3>
                  <p className="text-blue-200 text-xs sm:text-base">
                    Connect with a brain coach to discuss these recommendations and create a personalized protocol.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/dashboard/brain-coach')}
                  className="w-full sm:w-auto sm:self-start px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-[#323956] font-semibold rounded-lg sm:rounded-xl hover:bg-blue-50 transition-colors text-xs sm:text-base"
                >
                  Find a Coach
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SupplementsNootropics;
