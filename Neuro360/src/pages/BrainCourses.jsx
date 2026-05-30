import React, { useState } from 'react';
import {
  GraduationCap,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

const courses = [
  {
    id: 1,
    title: 'Neuro Manifestation - Get Your Dream Life Designed',
    author: 'Dr Sweta Adatia',
    originalPrice: '₹7,999',
    discountedPrice: '₹4,099',
    category: 'manifestation',
    image: '/brain-course/Neuro Color.jpg',
    gradient: 'from-blue-900 via-blue-800 to-indigo-900',
    url: 'https://www.limitlessbrainacademy.com'
  },
  {
    id: 2,
    title: 'NEURO GUT AXIS FOR A SHARP BRAIN AND LONG LIFE',
    author: 'Dr Sweta Adatia',
    originalPrice: '₹4,099',
    discountedPrice: '₹2,999',
    category: 'health',
    gradient: 'from-green-800 via-teal-700 to-green-900',
    url: 'https://www.limitlessbrainacademy.com'
  },
  {
    id: 3,
    title: 'Neuro Memory - Masterclass',
    author: 'Dr Sweta Adatia',
    originalPrice: '₹5,999',
    discountedPrice: '₹2,999',
    category: 'memory',
    image: '/brain-course/Neuro Memory.jpg',
    gradient: 'from-purple-900 via-purple-800 to-indigo-900',
    url: 'https://www.limitlessbrainacademy.com'
  },
  {
    id: 4,
    title: 'Swara Yoga For Daily Life',
    author: 'Dr Sweta Adatia',
    originalPrice: '₹5,999',
    discountedPrice: '₹2,999',
    category: 'yoga',
    image: '/brain-course/Swara Yoga For Daily Life.jpg',
    gradient: 'from-orange-700 via-amber-600 to-yellow-700',
    url: 'https://www.limitlessbrainacademy.com'
  },
  {
    id: 5,
    title: 'Neuro Meditation - Brain Rewiring Through Meditation',
    author: 'Dr Sweta Adatia',
    originalPrice: '₹7,999',
    discountedPrice: '₹4,999',
    category: 'meditation',
    image: '/brain-course/Neuro Meditation - Brain Rewiring Through Meditation.jpg',
    gradient: 'from-violet-900 via-purple-800 to-fuchsia-900',
    url: 'https://www.limitlessbrainacademy.com'
  },
  {
    id: 6,
    title: 'Neuro Gratitude - Power Manifestation Tool With Healer Codes',
    author: 'Limitless Brain Mastery',
    originalPrice: '₹5,999',
    discountedPrice: '₹3,999',
    category: 'manifestation',
    image: '/brain-course/Neuro Gratitude - Power Manifestation Tool With Healer.jpg',
    gradient: 'from-emerald-800 via-green-700 to-teal-800',
    url: 'https://www.limitlessbrainacademy.com'
  },
  {
    id: 7,
    title: 'Neuro Sales - The Art & Science of Selling',
    author: 'Limitless Brain Mastery',
    originalPrice: '₹15,999',
    discountedPrice: '₹8,999',
    category: 'sales',
    gradient: 'from-red-800 via-rose-700 to-red-900',
    url: 'https://www.limitlessbrainacademy.com'
  },
  {
    id: 8,
    title: 'Neuro Parenting In Hindi',
    author: 'Dr Sweta Adatia',
    originalPrice: '₹4,999',
    discountedPrice: '₹2,999',
    category: 'parenting',
    image: '/brain-course/Neuro Parenting In Hindi.jpg',
    gradient: 'from-pink-800 via-rose-700 to-pink-900',
    url: 'https://www.limitlessbrainacademy.com'
  },
  {
    id: 9,
    title: 'Bundled 5 Solfeggio Music Frequencies',
    author: 'Dr Sweta Adatia',
    originalPrice: '₹9,999',
    discountedPrice: '₹6,999',
    category: 'frequencies',
    gradient: 'from-cyan-800 via-blue-700 to-cyan-900',
    url: 'https://www.limitlessbrainacademy.com'
  },
  {
    id: 10,
    title: 'Bundled 5 Meditation Music Frequencies',
    author: 'Dr Sweta Adatia',
    originalPrice: '₹9,999',
    discountedPrice: '₹6,999',
    category: 'frequencies',
    gradient: 'from-indigo-800 via-blue-700 to-indigo-900',
    url: 'https://www.limitlessbrainacademy.com'
  },
  {
    id: 11,
    title: 'Bundled 5 Binaural Beats',
    author: 'Dr Sweta Adatia',
    originalPrice: '₹9,999',
    discountedPrice: '₹6,999',
    category: 'frequencies',
    gradient: 'from-slate-800 via-gray-700 to-slate-900',
    url: 'https://www.limitlessbrainacademy.com'
  },
  {
    id: 12,
    title: 'Neuro Breathing - The Principles of Yogic Breathing',
    author: 'Limitless Brain Mastery',
    originalPrice: '₹5,999',
    discountedPrice: '₹2,999',
    category: 'breathing',
    image: '/brain-course/Neuro Breathing - The Principles of Yogic Breathing.jpg',
    gradient: 'from-teal-800 via-emerald-700 to-green-800',
    url: 'https://www.limitlessbrainacademy.com'
  }
];

const categories = ['All', 'manifestation', 'health', 'memory', 'yoga', 'meditation', 'sales', 'parenting', 'frequencies', 'breathing'];

const BrainCourses = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const filteredCourses = selectedCategory === 'All'
    ? courses
    : courses.filter(c => c.category === selectedCategory);

  const handleCourseClick = () => {
    window.open('https://www.limitlessbrainacademy.com/products#nav_bar', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex items-center space-x-2.5 sm:space-x-3 mb-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-5 w-5 sm:h-7 sm:w-7" />
          </div>
          <div>
            <h1 className="text-base sm:text-2xl font-bold">Brain Courses</h1>
            <p className="text-blue-200 text-[11px] sm:text-sm">Limitless Brain Academy</p>
          </div>
        </div>
        <p className="text-blue-100 text-xs sm:text-sm mt-2 leading-relaxed">
          Explore our curated courses designed to help you understand and optimize your brain health. Each course is backed by neuroscience and practical strategies.
        </p>
      </div>

      {/* Category Filter */}
      <div className="relative inline-block">
        <button
          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Category
          <ChevronDown className="h-4 w-4" />
        </button>
        {showCategoryDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[160px]">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setShowCategoryDropdown(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors capitalize ${
                  selectedCategory === cat ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Course Cards Grid - 4 columns like reference */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-5">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            onClick={() => handleCourseClick(course.url)}
            className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-gray-100"
          >
            {/* Course Thumbnail */}
            <div className={`relative bg-gradient-to-br ${course.gradient} h-28 sm:h-40 flex items-center justify-center overflow-hidden`}>
              {course.image ? (
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`${course.image ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center p-3 sm:p-4 bg-gradient-to-br ${course.gradient}`}>
                <h3 className="text-white font-bold text-center text-[11px] sm:text-sm leading-snug drop-shadow-lg">
                  {course.title}
                </h3>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-2.5 sm:p-3.5">
              <h4 className="text-[11px] sm:text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-1 sm:mb-2">
                {course.title}
              </h4>

              <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5 sm:mb-2.5">
                {course.author}
              </p>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                  {course.originalPrice}
                </span>
                <span className="text-xs sm:text-sm font-bold text-blue-600">
                  {course.discountedPrice}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white text-center">
        <h3 className="text-sm sm:text-lg font-bold mb-1 sm:mb-2">Want to explore all courses?</h3>
        <p className="text-blue-200 text-xs sm:text-sm mb-3 sm:mb-4">Visit Limitless Brain Academy for the complete catalog of brain health courses.</p>
        <button
          onClick={() => handleCourseClick('https://www.limitlessbrainacademy.com')}
          className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-white text-[#323956] px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-100 transition-colors text-xs sm:text-base"
        >
          <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Visit Limitless Brain Academy</span>
          <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
        </button>
      </div>
    </div>
  );
};

export default BrainCourses;
