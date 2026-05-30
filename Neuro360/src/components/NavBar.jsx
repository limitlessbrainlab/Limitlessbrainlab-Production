import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, Menu, X } from 'lucide-react';
import { useContactForm } from '../context/ContactFormContext';

const NavBar = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openContactForm } = useContactForm();

  return (
    <>
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-3 sm:py-4 px-4 sm:px-6 bg-white/80 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none">
        <div className="max-w-[1400px] mx-auto flex items-center justify-center">
          {/* Desktop Navigation Pill */}
          <div className="hidden lg:flex items-center bg-white/95 backdrop-blur-lg rounded-full shadow-lg px-6 py-3 gap-6 border border-gray-100">
            {/* Logo */}
            <div className="flex items-center justify-center pr-4 border-r border-gray-200 cursor-pointer" onClick={() => navigate('/')}>
              <img
                src="/IBW Logo.png"
                alt="NeuroSense Logo"
                style={{ height: '70px', width: '70px', borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>

            {/* Navigation Links */}
            <Link to="/" className="text-gray-700 hover:text-gray-900 text-base font-semibold transition-colors whitespace-nowrap">
              Home
            </Link>
            <Link to="/lbw-updates" className="text-gray-700 hover:text-gray-900 text-base font-semibold transition-colors whitespace-nowrap">
              How It Works
            </Link>
            <Link to="/lbw" className="text-gray-700 hover:text-gray-900 text-base font-semibold transition-colors whitespace-nowrap">
              Our Program
            </Link>
            <button
              onClick={openContactForm}
              className="px-5 py-2 bg-[#323956] text-white rounded-full text-base font-semibold hover:bg-[#252a45] transition-colors whitespace-nowrap shadow-md"
            >
              Unlock My Brain
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden flex items-center justify-between w-full px-1">
            {/* Logo - Left */}
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <img
                src="/IBW Logo.png"
                alt="NeuroSense Logo"
                className="h-9 w-9 object-contain rounded-full"
              />
            </div>

            {/* Menu Button - Right */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-300"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Dropdown Menu - slides from top */}
          <div className="fixed top-0 left-0 right-0 bg-white z-50 lg:hidden shadow-2xl transform transition-transform duration-300 rounded-b-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center cursor-pointer" onClick={() => { setMobileMenuOpen(false); navigate('/'); }}>
                <img src="/IBW Logo.png" alt="Logo" className="h-9 w-9 object-contain rounded-full" />
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 pb-6">
              {/* Navigation Links */}
              <div className="flex flex-col space-y-1">
                <Link to="/" className="text-gray-900 hover:text-[#323956] hover:bg-gray-50 text-base font-semibold transition-colors py-3 px-3 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  Home
                </Link>
                <Link to="/lbw-updates" className="text-gray-900 hover:text-[#323956] hover:bg-gray-50 text-base font-semibold transition-colors py-3 px-3 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  How It Works
                </Link>
                <Link to="/lbw" className="text-gray-900 hover:text-[#323956] hover:bg-gray-50 text-base font-semibold transition-colors py-3 px-3 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  Our Program
                </Link>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openContactForm();
                }}
                className="mt-5 px-6 py-3 bg-[#323956] text-white rounded-full text-base font-semibold hover:bg-[#252a45] transition-colors text-center shadow-md w-full"
              >
                Unlock My Brain
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default NavBar;
