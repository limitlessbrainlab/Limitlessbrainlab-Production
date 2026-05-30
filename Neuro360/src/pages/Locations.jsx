import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useContactForm } from '../context/ContactFormContext';
import LocationService from '../services/locationService';

const Locations = () => {
  const navigate = useNavigate();
  const { openContactForm } = useContactForm();
  const [visibleSections, setVisibleSections] = useState(new Set());
  const observerRefs = useRef([]);

  useEffect(() => {
    const scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-scroll-section');
            if (sectionId) {
              setVisibleSections((prev) => new Set([...prev, sectionId]));
              entry.target.classList.add('animate-in');
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

  // Fallback locations used when DB fetch fails
  const DEFAULT_PAGE_LOCATIONS = [
    {
      id: 1,
      name: "SURAT, INDIA",
      description: "We are available in HOLISTICA WORLD at Surat City, Gujarat.",
      image: "https://wqykofpjpaytjuqsessf.supabase.co/storage/v1/object/public/site-images/locations/surat-city.jpg",
      imagePosition: "left",
      comingSoon: false
    },
    {
      id: 2,
      name: "LONDON & NETHERLANDS",
      description: "Through Our Partners Neurobics.care",
      image: "https://wqykofpjpaytjuqsessf.supabase.co/storage/v1/object/public/site-images/locations/london-city.jpg",
      imagePosition: "right",
      comingSoon: false
    },
    {
      id: 3,
      name: "AHMEDABAD",
      description: "Limitless Brain Lab services available at our Ahmedabad center for comprehensive brain wellness assessments.",
      image: "https://wqykofpjpaytjuqsessf.supabase.co/storage/v1/object/public/site-images/locations/ahmedabad-city.jpg",
      imagePosition: "left",
      comingSoon: false
    },
    {
      id: 4,
      name: "MUMBAI",
      description: "Experience Limitless Brain Lab assessment services at our Mumbai location.",
      image: "https://wqykofpjpaytjuqsessf.supabase.co/storage/v1/object/public/site-images/locations/mumbai-city.jpg",
      imagePosition: "right",
      comingSoon: false
    },
    {
      id: 5,
      name: "HYDERABAD",
      description: "Limitless Brain Lab brain wellness services expanding to Hyderabad soon.",
      image: "https://wqykofpjpaytjuqsessf.supabase.co/storage/v1/object/public/site-images/locations/hyderabad-city.jpg",
      imagePosition: "left",
      comingSoon: true
    },
    {
      id: 6,
      name: "BANGALORE",
      description: "Limitless Brain Lab assessment services coming to Bangalore.",
      image: "https://wqykofpjpaytjuqsessf.supabase.co/storage/v1/object/public/site-images/locations/bangalore-city.jpeg",
      imagePosition: "right",
      comingSoon: true
    }
  ];

  const [locations, setLocations] = useState(DEFAULT_PAGE_LOCATIONS);
  const [locationsLoading, setLocationsLoading] = useState(true);

  // Fetch clinic locations from Supabase on mount
  useEffect(() => {
    const fetchLocations = async () => {
      setLocationsLoading(true);
      try {
        const data = await LocationService.getClinicLocations();
        if (data && data.length > 0) {
          // Map DB rows to the format expected by this page's UI
          const mapped = data.map((dbLoc, index) => ({
            id: dbLoc.id,
            name: (dbLoc.title || dbLoc.name || '').toUpperCase(),
            description: dbLoc.description || '',
            image: dbLoc.image_url || '',
            imagePosition: index % 2 === 0 ? 'left' : 'right',
            comingSoon: dbLoc.status === 'comingSoon'
          }));
          setLocations(mapped);
        } else {
          setLocations(DEFAULT_PAGE_LOCATIONS);
        }
      } catch (error) {
        console.warn('Locations page: Using fallback locations:', error);
        setLocations(DEFAULT_PAGE_LOCATIONS);
      } finally {
        setLocationsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <style>{`
        .scroll-fade-up {
          opacity: 0;
          transform: translateY(60px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .scroll-fade-up.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        .scroll-fade-left {
          opacity: 0;
          transform: translateX(-100px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .scroll-fade-left.animate-in {
          opacity: 1;
          transform: translateX(0);
        }

        .scroll-fade-right {
          opacity: 0;
          transform: translateX(100px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .scroll-fade-right.animate-in {
          opacity: 1;
          transform: translateX(0);
        }

        .location-card {
          transition: all 0.3s ease;
        }

        .location-card:hover {
          transform: translateY(-5px);
        }
      `}</style>

      {/* Main Content */}
      <div className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16 scroll-fade-up" data-scroll-section="header">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#323956] mb-2 sm:mb-3 md:mb-4">
              Our Locations
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto px-2 sm:px-4">
              Limitless Brain Lab With A Detailed Evaluation Of Brain Parameters Is Now Available In Multiple Locations
            </p>
          </div>

          {/* Locations List */}
          {locationsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="w-10 h-10 animate-spin text-[#323956]/40 mb-4" />
              <p className="text-gray-500 text-base">Loading locations...</p>
            </div>
          ) : (
          <div className="space-y-10 sm:space-y-14 md:space-y-20">
            {locations.map((location, index) => (
              <div
                key={location.id}
                className={`scroll-fade-${location.imagePosition === 'left' ? 'left' : 'right'}`}
                data-scroll-section={`location-${location.id}`}
              >
                <div className={`flex flex-col ${location.imagePosition === 'left' ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-4 sm:gap-6 md:gap-8 lg:gap-16`}>
                  {/* Image */}
                  <div className="w-full md:w-1/2">
                    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl location-card">
                      <img
                        src={location.image}
                        alt={location.name}
                        className="w-full h-[200px] sm:h-[280px] md:h-[350px] lg:h-[400px] object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80`;
                        }}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`w-full md:w-1/2 text-center md:text-left ${location.imagePosition === 'left' ? 'md:pl-4 lg:pl-8' : 'md:pr-4 lg:pr-8'}`}>
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#323956] mb-2 sm:mb-3 md:mb-4">
                      {location.name}
                    </h2>
                    <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 px-2 sm:px-0">
                      {location.description}
                    </p>
                    {location.comingSoon ? (
                      <span className="inline-flex items-center px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 border-2 border-gray-400 text-gray-500 text-sm sm:text-base font-semibold rounded-lg">
                        COMING SOON
                      </span>
                    ) : (
                      <button
                        onClick={openContactForm}
                        className="inline-flex items-center px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 border-2 border-[#323956] text-[#323956] text-sm sm:text-base font-semibold rounded-lg hover:bg-[#323956] hover:text-white transition-all duration-300"
                      >
                        INQUIRE NOW
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* CTA Section */}
          <div className="mt-10 sm:mt-14 md:mt-20 text-center scroll-fade-up" data-scroll-section="cta">
            <div className="bg-gray-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#323956] mb-2 sm:mb-3 md:mb-4">
                Can't Find A Location Near You?
              </h2>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto px-2 sm:px-4">
                Contact us to learn about our remote assessment options or to request Limitless Brain Lab services in your area.
              </p>
              <button
                onClick={openContactForm}
                className="inline-flex items-center justify-center px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-4 bg-[#323956] hover:bg-[#252a42] text-white text-sm sm:text-base md:text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Contact Us
                <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Locations;
