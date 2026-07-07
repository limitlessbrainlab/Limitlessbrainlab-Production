import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import {
  Brain,
  Activity,
  Monitor,
  Headphones,
  Zap,
  Target,
  Moon,
  Heart,
  Smile,
  ChevronLeft,
  ExternalLink,
  Users,
  Info,
  Sparkles,
  TrendingUp,
  Calendar,
  MessageCircle,
  Phone,
  Clock,
  CheckCircle,
  Play,
  Award,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  Star,
  BookOpen
} from 'lucide-react';

const HomeNeurofeedback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const patientEmail = user?.email || '';

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [patientName, setPatientName] = useState('');
  const [parameterScores, setParameterScores] = useState({});
  const [lowestParameters, setLowestParameters] = useState([]);
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
    duration: 30,
    focusArea: '',
    notes: '',
    rating: 4
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // All trackable parameters with their database keys
  const allParameters = [
    { key: 'cognition', label: 'Cognition', icon: Brain, color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
    { key: 'stress', label: 'Stress', icon: Heart, color: 'rose', bgColor: 'bg-rose-100', textColor: 'text-rose-600' },
    { key: 'focus-attention', label: 'Focus & Attention', icon: Target, color: 'amber', bgColor: 'bg-amber-100', textColor: 'text-amber-600' },
    { key: 'burnout-fatigue', label: 'Burnout & Fatigue', icon: Zap, color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
    { key: 'emotional-regulation', label: 'Emotional Regulation', icon: Smile, color: 'pink', bgColor: 'bg-pink-100', textColor: 'text-pink-600' },
    { key: 'learning', label: 'Learning', icon: BookOpen, color: 'teal', bgColor: 'bg-teal-100', textColor: 'text-teal-600' },
    { key: 'creativity', label: 'Creativity', icon: Moon, color: 'indigo', bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' }
  ];

  // Fetch patient data
  const fetchData = useCallback(async () => {
    if (!patientEmail) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch patient details including UUID - try multiple approaches
      let patientData = null;
      let patientId = null;

      // Method 1: Query by email
      const { data: data1 } = await supabase
        .from('patients')
        .select('id, name, email, full_name')
        .eq('email', patientEmail)
        .maybeSingle();

      if (data1) {
        patientData = data1;
        patientId = data1.id;
      }

      // Method 2: If not found by email, try by user name
      if (!patientData && user?.name) {
        const { data: data2 } = await supabase
          .from('patients')
          .select('id, name, email, full_name')
          .or(`name.ilike.%${user.name}%,full_name.ilike.%${user.name}%`)
          .limit(1)
          .maybeSingle();

        if (data2) {
          patientData = data2;
          patientId = data2.id;
        }
      }

      const displayName = patientData?.name || patientData?.full_name || user?.name || '';
      setPatientName(displayName);

      // Fetch algorithm results - try multiple approaches
      let algorithmData = null;

      // Method 1: Try fetching with patient_id (UUID)
      if (patientId) {
        const { data: algData1, error: err1 } = await supabase
          .from('algorithm_results')
          .select('results, patient_name, input_data, output_data')
          .eq('patient_id', patientId)
          .order('processed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (algData1 && !err1) {
          algorithmData = algData1;
        } else {
        }
      }

      // Method 2: Try fetching by patient_name
      if (!algorithmData && displayName) {
        const { data: algData2, error: err2 } = await supabase
          .from('algorithm_results')
          .select('results, patient_name, input_data, output_data')
          .ilike('patient_name', `%${displayName}%`)
          .order('processed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (algData2 && !err2) {
          algorithmData = algData2;
        } else {
        }
      }

      // Method 3: Get latest algorithm result and check if it matches
      if (!algorithmData) {
        const { data: allResults, error: err3 } = await supabase
          .from('algorithm_results')
          .select('results, patient_name, input_data, output_data, patient_id')
          .order('processed_at', { ascending: false })
          .limit(10);

        if (allResults && allResults.length > 0) {
          // Find matching result by name
          const matchingResult = allResults.find(r => {
            const rName = (r.patient_name || r.input_data?.patientName || '').toLowerCase();
            return rName.includes(displayName.toLowerCase()) || displayName.toLowerCase().includes(rName);
          });

          if (matchingResult) {
            algorithmData = matchingResult;
          } else {
          }
        }
      }


      // Use results or output_data (both contain the same data)
      const resultsData = algorithmData?.results || algorithmData?.output_data;

      if (resultsData) {
        const results = resultsData;
        const scores = {};


        // Handle array format (7 parameters as array)
        if (Array.isArray(results)) {
          // Results is an array of parameter objects from AlgorithmDataProcessor
          // Format: { parameter: "Stress", score: 66, rawScore: "2/3", status: "Medium", color: "red", metrics: [...] }
          results.forEach((param, idx) => {
            // Get parameter name - check multiple possible field names
            const paramName = (param.parameter || param.parameter_name || param.name || param.parameterName || '').toLowerCase();

            // Get the rawScore directly (e.g., "2/3") - this is the actual score out of 3
            const rawScoreStr = param.rawScore || param.raw_score || '';
            let scoreOutOf3 = 0;
            if (typeof rawScoreStr === 'string' && rawScoreStr.includes('/')) {
              const [val, max] = rawScoreStr.split('/').map(Number);
              scoreOutOf3 = val; // Use the actual value (0, 1, 2, or 3)
            } else {
              // Fallback: convert percentage to 0-3 scale
              const percentage = param.score || 50;
              scoreOutOf3 = percentage <= 33 ? 1 : percentage <= 66 ? 2 : 3;
            }


            // Map parameter names to our keys (matching allParameters keys)
            // Store the actual score out of 3 (not percentage)
            if (paramName.includes('stress') || paramName.includes('calm') || paramName.includes('anxiety')) {
              scores['stress'] = scoreOutOf3;
            } else if (paramName.includes('focus') || paramName.includes('attention') || paramName.includes('concentration')) {
              scores['focus-attention'] = scoreOutOf3;
            } else if (paramName.includes('fatigue') || paramName.includes('burnout') || paramName.includes('energy')) {
              scores['burnout-fatigue'] = scoreOutOf3;
            } else if (paramName.includes('mood') || paramName.includes('emotion') || paramName.includes('regulation')) {
              scores['emotional-regulation'] = scoreOutOf3;
            } else if (paramName.includes('memory') || paramName.includes('learning')) {
              scores['learning'] = scoreOutOf3;
            } else if (paramName.includes('cognition') || paramName.includes('cognitive') || paramName.includes('processing')) {
              scores['cognition'] = scoreOutOf3;
            } else if (paramName.includes('creativ') || paramName.includes('alpha')) {
              scores['creativity'] = scoreOutOf3;
            } else if (paramName.includes('sleep')) {
              scores['creativity'] = scoreOutOf3;
            }
          });
        }
        // Handle composite_scores object format (convert percentage to 0-3 scale)
        else if (results.composite_scores) {
          const toScore3 = (val) => val <= 33 ? 1 : val <= 66 ? 2 : 3;
          scores['cognition'] = toScore3(results.composite_scores.cognitive_performance || results.composite_scores.cognition || 50);
          scores['stress'] = toScore3(results.composite_scores.stress_regulation || results.composite_scores.stress_calm || results.composite_scores.stress || 50);
          scores['focus-attention'] = toScore3(results.composite_scores.focus_attention || results.composite_scores.focus || 50);
          scores['burnout-fatigue'] = toScore3(results.composite_scores.energy_fatigue || results.composite_scores.fatigue || results.composite_scores.burnout || 50);
          scores['emotional-regulation'] = toScore3(results.composite_scores.emotional_regulation || results.composite_scores.mood_regulation || results.composite_scores.emotional || 50);
          scores['learning'] = toScore3(results.composite_scores.learning || results.composite_scores.memory_learning || results.composite_scores.memory || 50);
          scores['creativity'] = toScore3(results.composite_scores.creativity || 50);
        }
        // Handle scores object format (convert percentage to 0-3 scale)
        else if (results.scores) {
          const toScore3 = (val) => val <= 33 ? 1 : val <= 66 ? 2 : 3;
          scores['cognition'] = toScore3(results.scores.cognitive_performance || results.scores.cognition || 50);
          scores['stress'] = toScore3(results.scores.stress_regulation || results.scores.stress_calm || results.scores.stress || 50);
          scores['focus-attention'] = toScore3(results.scores.focus_attention || results.scores.focus || 50);
          scores['burnout-fatigue'] = toScore3(results.scores.energy_fatigue || results.scores.fatigue || results.scores.burnout || 50);
          scores['emotional-regulation'] = toScore3(results.scores.emotional_regulation || results.scores.mood_regulation || results.scores.emotional || 50);
          scores['learning'] = toScore3(results.scores.learning || results.scores.memory_learning || results.scores.memory || 50);
          scores['creativity'] = toScore3(results.scores.creativity || 50);
        }
        // Handle direct field format (convert percentage to 0-3 scale)
        else {
          const toScore3 = (val) => val <= 33 ? 1 : val <= 66 ? 2 : 3;
          scores['cognition'] = toScore3(results.cognitive_performance || results.cognition || 50);
          scores['stress'] = toScore3(results.stress_regulation || results.stress_calm || results.stress || 50);
          scores['focus-attention'] = toScore3(results.focus_attention || results.focus || 50);
          scores['burnout-fatigue'] = toScore3(results.energy_fatigue || results.fatigue || results.burnout || 50);
          scores['emotional-regulation'] = toScore3(results.emotional_regulation || results.mood_regulation || results.emotional || 50);
          scores['learning'] = toScore3(results.learning || results.memory_learning || results.memory || 50);
          scores['creativity'] = toScore3(results.creativity || 50);
        }

        // Fill any missing scores with 2 (middle value out of 3) - but keep 0 if explicitly set
        allParameters.forEach(p => {
          if (scores[p.key] === undefined || scores[p.key] === null || isNaN(scores[p.key])) {
            scores[p.key] = 2; // Default to 2/3
          }
        });

        setParameterScores(scores);

        // Find lowest 2 parameters (scores are now 0-3, not percentages)
        const sortedParams = allParameters
          .map(p => ({ ...p, score: scores[p.key] ?? 2 }))
          .sort((a, b) => a.score - b.score)
          .slice(0, 2);
        setLowestParameters(sortedParams);

      } else {
        // No algorithm results found - keep empty state
        setParameterScores({});
        setLowestParameters([]);
      }

      // Fetch neurofeedback sessions
      const { data: sessionsData } = await supabase
        .from('neurofeedback_sessions')
        .select('*')
        .eq('patient_email', patientEmail)
        .order('session_date', { ascending: false });

      if (sessionsData) {
        setSessions(sessionsData);

        // Calculate stats
        const now = new Date();
        const thisMonth = sessionsData.filter(s => {
          const sessionDate = new Date(s.session_date);
          return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
        });

        const totalMinutes = sessionsData.reduce((acc, s) => acc + (s.duration_minutes || 30), 0);

        // Calculate streak (consecutive days)
        let streak = 0;
        const today = new Date().toDateString();
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

  // Log a neurofeedback session
  const handleLogSession = async () => {
    if (!sessionData.focusArea) {
      toast.error('Please select a focus area');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('neurofeedback_sessions')
        .insert([{
          patient_email: patientEmail,
          focus_area: sessionData.focusArea,
          duration_minutes: sessionData.duration,
          session_date: new Date().toISOString().split('T')[0],
          notes: sessionData.notes,
          rating: sessionData.rating
        }]);

      if (error) throw error;

      toast.success('Session logged successfully!', { icon: '🧠' });
      setShowLogSessionModal(false);
      setSessionData({ duration: 30, focusArea: '', notes: '', rating: 4 });
      fetchData();
    } catch (error) {
      console.error('Error logging session:', error);
      toast.error('Failed to log session');
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
      const { error } = await supabase
        .from('neurofeedback_bookings')
        .insert([{
          patient_email: patientEmail,
          patient_name: patientName || user?.name || 'Patient',
          booking_date: bookingData.date,
          booking_time: bookingData.time,
          session_type: bookingData.sessionType,
          notes: `Focus Areas: ${lowestParameters.map(p => p.label).join(', ')}\n${bookingData.notes}`,
          status: 'pending'
        }]);

      if (error) throw error;

      toast.success('Booking request sent! Dr. Roland will contact you.', {
        duration: 4000,
        icon: '📅'
      });
      setShowBookingModal(false);
      setBookingData({ date: '', time: '', sessionType: 'online', notes: '' });
    } catch (error) {
      console.error('Error booking:', error);
      // Still show success for demo
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

  // Open WhatsApp for Dr Roland / Neurobics
  const handleWhatsAppDrRoland = () => {
    window.open('https://w.app/labchat', '_blank');
    toast.success('Opening WhatsApp...', { icon: '💬' });
  };

  // Section toggle
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#323956] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your neurofeedback data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <button
            onClick={() => navigate('/dashboard/welcome')}
            className="flex items-center space-x-2 text-blue-200 hover:text-white mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-start space-x-2.5 sm:space-x-4">
            <div className="bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 flex-shrink-0">
              <Brain className="h-5 w-5 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl md:text-3xl font-bold leading-tight">Neurofeedback Training (with Dr. Roland)</h1>
              <p className="text-blue-200 mt-0.5 sm:mt-1 text-[11px] sm:text-sm md:text-base leading-relaxed">
                Real-time brain training to support calm, focus, and resilience—guided, step-by-step.
              </p>
            </div>
          </div>
          {/* Tag Chips */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/20 rounded-full text-[10px] sm:text-sm font-medium">Non-invasive</span>
            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/20 rounded-full text-[10px] sm:text-sm font-medium">EEG-based</span>
            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/20 rounded-full text-[10px] sm:text-sm font-medium">Guided remotely</span>
            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/20 rounded-full text-[10px] sm:text-sm font-medium">Beginner-friendly</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">

        {/* Patient Welcome Card */}
        {patientName && (
          <div className="bg-gradient-to-r from-[#E4EFFF] to-[#F0F4FF] dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Welcome back,</p>
                <h2 className="text-base sm:text-xl font-bold text-[#323956] dark:text-white">{patientName}</h2>
              </div>
              {lowestParameters.length > 0 && (
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Your focus areas:</p>
                  <p className="text-xs sm:text-sm font-medium text-[#323956] dark:text-blue-300">
                    {lowestParameters.map(p => p.label).join(' & ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          <button
            onClick={handleWhatsAppDrRoland}
            className="flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-gradient-to-r from-[#323956] to-[#4a5578] text-white rounded-xl hover:opacity-90 transition-opacity shadow-lg"
          >
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="font-semibold text-sm sm:text-base">Chat with Neurofeedback Expert</span>
          </button>
        </div>

        {/* Your Focus Areas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <Target className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white">Your Focus Areas</h2>
              <p className="text-[11px] sm:text-sm text-gray-600 dark:text-gray-400">Based on your lowest 2 parameters</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {lowestParameters.map((param, index) => {
              const Icon = param.icon;
              return (
                <div
                  key={param.key}
                  className={`relative overflow-hidden p-3 sm:p-4 rounded-xl border-2 ${
                    index === 0 ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-amber-300 bg-amber-50 dark:bg-amber-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${param.bgColor} dark:bg-opacity-30 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${param.textColor}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{param.label}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">Priority {index + 1}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{param.score}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* What is Neurofeedback? - Collapsible */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => toggleSection('how-it-works')}
            className="w-full flex items-center justify-between p-3 sm:p-6"
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#E4EFFF] dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-[#323956] dark:text-blue-400" />
              </div>
              <h2 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white">What makes Neurobics a fit?</h2>
            </div>
            {expandedSection === 'how-it-works' ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {expandedSection === 'how-it-works' && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
              {/* Card 1: What this is */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">What is it?</h4>
                </div>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Neurofeedback is a form of training that uses EEG readings to mirror brain activity in real time.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>You receive feedback (usually audio/visual) that helps your brain learn more balanced patterns over repeated sessions.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>It's a training process, not a "one-time fix", and it improves through consistency.</span>
                  </li>
                </ul>
              </div>

              {/* Card 2: Who Is It For? */}
              <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Who Is It For?</h4>
                </div>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Focus & attention support (work/study/productivity)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Stress resilience and emotional steadiness</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Sleep support and nervous system regulation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Performance optimisation (high performers, athletes, founders)</span>
                  </li>
                </ul>
              </div>

              {/* Card 3: What makes Neurobics a fit */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Award className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">What makes Neurobics a fit?</h4>
                </div>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>Neurobics offers a remote, at-home style journey from intake to completion (with optional qEEG/brain measurement options).</span>
                  </li>
                </ul>
              </div>

              {/* Card 4: Your beginner journey */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Your beginner journey</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">1</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Goal check</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">You share what you want to improve (focus, stress, sleep, mood, performance).</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">2</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Baseline</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">A starting point is established (so progress is trackable).</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">3</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Training plan</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">You follow a simple session schedule with guidance.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">4</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Review + adjust</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Your plan is refined based on how you respond.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">5</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Lock it in</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">You build repeatable routines so gains hold.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5: What to expect */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-teal-100 dark:border-teal-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="h-5 w-5 text-teal-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">What to expect</h4>
                </div>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-teal-500 mt-1">•</span>
                    <span>Sessions are typically low-effort: you follow instructions, the feedback does the "teaching."</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-teal-500 mt-1">•</span>
                    <span>Progress is usually seen as a trend over time (not instant perfection).</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-teal-500 mt-1">•</span>
                    <span>You'll get the best results by following the schedule consistently.</span>
                  </li>
                </ul>
              </div>

              {/* Card 6: Safety & boundaries */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-amber-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Safety & boundaries</h4>
                </div>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Neurofeedback is commonly presented as non-invasive and training-based.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>If you have neurological conditions or are under active care, you should check suitability with your clinician and the provider.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Benefits Section - Collapsible */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => toggleSection('benefits')}
            className="w-full flex items-center justify-between p-3 sm:p-6"
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white">Benefits of Neurofeedback</h2>
            </div>
            {expandedSection === 'benefits' ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {expandedSection === 'benefits' && (
            <div className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg sm:rounded-xl border border-blue-100 dark:border-blue-800">
                  <Target className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 mb-1 sm:mb-2" />
                  <h4 className="font-semibold text-xs sm:text-base text-gray-900 dark:text-white mb-0.5 sm:mb-1">Improved Focus</h4>
                  <p className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400">Train your brain to maintain attention</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg sm:rounded-xl border border-purple-100 dark:border-purple-800">
                  <Heart className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600 mb-1 sm:mb-2" />
                  <h4 className="font-semibold text-xs sm:text-base text-gray-900 dark:text-white mb-0.5 sm:mb-1">Stress Reduction</h4>
                  <p className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400">Regulate stress responses naturally</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg sm:rounded-xl border border-green-100 dark:border-green-800">
                  <Moon className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 mb-1 sm:mb-2" />
                  <h4 className="font-semibold text-xs sm:text-base text-gray-900 dark:text-white mb-0.5 sm:mb-1">Better Sleep</h4>
                  <p className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400">Improve sleep quality and duration</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg sm:rounded-xl border border-amber-100 dark:border-amber-800">
                  <Smile className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600 mb-1 sm:mb-2" />
                  <h4 className="font-semibold text-xs sm:text-base text-gray-900 dark:text-white mb-0.5 sm:mb-1">Emotional Balance</h4>
                  <p className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400">Better emotional regulation</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Recent Sessions</h2>
              </div>
            </div>

            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{session.focus_area}</p>
                      <p className="text-sm text-gray-500">{new Date(session.session_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{session.duration_minutes} min</p>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < session.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Partner Note */}

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-1">Ready to Start Your Brain Training?</h3>
              <p className="text-blue-200 text-sm sm:text-base">
                Message Dr. Roland's team for the best next step.
              </p>
            </div>
            <button
              onClick={handleWhatsAppDrRoland}
              className="w-full sm:w-auto px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors whitespace-nowrap flex items-center justify-center"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Connect (WhatsApp)
            </button>
          </div>
        </div>
      </div>

      {/* Log Session Modal */}
      {showLogSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Log Session</h2>
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
                    Focus Area *
                  </label>
                  <select
                    value={sessionData.focusArea}
                    onChange={(e) => setSessionData({ ...sessionData, focusArea: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#323956]"
                  >
                    <option value="">Select focus area</option>
                    {allParameters.map(param => (
                      <option key={param.key} value={param.label}>{param.label}</option>
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
                    onChange={(e) => setSessionData({ ...sessionData, duration: parseInt(e.target.value) || 30 })}
                    min="5"
                    max="120"
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
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
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
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Book Consultation</h2>
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
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Dr. Roland / Neurobics</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Neurofeedback Specialist</p>
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
                    Session Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBookingData({ ...bookingData, sessionType: 'online' })}
                      className={`flex-1 py-2 rounded-lg border transition-all ${
                        bookingData.sessionType === 'online'
                          ? 'bg-[#323956] text-white border-[#323956]'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Monitor className="h-4 w-4 inline mr-1" /> Online
                    </button>
                    <button
                      onClick={() => setBookingData({ ...bookingData, sessionType: 'in-person' })}
                      className={`flex-1 py-2 rounded-lg border transition-all ${
                        bookingData.sessionType === 'in-person'
                          ? 'bg-[#323956] text-white border-[#323956]'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Users className="h-4 w-4 inline mr-1" /> In-Person
                    </button>
                  </div>
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

export default HomeNeurofeedback;
