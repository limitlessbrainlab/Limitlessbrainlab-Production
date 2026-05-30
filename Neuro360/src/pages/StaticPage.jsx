import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabaseClient';

const StaticPage = () => {
  const { slug: paramSlug } = useParams();
  const location = useLocation();
  // Support both /page/:slug and direct routes like /privacy-policy
  const slug = paramSlug || location.pathname.replace('/', '');
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetchPage = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching static page:', error);
        setPage(null);
      } else {
        setPage(data);
      }

      setLoading(false);
    };

    fetchPage();
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <div className="pt-20 pb-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#323956] mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Not found state
  if (!page) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <div className="pt-20 pb-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
            <p className="text-gray-500">The requested page could not be found.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Page content
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <div className="pt-36 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page title */}
          <div className="flex items-center gap-4 mb-8">
            <img src="/IBW Logo.png" alt="LBL Logo" className="h-14 w-14 rounded-full object-cover flex-shrink-0" />
            <h1 className="text-3xl sm:text-4xl font-bold text-[#323956]">{page.title}</h1>
          </div>

          {/* Last updated date */}
          <p className="text-sm text-gray-400 mb-8">
            Last updated: {new Date(page.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {/* Content rendered as HTML */}
          <div
            className="prose prose-lg max-w-none prose-headings:text-[#323956] prose-a:text-[#4A6FA5]"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StaticPage;
