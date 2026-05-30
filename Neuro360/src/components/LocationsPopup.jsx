import React, { useState, useEffect } from 'react';
import { X, MapPin, Sparkles, Phone, RefreshCw } from 'lucide-react';
import { useContactForm } from '../context/ContactFormContext';
import LocationService from '../services/locationService';

// Fallback locations used when DB fetch fails
const WHATSAPP_NUMBER = '+919769696534';
const WHATSAPP_LINK = `https://wa.me/919769696534`;

const DEFAULT_CLINIC_LOCATIONS = [
  {
    id: 1,
    name: "Bangalore",
    description: "NeuroSense brain wellness services available in Bangalore.",
    address: "Bangalore, Karnataka",
    phone: WHATSAPP_NUMBER,
    image: "https://wqykofpjpaytjuqsessf.supabase.co/storage/v1/object/public/site-images/locations/bangalore-city.jpeg",
    comingSoon: false
  },
  {
    id: 2,
    name: "Pune",
    description: "NeuroSense brain wellness services available in Pune.",
    address: "Pune, Maharashtra",
    phone: WHATSAPP_NUMBER,
    image: "https://images.unsplash.com/photo-1572782252655-9c8771392601?w=800&q=80",
    comingSoon: false
  },
  {
    id: 3,
    name: "Ahmedabad",
    description: "NeuroSense brain wellness services available in Ahmedabad.",
    address: "Ahmedabad, Gujarat",
    phone: WHATSAPP_NUMBER,
    image: "https://wqykofpjpaytjuqsessf.supabase.co/storage/v1/object/public/site-images/locations/ahmedabad-city.jpg",
    comingSoon: false
  },
  {
    id: 4,
    name: "Surat",
    description: "NeuroSense brain wellness services available in Surat.",
    address: "Surat, Gujarat",
    phone: WHATSAPP_NUMBER,
    image: "https://wqykofpjpaytjuqsessf.supabase.co/storage/v1/object/public/site-images/locations/surat-city.jpg",
    comingSoon: false
  },
  {
    id: 5,
    name: "Mumbai",
    description: "NeuroSense brain wellness services available in Mumbai.",
    address: "Mumbai, Maharashtra",
    phone: WHATSAPP_NUMBER,
    image: "https://wqykofpjpaytjuqsessf.supabase.co/storage/v1/object/public/site-images/locations/mumbai-city.jpg",
    comingSoon: false
  },
  {
    id: 6,
    name: "Delhi",
    description: "NeuroSense brain wellness services available in Delhi.",
    address: "Delhi, India",
    phone: WHATSAPP_NUMBER,
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80",
    comingSoon: false
  },
  {
    id: 7,
    name: "Hyderabad",
    description: "NeuroSense brain wellness services available in Hyderabad.",
    address: "Hyderabad, Telangana",
    phone: WHATSAPP_NUMBER,
    image: "https://wqykofpjpaytjuqsessf.supabase.co/storage/v1/object/public/site-images/locations/hyderabad-city.jpg",
    comingSoon: false
  },
  {
    id: 8,
    name: "Ludhiana",
    description: "NeuroSense brain wellness services available in Ludhiana.",
    address: "Ludhiana, Punjab",
    phone: WHATSAPP_NUMBER,
    image: "https://images.unsplash.com/photo-1609766856923-7e0a6e3e0e19?w=800&q=80",
    comingSoon: false
  },
  {
    id: 9,
    name: "Chandigarh",
    description: "NeuroSense brain wellness services available in Chandigarh.",
    address: "Chandigarh, India",
    phone: WHATSAPP_NUMBER,
    image: "https://images.unsplash.com/photo-1590766940554-634b4379de7e?w=800&q=80",
    comingSoon: false
  },
  {
    id: 10,
    name: "Amritsar",
    description: "NeuroSense brain wellness services available in Amritsar.",
    address: "Amritsar, Punjab",
    phone: WHATSAPP_NUMBER,
    image: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=800&q=80",
    comingSoon: false
  },
  {
    id: 11,
    name: "Jalandhar",
    description: "NeuroSense brain wellness services available in Jalandhar.",
    address: "Jalandhar, Punjab",
    phone: WHATSAPP_NUMBER,
    image: "https://images.unsplash.com/photo-1609766856923-7e0a6e3e0e19?w=800&q=80",
    comingSoon: false
  }
];

/**
 * Maps a clinic_locations DB row to the format expected by the popup UI.
 */
const mapDbLocationToCard = (dbLoc) => ({
  id: dbLoc.id,
  name: dbLoc.title || dbLoc.name,
  description: dbLoc.description || '',
  address: dbLoc.address || '',
  phone: dbLoc.phone || '',
  image: dbLoc.image_url || '',
  comingSoon: dbLoc.status === 'comingSoon'
});

const LocationsPopup = ({ isOpen, onClose }) => {
  const { openContactForm } = useContactForm();
  const [locations, setLocations] = useState(DEFAULT_CLINIC_LOCATIONS);
  const [loading, setLoading] = useState(false);

  // Fetch clinic locations from Supabase when popup opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchLocations = async () => {
      setLoading(true);
      try {
        const data = await LocationService.getClinicLocations();
        if (data && data.length > 0) {
          setLocations(data.map(mapDbLocationToCard));
        } else {
          // Fallback to hardcoded defaults if DB returns empty or null
          setLocations(DEFAULT_CLINIC_LOCATIONS);
        }
      } catch (error) {
        console.warn('LocationsPopup: Using fallback locations:', error);
        setLocations(DEFAULT_CLINIC_LOCATIONS);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [isOpen]);

  const handleInquire = () => {
    onClose();
    openContactForm();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-2 xs:p-3 sm:p-4 backdrop-blur-md"
      style={{ animation: 'fadeIn 0.3s ease-out' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[95%] xs:max-w-[90%] sm:max-w-[600px] md:max-w-[800px] lg:max-w-[900px] max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
        style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#323956] via-[#3d4566] to-[#1a1f36] px-4 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8 overflow-hidden">
          {/* Decorative elements */}
          <div className="hidden sm:block absolute top-0 right-0 w-32 md:w-40 h-32 md:h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="hidden sm:block absolute bottom-0 left-0 w-24 md:w-32 h-24 md:h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1.5 sm:p-2 transition-all duration-200"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="relative flex items-center gap-3 sm:gap-4 md:gap-5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/15 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
              <MapPin className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight">Our Locations</h2>
              <p className="text-gray-300/90 text-xs sm:text-sm mt-0.5 sm:mt-1 flex items-center gap-1.5 sm:gap-2">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                Find Limitless Brain Wellness center near you
              </p>
            </div>
          </div>
        </div>

        {/* Locations Grid */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-200px)] bg-gradient-to-b from-gray-50/80 to-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-[#323956]/50 mb-3" />
              <p className="text-gray-500 text-sm">Loading locations...</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            {locations.map((location) => (
              <div
                key={location.id}
                className="bg-white rounded-xl sm:rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#323956]/20 transition-all duration-300 hover:-translate-y-1 group"
              >
                {/* Location Image */}
                <div className="relative h-32 sm:h-36 md:h-40 overflow-hidden">
                  <img
                    src={location.image}
                    alt={location.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80`;
                    }}
                  />
                  {location.comingSoon && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow-lg">
                      Coming Soon
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Location Details */}
                <div className="p-3 sm:p-4 md:p-5">
                  <h3 className="text-base sm:text-lg font-bold text-[#323956] mb-1.5 sm:mb-2">{location.name}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2 leading-relaxed">{location.description}</p>
                  <p className="text-gray-500 text-[10px] sm:text-xs mb-1 flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-[#323956]" />
                    {location.address}
                  </p>
                  <p className="text-gray-500 text-[10px] sm:text-xs mb-3 sm:mb-4 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 flex-shrink-0 text-[#323956]" />
                    <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition-colors">{location.phone} (WhatsApp)</a>
                  </p>

                  {location.comingSoon ? (
                    <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-200 text-gray-400 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl">
                      Coming Soon
                    </span>
                  ) : (
                    <button
                      onClick={handleInquire}
                      className="inline-flex items-center px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 border-2 border-[#323956] text-[#323956] text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:bg-[#323956] hover:text-white transition-all duration-300 group/btn"
                    >
                      Enquire Now
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-center text-xs sm:text-sm text-gray-600">
            Can't find a location near you?{' '}
            <button
              onClick={handleInquire}
              className="text-[#323956] font-semibold hover:underline"
            >
              Contact us
            </button>{' '}
            for remote assessment options.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default LocationsPopup;
