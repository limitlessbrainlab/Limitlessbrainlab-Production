import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// One-time assessment gate. Buyers receive /assessment/take/<token> instead of
// the raw JotForm URL; this page validates the token server-side and only then
// redirects to (or lists, for bundles) the underlying assessment form(s).
const TakeAssessment = () => {
  const { token } = useParams();
  const [state, setState] = useState({ status: 'loading' });

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
          // Single assessment: hand the user straight to the form
          setTimeout(() => { window.location.href = data.links[0]; }, 1200);
        }
      })
      .catch(() => !cancelled && setState({ status: 'error' }));
    return () => { cancelled = true; };
  }, [token]);

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

  if (state.status === 'loading') {
    return (
      <Card icon={<Clock className="h-8 w-8 text-white" />} title="Checking your assessment link…">
        <div className="flex justify-center py-4">
          <div className="w-8 h-8 border-2 border-[#323956]/30 border-t-[#323956] rounded-full animate-spin" />
        </div>
      </Card>
    );
  }

  if (state.status === 'ok') {
    const links = state.links || [];
    return (
      <Card icon={<CheckCircle className="h-8 w-8 text-white" />} title={state.assessmentName || 'Your Assessment'}>
        {links.length === 1 ? (
          <>
            <p className="text-gray-600 text-sm">Taking you to your assessment…</p>
            <a
              href={links[0]}
              className="inline-block mt-5 px-8 py-3 bg-gradient-to-r from-[#323956] to-[#4a5578] text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              Open Assessment
            </a>
          </>
        ) : (
          <>
            <p className="text-gray-600 text-sm mb-4">Your bundle includes {links.length} assessments — complete each one:</p>
            {links.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full mb-3 px-6 py-3 bg-gradient-to-r from-[#323956] to-[#4a5578] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                <ExternalLink className="h-4 w-4" />
                Assessment {i + 1}
              </a>
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
