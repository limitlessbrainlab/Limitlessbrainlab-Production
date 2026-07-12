import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Clock, ExternalLink, ArrowLeft } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// One-time assessment gate. Buyers receive /assessment/take/<token> instead of
// the raw JotForm URL; this page validates the token server-side, embeds the
// form, and — when the embedded JotForm reports submission-completed — spends
// the link immediately so it can never be reused.
const TakeAssessment = () => {
  const { token } = useParams();
  const [state, setState] = useState({ status: 'loading' });
  const [activeLink, setActiveLink] = useState(null); // the embedded form URL
  const [justCompleted, setJustCompleted] = useState(false);
  const [partDone, setPartDone] = useState(false); // bundle: a part was just submitted

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/assessment-link/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setState(data || { status: 'error' });
        if (data?.status === 'ok' && !data.isBundle && data.links?.length === 1) {
          setActiveLink(data.links[0]);
        }
      })
      .catch(() => !cancelled && setState({ status: 'error' }));
    return () => { cancelled = true; };
  }, [token]);

  const markCompleted = useCallback(() => {
    // Bundles must NOT be expired by a single sub-form submission — the buyer
    // still has the remaining parts to take. Return them to the parts list;
    // the bundle link stays valid (consume never grace-expires bundles) until
    // the 30-day expiry or a true completion signal.
    if (state.isBundle) {
      setPartDone(true);
      setActiveLink(null);
      return;
    }
    fetch(`${API_BASE_URL}/assessment-link/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    }).catch(() => {});
    setJustCompleted(true);
    setActiveLink(null);
  }, [token, state.isBundle]);

  // The embedded JotForm posts messages to the parent window; a submission
  // lands on the thank-you screen and emits an event containing
  // "submission-completed". Payload shape varies by form theme, so match
  // loosely on any *.jotform.com message mentioning it.
  useEffect(() => {
    if (!activeLink) return;
    const onMessage = (event) => {
      try {
        if (!/(^|\.)jotform\.com$/.test(new URL(event.origin).hostname)) return;
      } catch {
        return;
      }
      const payload = typeof event.data === 'string' ? event.data : JSON.stringify(event.data || {});
      if (payload.includes('submission-completed') || payload.includes('submissionCompleted') || payload.includes('formSubmitted')) {
        markCompleted();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [activeLink, markCompleted]);

  const Card = ({ icon, title, children }) => (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] px-6 py-6 text-center">
          <div className="w-14 h-14 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-2">
            {icon}
          </div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
        </div>
        <div className="p-6 text-center">{children}</div>
      </div>
    </div>
  );

  // Embedded form view (single assessment, or one part of a bundle)
  if (activeLink && state.status === 'ok') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {state.isBundle && (
              <button onClick={() => setActiveLink(null)} className="text-white/80 hover:text-white" title="Back to bundle">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <p className="text-white text-sm font-semibold truncate">
              {state.assessmentName || 'Your Assessment'} — complete the form below
            </p>
          </div>
          <a
            href={activeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-white/80 hover:text-white text-xs whitespace-nowrap"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
          </a>
        </div>
        <iframe
          src={activeLink}
          title={state.assessmentName || 'Assessment'}
          className="flex-1 w-full border-0"
          allow="camera; microphone; geolocation"
        />
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <Card icon={<Clock className="h-8 w-8 text-white" />} title="Checking your assessment link…">
        <div className="flex justify-center py-4">
          <div className="w-8 h-8 border-2 border-[#323956]/30 border-t-[#323956] rounded-full animate-spin" />
        </div>
      </Card>
    );
  }

  if (justCompleted) {
    return (
      <Card icon={<CheckCircle className="h-8 w-8 text-white" />} title="Assessment completed — thank you!">
        <p className="text-gray-600 text-sm">Your responses have been submitted. Our team will review your results.</p>
        <Link to="/" className="inline-block mt-5 px-8 py-3 bg-gradient-to-r from-[#323956] to-[#4a5578] text-white font-bold rounded-xl hover:shadow-lg transition-all">Back to Home</Link>
      </Card>
    );
  }

  if (state.status === 'ok') {
    const links = state.links || [];
    return (
      <Card icon={<CheckCircle className="h-8 w-8 text-white" />} title={state.assessmentName || 'Your Assessment'}>
        {links.length === 1 ? (
          <>
            <p className="text-gray-600 text-sm">Your assessment is ready.</p>
            <button
              onClick={() => setActiveLink(links[0])}
              className="inline-block mt-5 px-8 py-3 bg-gradient-to-r from-[#323956] to-[#4a5578] text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              Start Assessment
            </button>
          </>
        ) : (
          <>
            {partDone && (
              <p className="text-green-600 text-sm font-semibold mb-2">✓ Part completed — continue with your next assessment.</p>
            )}
            <p className="text-gray-600 text-sm mb-4">Your bundle includes {links.length} assessments — complete each one:</p>
            {links.map((link, i) => (
              <button
                key={i}
                onClick={() => setActiveLink(link)}
                className="flex items-center justify-center gap-2 w-full mb-3 px-6 py-3 bg-gradient-to-r from-[#323956] to-[#4a5578] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                <ExternalLink className="h-4 w-4" />
                Assessment {i + 1}
              </button>
            ))}
          </>
        )}
        <p className="text-gray-400 text-xs mt-4">This link is for one-time use and expires once the assessment is completed.</p>
      </Card>
    );
  }

  if (state.status === 'completed') {
    return (
      <Card icon={<CheckCircle className="h-8 w-8 text-white" />} title="Assessment already completed">
        <p className="text-gray-600 text-sm">
          {state.assessmentName ? <><strong>{state.assessmentName}</strong> has already been completed.</> : 'This assessment has already been completed.'} This link can only be used once.
        </p>
        <p className="text-gray-500 text-sm mt-2">If you believe this is a mistake, contact us at info@limitlessbrainlab.com.</p>
        <Link to="/" className="inline-block mt-5 px-8 py-3 bg-gradient-to-r from-[#323956] to-[#4a5578] text-white font-bold rounded-xl hover:shadow-lg transition-all">Back to Home</Link>
      </Card>
    );
  }

  if (state.status === 'expired') {
    return (
      <Card icon={<Clock className="h-8 w-8 text-white" />} title="Link expired">
        <p className="text-gray-600 text-sm">This assessment link has expired. Contact us at info@limitlessbrainlab.com and we will help you regain access.</p>
        <Link to="/" className="inline-block mt-5 px-8 py-3 bg-gradient-to-r from-[#323956] to-[#4a5578] text-white font-bold rounded-xl hover:shadow-lg transition-all">Back to Home</Link>
      </Card>
    );
  }

  return (
    <Card icon={<AlertCircle className="h-8 w-8 text-white" />} title="Invalid link">
      <p className="text-gray-600 text-sm">This assessment link is not valid. Please use the link from your purchase confirmation email, or contact info@limitlessbrainlab.com.</p>
      <Link to="/" className="inline-block mt-5 px-8 py-3 bg-gradient-to-r from-[#323956] to-[#4a5578] text-white font-bold rounded-xl hover:shadow-lg transition-all">Back to Home</Link>
    </Card>
  );
};

export default TakeAssessment;
