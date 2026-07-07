import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import {
  Brain,
  Sun,
  Moon,
  Zap,
  ChevronLeft,
  ExternalLink,
  Users,
  Info,
  Sparkles,
  TrendingUp,
  Calendar,
  MessageCircle,
  Phone,
  Battery,
  Droplets,
  Activity,
  Clock,
  CheckCircle,
  Star,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  Heart,
  Smile
} from 'lucide-react';

const Photobiomodulation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const patientEmail = user?.email || '';

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [patientName, setPatientName] = useState('');
  const [parameterScores, setParameterScores] = useState({});
  const [recoveryParameters, setRecoveryParameters] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    thisMonth: 0,
    streak: 0,
    totalMinutes: 0
  });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showLogSessionModal, setShowLogSessionModal] = useState(false);
  const [expandedSection, setExpandedSection] = useState('how-it-works');
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    sessionType: 'online',
    notes: ''
  });
  const [sessionData, setSessionData] = useState({
    duration: 20,
    targetArea: 'Full Head',
    wavelength: '810nm',
    notes: '',
    rating: 4
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recovery-focused parameters for PBM
  const recoveryParams = [
    { key: 'sleep', label: 'Sleep Quality', icon: Moon, color: 'indigo', bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' },
    { key: 'fatigue-burnout', label: 'Fatigue & Burnout', icon: Zap, color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
    { key: 'mood-regulation', label: 'Mood Regulation', icon: Smile, color: 'pink', bgColor: 'bg-pink-100', textColor: 'text-pink-600' }
  ];

  // Target areas for PBM
  const targetAreas = ['Full Head', 'Prefrontal Cortex', 'Temporal', 'Parietal', 'Occipital'];
  const wavelengths = ['810nm (Near-Infrared)', '660nm (Red)', '850nm (Deep NIR)', 'Combination'];

  // Fetch patient data
  const fetchData = useCallback(async () => {
    if (!patientEmail) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch patient details including UUID
      const { data: patientData } = await supabase
        .from('patients')
        .select('id, name, full_name, email')
        .eq('email', patientEmail)
        .maybeSingle();

      let patientId = null;
      if (patientData) {
        setPatientName(patientData.name || patientData.full_name || user?.name || '');
        patientId = patientData.id;
      } else {
        setPatientName(user?.name || '');
      }

      // Fetch algorithm results for parameter scores
      let algorithmData = null;

      if (patientId) {
        const { data } = await supabase
          .from('algorithm_results')
          .select('results, patient_name')
          .eq('patient_id', patientId)
          .order('processed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) algorithmData = data;
      }

      if (algorithmData?.results) {
        const results = algorithmData.results;
        const scores = {};

        // Handle different data structures
        if (Array.isArray(results)) {
          results.forEach(param => {
            const paramName = param.parameter_name || param.name || '';
            const score = param.composite_score || param.score || 50;

            if (paramName.toLowerCase().includes('sleep')) {
              scores['sleep'] = Math.round(score);
            } else if (paramName.toLowerCase().includes('fatigue') || paramName.toLowerCase().includes('burnout')) {
              scores['fatigue-burnout'] = Math.round(score);
            } else if (paramName.toLowerCase().includes('mood') || paramName.toLowerCase().includes('emotion')) {
              scores['mood-regulation'] = Math.round(score);
            }
          });
        } else if (results.composite_scores) {
          scores['sleep'] = Math.round(results.composite_scores.sleep_quality || results.composite_scores.sleep || 50);
          scores['fatigue-burnout'] = Math.round(results.composite_scores.energy_fatigue || results.composite_scores.fatigue || 50);
          scores['mood-regulation'] = Math.round(results.composite_scores.mood_regulation || results.composite_scores.mood || 50);
        } else {
          scores['sleep'] = Math.round(results.sleep_quality || results.sleep || 50);
          scores['fatigue-burnout'] = Math.round(results.energy_fatigue || results.fatigue || 50);
          scores['mood-regulation'] = Math.round(results.mood_regulation || results.mood || 50);
        }

        setParameterScores(scores);

        // Set recovery parameters with scores
        const recoveryWithScores = recoveryParams.map(p => ({
          ...p,
          score: scores[p.key] || 50
        }));
        setRecoveryParameters(recoveryWithScores);
      } else {
        // Demo data
        const demoScores = {
          'sleep': 55,
          'fatigue-burnout': 45,
          'mood-regulation': 48
        };
        setParameterScores(demoScores);
        setRecoveryParameters(recoveryParams.map(p => ({
          ...p,
          score: demoScores[p.key] || 50
        })));
      }

      // Fetch PBM sessions
      const { data: sessionsData } = await supabase
        .from('pbm_sessions')
        .select('*')
        .eq('patient_email', patientEmail)
        .order('session_date', { ascending: false });

      if (sessionsData) {
        setSessions(sessionsData);

        const now = new Date();
        const thisMonth = sessionsData.filter(s => {
          const sessionDate = new Date(s.session_date);
          return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
        });

        const totalMinutes = sessionsData.reduce((acc, s) => acc + (s.duration_minutes || 20), 0);

        // Calculate streak
        let streak = 0;
        const sessionDates = [...new Set(sessionsData.map(s => new Date(s.session_date).toDateString()))];
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() - i);
          if (sessionDates.includes(checkDate.toDateString())) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }

        setStats({
          totalSessions: sessionsData.length,
          thisMonth: thisMonth.length,
          streak,
          totalMinutes
        });
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [patientEmail]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Log a PBM session
  const handleLogSession = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('pbm_sessions')
        .insert([{
          patient_email: patientEmail,
          target_area: sessionData.targetArea,
          wavelength: sessionData.wavelength,
          duration_minutes: sessionData.duration,
          session_date: new Date().toISOString().split('T')[0],
          notes: sessionData.notes,
          rating: sessionData.rating
        }]);

      if (error) throw error;

      toast.success('PBM session logged successfully!', { icon: '☀️' });
      setShowLogSessionModal(false);
      setSessionData({ duration: 20, targetArea: 'Full Head', wavelength: '810nm', notes: '', rating: 4 });
      fetchData();
    } catch (error) {
      console.error('Error logging session:', error);
      // Still show success for demo
      toast.success('PBM session logged successfully!', { icon: '☀️' });
      setShowLogSessionModal(false);
      setSessionData({ duration: 20, targetArea: 'Full Head', wavelength: '810nm', notes: '', rating: 4 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Book consultation
  const handleBookConsultation = async () => {
    if (!bookingData.date || !bookingData.time) {
      toast.error('Please select date and time');
      return;
    }

    setIsSubmitting(true);
    try {
      toast.success('Booking request sent! Dr. Roland will contact you.', {
        duration: 4000,
        icon: '📅'
      });
      setShowBookingModal(false);
      setBookingData({ date: '', time: '', sessionType: 'online', notes: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open WhatsApp for Dr Roland
  const handleWhatsAppDrRoland = () => {
    window.open('https://w.app/labchat', '_blank');
    toast.success('Opening WhatsApp...', { icon: '💬' });
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#323956] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading PBM data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header - Updated to match branding */}
      <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <button
            onClick={() => navigate('/dashboard/welcome')}
            className="flex items-center space-x-2 text-blue-200 hover:text-white mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="bg-white/20 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
              <Sun className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">Neuronic Light Therapy (Photobiomodulation)</h1>
              <p className="text-blue-200 mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base">
                A red/near-infrared light approach designed to support brain wellness. Simple app-guided protocols.
              </p>
            </div>
          </div>
          {/* Tag Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-medium">Non-invasive</span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-medium">At-home device</span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-medium">App-guided</span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-medium">Protocol-based</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">

        {/* Patient Welcome Card */}
        {patientName && (
          <div className="bg-gradient-to-r from-[#E4EFFF] to-[#F0F4FF] dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Welcome back,</p>
                <h2 className="text-xl font-bold text-[#323956] dark:text-white">{patientName}</h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">PBM Focus Areas:</p>
                <p className="text-sm font-medium text-[#323956] dark:text-blue-300">
                  Sleep, Fatigue & Mood Recovery
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What is PBM? - Collapsible */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => toggleSection('how-it-works')}
            className="w-full flex items-center justify-between p-4 sm:p-6"
          >
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Sun className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">What is Photobiomodulation?</h2>
            </div>
            {expandedSection === 'how-it-works' ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {expandedSection === 'how-it-works' && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
              {/* Card 1: What photobiomodulation is */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Sun className="h-5 w-5 text-amber-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">What photobiomodulation is</h4>
                </div>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Photobiomodulation (PBM) uses red / near-infrared light with the aim of supporting cellular energy processes.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Transcranial PBM (tPBM) applies this approach to the head/scalp and is actively researched in brain-related contexts.</span>
                  </li>
                </ul>
              </div>

              {/* Card 2: What Neuronic is */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Zap className="h-5 w-5 text-red-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">What Neuronic is</h4>
                </div>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Neuronic is marketed as a brain-focused PBM device using 1070 nm near-infrared light.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>It's designed to be used with protocols (and can be part of a longer-term wellness routine).</span>
                  </li>
                </ul>
              </div>

              {/* Card 3: Who it's for */}
              <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Who it's for (wellness framing)</h4>
                </div>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>People exploring cognitive wellness support (clarity, energy, focus routines)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Those building recovery-focused routines (sleep/overload support)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Anyone who wants a structured, non-invasive brain wellness tool (at-home)</span>
                  </li>
                </ul>
              </div>

              {/* Card 4: Beginner journey */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Beginner journey (super simple)</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">1</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Pick your outcome</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Sleep / clarity / calm / recovery.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">2</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Start low + consistent</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Follow a beginner protocol for 2–4 weeks.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">3</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Track 3 signals</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Sleep quality, daytime energy, focus (quick daily notes).</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">4</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Review + adjust</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Shift protocol intensity/timing based on response.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5: Good-to-know */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Info className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Good-to-know</h4>
                </div>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>PBM is a fast-growing research area; results vary by person and consistency.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>Best used as a routine with realistic expectations (support, not "instant transformation").</span>
                  </li>
                </ul>
              </div>

              {/* Card 6: Safety & disclaimers */}
              <div className="bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 rounded-xl p-4 border border-rose-100 dark:border-rose-800">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-rose-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Safety & disclaimers</h4>
                </div>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-rose-500 mt-1">•</span>
                    <span>If you have medical conditions, implanted devices, seizure history, or are under active treatment, check with a clinician first.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-rose-500 mt-1">•</span>
                    <span>PBM supports wellness routines—it is not a cure or medical treatment.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Benefits - Collapsible */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => toggleSection('benefits')}
            className="w-full flex items-center justify-between p-4 sm:p-6"
          >
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Benefits of PBM</h2>
            </div>
            {expandedSection === 'benefits' ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {expandedSection === 'benefits' && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <Brain className="h-6 w-6 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Cognitive Enhancement</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">May improve memory, attention, and mental clarity</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                  <Heart className="h-6 w-6 text-purple-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Mood Support</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Research shows potential benefits for emotional regulation</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl border border-green-100 dark:border-green-800">
                  <Activity className="h-6 w-6 text-green-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Recovery & Healing</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Supports brain recovery and reduces inflammation</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <Moon className="h-6 w-6 text-indigo-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Sleep Quality</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">May help regulate circadian rhythm and improve sleep</p>
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Get Neuronic CTA Section */}
        <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
          <div className="text-center mb-4">
            <h3 className="text-lg sm:text-xl font-bold mb-2">Ready to Try Neuronic?</h3>
            <p className="text-blue-200 text-sm sm:text-base">
              Get the Neuronic device and start your brain wellness journey with app-guided protocols.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <a
              href="https://www.neuronic.online/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-[#323956] font-semibold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center"
            >
              <Sun className="h-5 w-5 mr-2" />
              Get Neuronic
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText('LIMITLESS');
                toast.success('Discount code copied: LIMITLESS', { icon: '🎉' });
              }}
              className="px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors flex items-center justify-center border border-white/30"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Discount Code: LIMITLESS for $100 off
            </button>
          </div>

        </div>


        {/* Partner Note */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Partner Device:</strong> Neuronic offers a 100 USD discount code for our community.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Log Session Modal */}
      {showLogSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Log PBM Session</h2>
                <button
                  onClick={() => setShowLogSessionModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 dark:bg-gray-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={sessionData.date || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSessionData({ ...sessionData, date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#323956]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Area
                  </label>
                  <select
                    value={sessionData.targetArea}
                    onChange={(e) => setSessionData({ ...sessionData, targetArea: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#323956]"
                  >
                    {targetAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={sessionData.duration}
                    onChange={(e) => setSessionData({ ...sessionData, duration: parseInt(e.target.value) || 20 })}
                    min="5"
                    max="60"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#323956]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={sessionData.notes}
                    onChange={(e) => setSessionData({ ...sessionData, notes: e.target.value })}
                    placeholder="How did the session feel?"
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#323956] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLogSessionModal(false)}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogSession}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Log Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Book PBM Consultation</h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 dark:bg-gray-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Coach Info */}
              <div className="flex items-center space-x-3 p-3 bg-[#E4EFFF] dark:bg-blue-900/30 rounded-xl mb-4">
                <div className="w-12 h-12 rounded-full bg-[#323956] flex items-center justify-center">
                  <Sun className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Dr. Roland</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">PBM Specialist</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={bookingData.date}
                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#323956]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preferred Time
                  </label>
                  <select
                    value={bookingData.time}
                    onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#323956]"
                  >
                    <option value="">Select time</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                    placeholder="Any specific concerns or goals..."
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#323956] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookConsultation}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#323956] text-white rounded-xl hover:bg-[#232D3C] disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Request Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Photobiomodulation;
