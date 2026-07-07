import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import DatabaseService from '../services/databaseService';
import toast from 'react-hot-toast';
import FeatureGate from '../components/access/FeatureGate';
import {
  Wind,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Headphones,
  Vibrate,
  Eye,
  EyeOff,
  Save,
  Bell,
  FileText,
  TrendingUp,
  Calendar,
  Flame,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Minus,
  Plus,
  Loader2,
  Info,
  X
} from 'lucide-react';

const SUPABASE_STORAGE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://puzdgwtprcpaaxxwkwtk.supabase.co').replace(/\/$/, '');
const getSupabasePublicStorageUrl = (bucket, objectPath) =>
  `${SUPABASE_STORAGE_URL}/storage/v1/object/public/${bucket}/${objectPath.split('/').map(encodeURIComponent).join('/')}`;
const getFrequencyMediaUrl = (objectPath) => getSupabasePublicStorageUrl('frequncies', objectPath);

const getYouTubeThumbnail = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg` : null;
};

const ANSResetProtocol = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mode and timer state
  const [selectedMode, setSelectedMode] = useState('box'); // 478, sigh, bhramari, box, custom
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [highlightedVideos, setHighlightedVideos] = useState([]);

  // Yogic Breathing gamified session state
  const [yogicPhase, setYogicPhase] = useState('tips'); // 'tips' | 'countdown' | 'breathing' | 'complete'
  const [yogicCycle, setYogicCycle] = useState(1);
  const [yogicBreathPhase, setYogicBreathPhase] = useState('inhale'); // 'inhale' | 'exhale'
  const [yogicTimer, setYogicTimer] = useState(0);
  const [breathScale, setBreathScale] = useState(0);

  // Goals per protocol box
  const protocolGoals = {
    '478': [
      'Yogic Breathing', 'Bhastrika', 'Ujjayi', 'Antar Kumbhak', 'Cyclic Sigh', 'Bhrahmari'
    ],
    'sigh': [
      'Yogic Breathing', 'Bhastrika', 'Kapalbhati', 'Nadi Shoddhan', 'Bahaye Kumbhak'
    ],
    'bhramari': [
      'Yogic Breathing', 'Box Breathing', '4-7-8 Technique', 'Nadi Shoddhan', 'Antar Kumbhak', 'Cyclic Sigh'
    ],
    'box': [
      'Yogic Breathing', 'Bhastrika', 'Kapalbhati', 'Chandra Bhedi', 'Bahaye Kumbhak', 'Bhrahmari'
    ]
  };

  // Custom breathing settings
  const [customBreath, setCustomBreath] = useState({
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4
  });
  const [timeRemaining, setTimeRemaining] = useState(180); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('ready'); // ready, inhale, hold, exhale, holdAfter, humming, farGaze
  const [cycleCount, setCycleCount] = useState(0);
  const [phaseTimer, setPhaseTimer] = useState(0);

  // Toggle states
  const [headphonesOn, setHeadphonesOn] = useState(false);
  const [hapticOn, setHapticOn] = useState(true);
  const [eyesClosed, setEyesClosed] = useState(false);

  // Pre/Post session sliders
  const [showPostSession, setShowPostSession] = useState(false);
  const [preSession, setPreSession] = useState({ stress: 5, calm: 5, focus: 5 });
  const [postSession, setPostSession] = useState({ stress: 5, calm: 5, focus: 5 });

  // Notes
  const [notes, setNotes] = useState('');

  // Video popup state
  const [videoPopup, setVideoPopup] = useState({ open: false, url: '', name: '' });

  // Loading state
  const [isLogging, setIsLogging] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  // Progress tracking (loaded from database)
  const [progress, setProgress] = useState({
    sessionsToday: 0,
    streakDays: 0,
    weeklyTrend: [0, 0, 0, 0, 0, 0, 0], // sessions per day
    totalSessions: 0,
    avgStressReduction: 0
  });

  // Algorithm results for pre-populating sliders
  const [algorithmResults, setAlgorithmResults] = useState(null);

  // Reminder and Routine modals
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showHowToModal, setShowHowToModal] = useState(null); // stores technique key
  const [reminderData, setReminderData] = useState({
    time: '09:00',
    days: ['Mon', 'Wed', 'Fri'],
    enabled: true
  });
  const [savedRoutine, setSavedRoutine] = useState(null);
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);

  const timerRef = useRef(null);
  const phaseRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Countdown state for "Your session starts in X seconds"
  const [countdown, setCountdown] = useState(null);
  const [wavePhase, setWavePhase] = useState('inhale'); // For custom breathing wave animation
  const previewCanvasRef = useRef(null); // For static wave preview

  // Focus Areas state for Custom breathing mode
  const [lowestScoreParams, setLowestScoreParams] = useState([]);
  const [checkedMOVERS, setCheckedMOVERS] = useState({});
  const [currentProgramWeek, setCurrentProgramWeek] = useState(1);
  const [programStarted, setProgramStarted] = useState(false);

  // MOVERS Protocol items for different parameters (6 items each - M.O.V.E.R.S)
  const moversProtocol = {
    stress: {
      name: 'Stress',
      items: [
        { id: 'M', letter: 'M', label: 'Meditation | Music', description: '15-min body scan meditation, 432Hz calming music' },
        { id: 'O', letter: 'O', label: 'Oxygenation', description: '4-7-8 breathing 3x daily, physiological sigh when stressed' },
        { id: 'V', letter: 'V', label: 'Visualization', description: 'Stress release imagery, peaceful place visualization' },
        { id: 'E', letter: 'E', label: 'Exercise', description: 'Yoga, walking in nature, tension release stretches' },
        { id: 'R', letter: 'R', label: 'Reading | Reflection', description: 'Stress management books, journaling practice' },
        { id: 'S', letter: 'S', label: 'Sleep | Processing', description: 'Wind-down routine, worry time before bed, not in bed' }
      ]
    },
    focus: {
      name: 'Focus',
      items: [
        { id: 'M', letter: 'M', label: 'Meditation | Music', description: '10-min focus meditation, binaural beats for concentration' },
        { id: 'O', letter: 'O', label: 'Oxygenation', description: 'Box breathing before tasks, energizing breath patterns' },
        { id: 'V', letter: 'V', label: 'Visualization', description: 'Goal visualization, mental rehearsal techniques' },
        { id: 'E', letter: 'E', label: 'Exercise', description: 'Morning cardio, brain-boosting movement breaks' },
        { id: 'R', letter: 'R', label: 'Reading | Reflection', description: 'Productivity books, daily review practice' },
        { id: 'S', letter: 'S', label: 'Sleep | Processing', description: 'Consistent sleep schedule, cognitive rest periods' }
      ]
    },
    sleep: {
      name: 'Sleep',
      items: [
        { id: 'M', letter: 'M', label: 'Meditation | Music', description: 'Sleep meditation, white noise, sleep stories' },
        { id: 'O', letter: 'O', label: 'Oxygenation', description: '4-7-8 breathing for sleep, relaxation breathwork' },
        { id: 'V', letter: 'V', label: 'Visualization', description: 'Sleep-inducing imagery, body scan relaxation' },
        { id: 'E', letter: 'E', label: 'Exercise', description: 'Evening yoga, gentle stretching routine' },
        { id: 'R', letter: 'R', label: 'Reading | Reflection', description: 'Sleep hygiene education, dream journaling' },
        { id: 'S', letter: 'S', label: 'Sleep | Processing', description: 'Dream journaling, worry time before bed, not in bed' }
      ]
    },
    emotional: {
      name: 'Emotional Regulation',
      items: [
        { id: 'M', letter: 'M', label: 'Meditation | Music', description: 'Loving-kindness meditation, emotional processing music' },
        { id: 'O', letter: 'O', label: 'Oxygenation', description: 'Coherent breathing (5-5), heart-focused breathing' },
        { id: 'V', letter: 'V', label: 'Visualization', description: 'Emotional reframing, perspective-taking exercises' },
        { id: 'E', letter: 'E', label: 'Exercise', description: 'Dance, martial arts, any movement that processes emotions' },
        { id: 'R', letter: 'R', label: 'Reading | Reflection', description: 'Emotional intelligence books, evening reflection practice' },
        { id: 'S', letter: 'S', label: 'Sleep | Processing', description: 'Dream journaling, worry time before bed, not in bed' }
      ]
    },
    burnout: {
      name: 'Burnout',
      items: [
        { id: 'M', letter: 'M', label: 'Meditation | Music', description: 'Restorative meditation, soothing ambient sounds' },
        { id: 'O', letter: 'O', label: 'Oxygenation', description: 'Physiological sighs, parasympathetic breathing' },
        { id: 'V', letter: 'V', label: 'Visualization', description: 'Energy restoration imagery, boundary setting' },
        { id: 'E', letter: 'E', label: 'Exercise', description: 'Gentle movement, restorative yoga, nature walks' },
        { id: 'R', letter: 'R', label: 'Reading | Reflection', description: 'Burnout recovery books, values clarification' },
        { id: 'S', letter: 'S', label: 'Sleep | Processing', description: 'Recovery sleep, mental decompression time' }
      ]
    },
    anxiety: {
      name: 'Anxiety',
      items: [
        { id: 'M', letter: 'M', label: 'Meditation | Music', description: 'Grounding meditation, anxiety relief soundscapes' },
        { id: 'O', letter: 'O', label: 'Oxygenation', description: 'Extended exhale breathing, box breathing for panic' },
        { id: 'V', letter: 'V', label: 'Visualization', description: 'Safe place imagery, anxiety dissolving techniques' },
        { id: 'E', letter: 'E', label: 'Exercise', description: 'Anxiety-releasing movement, progressive muscle relaxation' },
        { id: 'R', letter: 'R', label: 'Reading | Reflection', description: 'CBT workbooks, worry time journaling' },
        { id: 'S', letter: 'S', label: 'Sleep | Processing', description: 'Worry time before bed, not in bed, calming routine' }
      ]
    }
  };

  // Expanded state for focus area cards
  const [expandedAreas, setExpandedAreas] = useState({});

  // Fetch algorithm results and pre-populate sliders based on patient's assessment
  const fetchAlgorithmResults = useCallback(async () => {
    if (!user?.email) return;

    try {
      const allResults = await DatabaseService.get('algorithmResults');
      if (!allResults || allResults.length === 0) return;

      // Find results for this patient
      const patientResults = allResults.filter(r => {
        const resultEmail = r.patient_email || r.patientEmail || '';
        return resultEmail.toLowerCase() === user.email.toLowerCase();
      });

      if (patientResults.length === 0) return;

      // Get the most recent result
      const sortedResults = patientResults.sort((a, b) =>
        new Date(b.processed_at || b.processedAt || b.createdAt || 0) -
        new Date(a.processed_at || a.processedAt || a.createdAt || 0)
      );
      const latestResult = sortedResults[0];
      const outputData = latestResult.results || latestResult.outputData || latestResult.output_data;

      if (outputData && Array.isArray(outputData)) {
        setAlgorithmResults(outputData);

        // Find relevant scores
        const findScore = (keywords) => {
          for (const item of outputData) {
            if (!item?.parameter) continue;
            const paramLower = item.parameter.toLowerCase();
            for (const keyword of keywords) {
              if (paramLower.includes(keyword.toLowerCase())) {
                return item.score;
              }
            }
          }
          return null;
        };

        const stressScore = findScore(['stress', 'burnout']);
        const focusScore = findScore(['focus', 'attention']);
        const emotionalScore = findScore(['emotional', 'regulation']);

        // Convert algorithm scores to slider values (1-10 scale)
        // Stress: Higher score in algorithm = higher stress (so direct mapping)
        // For stress/burnout, the score is inversely related to wellness
        // Low stress score = low stress level
        const stressLevel = stressScore !== null
          ? Math.max(1, Math.min(10, Math.round(stressScore / 10)))
          : 5;

        // Focus: Higher score = better focus = higher focus level
        const focusLevel = focusScore !== null
          ? Math.max(1, Math.min(10, Math.round(focusScore / 10)))
          : 5;

        // Calm: Based on emotional regulation - higher score = more calm
        const calmLevel = emotionalScore !== null
          ? Math.max(1, Math.min(10, Math.round(emotionalScore / 10)))
          : 5;

        // Set pre-session values based on patient's assessment
        setPreSession({
          stress: stressLevel,
          calm: calmLevel,
          focus: focusLevel
        });

        // Find the 2 lowest scoring parameters for Focus Areas (Custom breathing)
        const paramScores = outputData
          .filter(item => item?.parameter && item?.score !== undefined)
          .map(item => {
            const paramLower = item.parameter.toLowerCase();
            let category = 'stress'; // default
            if (paramLower.includes('stress')) category = 'stress';
            else if (paramLower.includes('focus') || paramLower.includes('attention')) category = 'focus';
            else if (paramLower.includes('sleep')) category = 'sleep';
            else if (paramLower.includes('emotional') || paramLower.includes('regulation')) category = 'emotional';
            else if (paramLower.includes('burnout')) category = 'burnout';
            else if (paramLower.includes('anxiety')) category = 'anxiety';

            return {
              parameter: item.parameter,
              score: item.score,
              category: category
            };
          })
          .sort((a, b) => a.score - b.score); // Sort ascending (lowest first)

        // Get unique categories for lowest 2 scores
        const lowestTwo = [];
        const usedCategories = new Set();
        for (const param of paramScores) {
          if (!usedCategories.has(param.category) && lowestTwo.length < 2) {
            lowestTwo.push(param);
            usedCategories.add(param.category);
          }
        }

        setLowestScoreParams(lowestTwo);
        

        // Initialize checked state for MOVERS items
        const initialChecked = {};
        lowestTwo.forEach(param => {
          const protocol = moversProtocol[param.category];
          if (protocol) {
            protocol.items.forEach(item => {
              initialChecked[`${param.category}-${item.id}`] = false;
            });
          }
        });
        setCheckedMOVERS(initialChecked);
      }
    } catch (error) {
      console.error('Error fetching algorithm results for ANS:', error);
    }
  }, [user?.email]);

  // Load saved routine and reminder from database
  const loadSavedSettings = useCallback(async () => {
    if (!user?.email) return;

    try {
      // Load from Supabase
      const { data: settings, error } = await supabase
        .from('ans_user_settings')
        .select('*')
        .eq('patient_email', user.email.toLowerCase())
        .maybeSingle();

      if (settings && !error) {
        if (settings.routine) {
          setSavedRoutine(settings.routine);
          // Apply saved routine settings
          if (settings.routine.mode) setSelectedMode(settings.routine.mode);
          if (settings.routine.headphonesOn !== undefined) setHeadphonesOn(settings.routine.headphonesOn);
          if (settings.routine.hapticOn !== undefined) setHapticOn(settings.routine.hapticOn);
          // Load custom breathing settings if saved
          if (settings.routine.customBreath) setCustomBreath(settings.routine.customBreath);
        }
        if (settings.reminder) {
          setReminderData(settings.reminder);
        }
      }
    } catch (error) {
      
    }
  }, [user?.email]);

  // Save reminder to database
  const saveReminder = async () => {
    if (!user?.email) {
      toast.error('Please login to save reminder');
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('ans_user_settings')
        .select('id')
        .eq('patient_email', user.email.toLowerCase())
        .maybeSingle();

      if (existing) {
        await supabase
          .from('ans_user_settings')
          .update({ reminder: reminderData, updated_at: new Date().toISOString() })
          .eq('patient_email', user.email.toLowerCase());
      } else {
        await supabase
          .from('ans_user_settings')
          .insert({
            patient_email: user.email.toLowerCase(),
            patient_name: user.name || user.email,
            reminder: reminderData
          });
      }

      // Also set browser notification permission
      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }

      toast.success(`Reminder set for ${reminderData.time} on ${reminderData.days.join(', ')}`);
      setShowReminderModal(false);

      // Schedule local notification (for PWA)
      if ('Notification' in window && Notification.permission === 'granted') {
        // Store reminder in localStorage for service worker
        localStorage.setItem('ansReminder', JSON.stringify({
          ...reminderData,
          patientEmail: user.email
        }));
      }
    } catch (error) {
      console.error('Error saving reminder:', error);
      toast.error('Failed to save reminder');
    }
  };

  // Save routine to database
  const saveRoutine = async () => {
    if (!user?.email) {
      toast.error('Please login to save routine');
      return;
    }

    setIsSavingRoutine(true);
    try {
      const routineData = {
        mode: selectedMode,
        headphonesOn,
        hapticOn,
        eyesClosed,
        customBreath: selectedMode === 'custom' ? customBreath : null,
        savedAt: new Date().toISOString()
      };

      const { data: existing } = await supabase
        .from('ans_user_settings')
        .select('id')
        .eq('patient_email', user.email.toLowerCase())
        .maybeSingle();

      if (existing) {
        await supabase
          .from('ans_user_settings')
          .update({ routine: routineData, updated_at: new Date().toISOString() })
          .eq('patient_email', user.email.toLowerCase());
      } else {
        await supabase
          .from('ans_user_settings')
          .insert({
            patient_email: user.email.toLowerCase(),
            patient_name: user.name || user.email,
            routine: routineData
          });
      }

      setSavedRoutine(routineData);
      toast.success('Routine saved! Your preferred settings will be loaded automatically.');
      setShowRoutineModal(false);
    } catch (error) {
      console.error('Error saving routine:', error);
      toast.error('Failed to save routine');
    } finally {
      setIsSavingRoutine(false);
    }
  };

  // Toggle day selection for reminder
  const toggleReminderDay = (day) => {
    setReminderData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  // Fetch progress data from database
  const fetchProgress = useCallback(async () => {
    if (!user?.email) return;

    setIsLoadingProgress(true);
    try {
      const userEmail = user.email.toLowerCase();

      // Get sessions for today
      const today = new Date().toISOString().split('T')[0];
      const { data: todaySessions, error: todayError } = await supabase
        .from('ans_sessions')
        .select('id')
        .eq('patient_email', userEmail)
        .eq('session_date', today);

      // Get sessions for last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const { data: weekSessions, error: weekError } = await supabase
        .from('ans_sessions')
        .select('session_date, notes')
        .eq('patient_email', userEmail)
        .gte('session_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('session_date', { ascending: true });

      // Calculate streak
      const { data: allSessions, error: streakError } = await supabase
        .from('ans_sessions')
        .select('session_date')
        .eq('patient_email', userEmail)
        .order('session_date', { ascending: false });

      let streakDays = 0;
      if (allSessions && allSessions.length > 0) {
        const uniqueDates = [...new Set(allSessions.map(s => s.session_date))];
        const todayDate = new Date().toISOString().split('T')[0];

        // Check if there's a session today or yesterday to continue streak
        if (uniqueDates[0] === todayDate || uniqueDates[0] === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
          streakDays = 1;
          for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i - 1]);
            const currDate = new Date(uniqueDates[i]);
            const diffDays = (prevDate - currDate) / (1000 * 60 * 60 * 24);
            if (diffDays === 1) {
              streakDays++;
            } else {
              break;
            }
          }
        }
      }

      // Calculate weekly trend (sessions per day for last 7 days)
      const weeklyTrend = [0, 0, 0, 0, 0, 0, 0];
      let totalStressReduction = 0;
      let stressCount = 0;

      if (weekSessions) {
        weekSessions.forEach(session => {
          const sessionDate = new Date(session.session_date);
          const dayIndex = Math.floor((sessionDate - sevenDaysAgo) / (1000 * 60 * 60 * 24));
          if (dayIndex >= 0 && dayIndex < 7) {
            weeklyTrend[dayIndex]++;
          }
          const parsedNotes = typeof session.notes === 'string'
            ? (() => { try { return JSON.parse(session.notes); } catch { return null; } })()
            : session.notes;
          const deltaStress = parsedNotes?.delta_stress;
          if (typeof deltaStress === 'number') {
            totalStressReduction += deltaStress;
            stressCount++;
          }
        });
      }

      setProgress({
        sessionsToday: todaySessions?.length || 0,
        streakDays,
        weeklyTrend,
        totalSessions: allSessions?.length || 0,
        avgStressReduction: stressCount > 0 ? (totalStressReduction / stressCount).toFixed(1) : 0
      });
    } catch (error) {
      console.error('Error fetching ANS progress:', error);
    } finally {
      setIsLoadingProgress(false);
    }
  }, [user?.email]);

  // Load progress on mount
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Load algorithm results and pre-populate sliders
  useEffect(() => {
    fetchAlgorithmResults();
  }, [fetchAlgorithmResults]);

  // Load saved routine and reminder settings
  useEffect(() => {
    loadSavedSettings();
  }, [loadSavedSettings]);

  // Reset yogic breathing state when goal changes away from Yogic Breathing
  useEffect(() => {
    if (selectedGoal !== 'Yogic Breathing') {
      setYogicPhase('tips');
      setYogicCycle(1);
      setYogicBreathPhase('inhale');
      setYogicTimer(0);
      setBreathScale(0);
    }
  }, [selectedGoal]);

  // Handle deep-link to specific video(s) or carousel section
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedVideos = [
      ...(params.get('videos') || '').split(','),
      params.get('video')
    ].filter(Boolean);
    const sectionId = params.get('section');
    if (requestedVideos.length === 0 && !sectionId) return;

    setTimeout(() => {
      const allCards = document.querySelectorAll('[id^="video-"]');
      const matchedCards = requestedVideos
        .map((slug) => {
          const exact = document.getElementById(`video-${slug}`);
          if (exact) return exact;
          return [...allCards].find((el) => el.id.includes(slug));
        })
        .filter(Boolean);

      if (matchedCards.length > 0) {
        const matchedSlugs = matchedCards.map((card) => card.id.replace('video-', ''));
        setHighlightedVideos([...new Set(matchedSlugs)]);
        const target = matchedCards[0];
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const container = target.parentElement;
        if (container) container.scrollTo({ left: target.offsetLeft - 20, behavior: 'smooth' });
        return;
      }

      if (sectionId) {
        const section = document.getElementById(sectionId);
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 600);
  }, []);

  // Yogic Breathing countdown timer (5..4..3..2..1 then start breathing)
  useEffect(() => {
    if (selectedGoal !== 'Yogic Breathing' || yogicPhase !== 'countdown') return;
    if (yogicTimer <= 0) {
      setYogicPhase('breathing');
      setYogicBreathPhase('inhale');
      setYogicTimer(8);
      setBreathScale(0);
      setYogicCycle(1);
      return;
    }
    const id = setTimeout(() => setYogicTimer(prev => prev - 1), 1000);
    return () => clearTimeout(id);
  }, [selectedGoal, yogicPhase, yogicTimer]);

  // Yogic Breathing animation & phase timer
  useEffect(() => {
    if (selectedGoal !== 'Yogic Breathing' || yogicPhase !== 'breathing') return;

    // Animate breathScale smoothly
    const totalDuration = yogicBreathPhase === 'inhale' ? 8 : 16;
    const elapsed = totalDuration - yogicTimer;
    const progress = Math.min(elapsed / totalDuration, 1);
    if (yogicBreathPhase === 'inhale') {
      setBreathScale(progress); // 0 → 1 during inhale
    } else {
      setBreathScale(1 - progress); // 1 → 0 during exhale
    }

    if (yogicTimer <= 0) {
      // Transition to next phase
      if (yogicBreathPhase === 'inhale') {
        setYogicBreathPhase('exhale');
        setYogicTimer(16);
      } else {
        // Exhale finished — one cycle done
        if (yogicCycle >= 3) {
          setYogicPhase('complete');
        } else {
          setYogicCycle(prev => prev + 1);
          setYogicBreathPhase('inhale');
          setYogicTimer(8);
        }
      }
      return;
    }

    const id = setTimeout(() => setYogicTimer(prev => prev - 1), 1000);
    return () => clearTimeout(id);
  }, [selectedGoal, yogicPhase, yogicBreathPhase, yogicTimer, yogicCycle]);

  // Mode configurations - 4 Breathing Techniques
  const modeConfigs = {
    '478': {
      duration: 120,
      name: 'Limitless Happiness Protocol',
      instruction: '4-7-8 Technique',
      description: 'Inhale 4s → Hold 7s → Exhale 8s × 4 cycles',
      color: '#3B82F6',
      icon: '🌊',
      videoUrl: '', // Add your video URL here
      tip: 'Relax your face, shoulders and neck',
      instructions: ['Breathe through your nose', 'Sit or lie down somewhere comfortable'],
      pattern: {
        type: '478',
        inhale: 4,
        hold: 7,
        exhale: 8,
        cycles: 4
      },
      howTo: {
        title: '4-7-8 Breathing Technique',
        steps: [
          'Place the tip of your tongue behind your upper front teeth',
          'Exhale completely through your mouth with a whoosh sound',
          'Close your mouth and inhale quietly through your nose for 4 seconds',
          'Hold your breath for 7 seconds',
          'Exhale completely through your mouth for 8 seconds',
          'Repeat the cycle 3-4 times'
        ],
        benefits: 'Activates your calm & rest response, reduces anxiety, helps with sleep',
        tip: 'Best done sitting or lying down. Start with 4 cycles, increase gradually.'
      }
    },
    'sigh': {
      duration: 60,
      name: 'Limitless Focus Protocol',
      instruction: 'Double Inhale Sigh',
      description: 'Double inhale + long exhale × 5 sighs',
      color: '#10B981',
      icon: '😌',
      videoUrl: '', // Add your video URL here
      tip: 'This is the fastest way to calm down',
      instructions: ['Take a double inhale through your nose', 'Let out a long slow exhale'],
      pattern: {
        type: 'physiological-sigh',
        sighs: 5,
        farGazeDuration: 10
      },
      howTo: {
        title: 'Physiological Sigh',
        steps: [
          'Take a normal breath in through your nose',
          'Before exhaling, take another quick inhale on top (double inhale)',
          'Your lungs should feel fully expanded',
          'Exhale slowly and completely through your mouth',
          'Let the exhale be longer than the inhales combined',
          'Repeat 3-5 times'
        ],
        benefits: 'Fastest way to calm down, reinflates lung sacs, instant stress relief',
        tip: 'This is your body\'s natural calming mechanism - use it anytime!'
      }
    },
    'bhramari': {
      duration: 180,
      name: 'Limitless Reset Protocol',
      instruction: 'Bee Breath',
      description: 'Humming exhale × 6-8 cycles',
      color: '#F59E0B',
      icon: '🐝',
      videoUrl: '', // Add your video URL here
      tip: 'Feel the vibration in your head and chest',
      instructions: ['Close your eyes and relax your face', 'Hum like a bee on each exhale'],
      pattern: {
        type: 'bhramari',
        inhale: 4,
        humming: 8,
        cycles: 8
      },
      howTo: {
        title: 'Bhramari (Bee Breathing)',
        steps: [
          'Sit comfortably with your spine straight',
          'Close your eyes and relax your face',
          'Place your index fingers on the cartilage of your ears (Shanmukhi mudra optional)',
          'Take a deep breath in through your nose',
          'While exhaling, make a humming sound like a bee',
          'Feel the vibration in your head and chest',
          'Continue for 6-8 rounds'
        ],
        benefits: 'Calms the mind, reduces anger, activates relaxation response, improves concentration',
        tip: 'The humming creates vibrations that activate your body\'s natural calming system.'
      }
    },
    'box': {
      duration: 180,
      name: 'Limitless Regeneration & Repair Protocol',
      instruction: 'Square Breath',
      description: 'Inhale 4s → Hold 4s → Exhale 4s → Hold 4s × 8 cycles',
      color: '#8B5CF6',
      icon: '⬜',
      videoUrl: '', // Add your video URL here
      tip: 'Visualize tracing a square as you breathe',
      instructions: ['Sit upright in a comfortable position', 'Keep equal timing for each phase'],
      pattern: {
        type: 'box',
        inhale: 4,
        hold: 4,
        exhale: 4,
        holdAfter: 4,
        cycles: 8
      },
      howTo: {
        title: 'Box Breathing (Square Breath)',
        steps: [
          'Sit upright in a comfortable position',
          'Slowly exhale all the air from your lungs',
          'Inhale through your nose for 4 seconds',
          'Hold your breath for 4 seconds',
          'Exhale through your mouth for 4 seconds',
          'Hold your breath for 4 seconds',
          'Repeat for 8 cycles'
        ],
        benefits: 'Used by Navy SEALs, reduces stress hormones, improves focus and performance',
        tip: 'Visualize tracing a square as you breathe - one side per phase.'
      }
    },
    'custom': {
      duration: 180,
      name: 'Custom Breathing',
      instruction: 'Custom Pattern',
      description: 'Customize your own breathing pattern',
      color: '#EC4899',
      icon: '⚙️',
      videoUrl: '', // Add your video URL here
      tip: 'Adjust the sliders to match your preferred rhythm',
      instructions: ['Set your own inhale, hold, and exhale times', 'Start slow and adjust as needed'],
      pattern: {
        type: 'custom',
        inhale: 4,
        hold: 4,
        exhale: 4,
        holdAfter: 4,
        cycles: 8
      },
      howTo: {
        title: 'Custom Breathing',
        steps: [
          'Adjust the sliders to set your preferred timing',
          'Set Inhale duration (1-10 seconds)',
          'Set Hold duration after inhale (0-10 seconds)',
          'Set Exhale duration (1-10 seconds)',
          'Set Hold duration after exhale (0-10 seconds)',
          'Click Start to begin your custom breathing session'
        ],
        benefits: 'Personalized breathing pattern, flexible timing, adapt to your needs',
        tip: 'Start with equal timings and gradually extend exhale for deeper relaxation.'
      }
    }
  };

  const currentMode = modeConfigs[selectedMode];

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get phase instruction text
  const getPhaseInstruction = () => {
    switch (currentPhase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'holdAfter': return 'Hold';
      case 'humming': return 'Hum as you exhale';
      case 'farGaze': return 'Look into the distance';
      case 'sigh': return 'Double inhale, long exhale';
      default: return 'Get Ready';
    }
  };

  // Get phase color
  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'inhale': return 'from-blue-400 to-blue-600';
      case 'hold':
      case 'holdAfter': return 'from-purple-400 to-purple-600';
      case 'exhale': return 'from-green-400 to-green-600';
      case 'humming': return 'from-amber-400 to-orange-500';
      case 'farGaze': return 'from-cyan-400 to-teal-500';
      case 'sigh': return 'from-indigo-400 to-indigo-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  // Physiological sigh pattern
  const runPhysiologicalSigh = useCallback(() => {
    let sighCount = 0;
    const totalSighs = currentMode.pattern.sighs;

    const performSigh = () => {
      if (sighCount >= totalSighs || !isRunning) {
        // Move to far gaze
        setCurrentPhase('farGaze');
        setPhaseTimer(currentMode.pattern.farGazeDuration);
        setTimeout(() => {
          if (isRunning) {
            setIsRunning(false);
            setShowPostSession(true);
          }
        }, currentMode.pattern.farGazeDuration * 1000);
        return;
      }

      setCurrentPhase('sigh');
      setCycleCount(sighCount + 1);
      sighCount++;

      // Each sigh takes about 8 seconds (double inhale 3s, long exhale 5s)
      setTimeout(() => {
        if (isRunning) performSigh();
      }, 8000);
    };

    performSigh();
  }, [currentMode, isRunning]);

  // Box breathing pattern
  const runBoxBreathing = useCallback(() => {
    let cycle = 0;
    const { inhale, hold, exhale, holdAfter, cycles } = currentMode.pattern;

    const runCycle = () => {
      if (cycle >= cycles || !isRunning) {
        setIsRunning(false);
        setShowPostSession(true);
        return;
      }

      setCycleCount(cycle + 1);

      // Inhale
      setCurrentPhase('inhale');
      setPhaseTimer(inhale);

      setTimeout(() => {
        if (!isRunning) return;
        // Hold
        setCurrentPhase('hold');
        setPhaseTimer(hold);

        setTimeout(() => {
          if (!isRunning) return;
          // Exhale
          setCurrentPhase('exhale');
          setPhaseTimer(exhale);

          setTimeout(() => {
            if (!isRunning) return;
            // Hold after
            setCurrentPhase('holdAfter');
            setPhaseTimer(holdAfter);

            setTimeout(() => {
              cycle++;
              if (isRunning) runCycle();
            }, holdAfter * 1000);
          }, exhale * 1000);
        }, hold * 1000);
      }, inhale * 1000);
    };

    runCycle();
  }, [currentMode, isRunning]);

  // Extended exhale pattern (not used now but kept for reference)
  const runExtendedExhale = useCallback(() => {
    let cycle = 0;
    const { inhale, exhale, cycles, hummingLastMinute } = currentMode.pattern;
    const hummingStartCycle = cycles - 6;

    const runCycle = () => {
      if (cycle >= cycles || !isRunning) {
        setIsRunning(false);
        setShowPostSession(true);
        return;
      }

      setCycleCount(cycle + 1);
      const isHumming = hummingLastMinute && cycle >= hummingStartCycle;

      setCurrentPhase('inhale');
      setPhaseTimer(inhale);

      setTimeout(() => {
        if (!isRunning) return;
        setCurrentPhase(isHumming ? 'humming' : 'exhale');
        setPhaseTimer(exhale);

        setTimeout(() => {
          cycle++;
          if (isRunning) runCycle();
        }, exhale * 1000);
      }, inhale * 1000);
    };

    runCycle();
  }, [currentMode, isRunning]);

  // 4-7-8 Breathing pattern
  const run478Breathing = useCallback(() => {
    let cycle = 0;
    const { inhale, hold, exhale, cycles } = currentMode.pattern;

    const runCycle = () => {
      if (cycle >= cycles || !isRunning) {
        setIsRunning(false);
        setShowPostSession(true);
        return;
      }

      setCycleCount(cycle + 1);

      // Inhale for 4 seconds
      setCurrentPhase('inhale');
      setPhaseTimer(inhale);

      setTimeout(() => {
        if (!isRunning) return;
        // Hold for 7 seconds
        setCurrentPhase('hold');
        setPhaseTimer(hold);

        setTimeout(() => {
          if (!isRunning) return;
          // Exhale for 8 seconds
          setCurrentPhase('exhale');
          setPhaseTimer(exhale);

          setTimeout(() => {
            cycle++;
            if (isRunning) runCycle();
          }, exhale * 1000);
        }, hold * 1000);
      }, inhale * 1000);
    };

    runCycle();
  }, [currentMode, isRunning]);

  // Bhramari (Bee Breathing) pattern
  const runBhramari = useCallback(() => {
    let cycle = 0;
    const { inhale, humming, cycles } = currentMode.pattern;

    const runCycle = () => {
      if (cycle >= cycles || !isRunning) {
        setIsRunning(false);
        setShowPostSession(true);
        return;
      }

      setCycleCount(cycle + 1);

      // Inhale
      setCurrentPhase('inhale');
      setPhaseTimer(inhale);

      setTimeout(() => {
        if (!isRunning) return;
        // Humming exhale
        setCurrentPhase('humming');
        setPhaseTimer(humming);

        setTimeout(() => {
          cycle++;
          if (isRunning) runCycle();
        }, humming * 1000);
      }, inhale * 1000);
    };

    runCycle();
  }, [currentMode, isRunning]);

  // Custom breathing pattern
  const runCustomBreathing = useCallback(() => {
    let cycle = 0;
    const { inhale, hold1, exhale, hold2 } = customBreath;
    const totalCycleTime = inhale + hold1 + exhale + hold2;
    const duration = modeConfigs['custom'].duration;
    const cycles = Math.floor(duration / totalCycleTime) || 8;

    const runCycle = () => {
      if (cycle >= cycles || !isRunning) {
        setIsRunning(false);
        setShowPostSession(true);
        return;
      }

      setCycleCount(cycle + 1);

      // Inhale
      setCurrentPhase('inhale');
      setPhaseTimer(inhale);

      setTimeout(() => {
        if (!isRunning) return;
        // Hold after inhale
        if (hold1 > 0) {
          setCurrentPhase('hold');
          setPhaseTimer(hold1);
          setTimeout(() => {
            if (!isRunning) return;
            // Exhale
            setCurrentPhase('exhale');
            setPhaseTimer(exhale);

            setTimeout(() => {
              if (!isRunning) return;
              // Hold after exhale
              if (hold2 > 0) {
                setCurrentPhase('holdAfter');
                setPhaseTimer(hold2);
                setTimeout(() => {
                  cycle++;
                  if (isRunning) runCycle();
                }, hold2 * 1000);
              } else {
                cycle++;
                if (isRunning) runCycle();
              }
            }, exhale * 1000);
          }, hold1 * 1000);
        } else {
          // Skip hold1 if 0
          setCurrentPhase('exhale');
          setPhaseTimer(exhale);

          setTimeout(() => {
            if (!isRunning) return;
            if (hold2 > 0) {
              setCurrentPhase('holdAfter');
              setPhaseTimer(hold2);
              setTimeout(() => {
                cycle++;
                if (isRunning) runCycle();
              }, hold2 * 1000);
            } else {
              cycle++;
              if (isRunning) runCycle();
            }
          }, exhale * 1000);
        }
      }, inhale * 1000);
    };

    runCycle();
  }, [customBreath, isRunning]);

  // Start the session
  const startSession = () => {
    setIsRunning(true);
    setIsPaused(false);
    setTimeRemaining(currentMode.duration);
    setCycleCount(0);
    setShowPostSession(false);

    // Start main timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start breathing pattern based on mode
    setTimeout(() => {
      switch (currentMode.pattern.type) {
        case '478':
          run478Breathing();
          break;
        case 'physiological-sigh':
          runPhysiologicalSigh();
          break;
        case 'bhramari':
          runBhramari();
          break;
        case 'box':
          runBoxBreathing();
          break;
        case 'extended-exhale':
          runExtendedExhale();
          break;
        case 'custom':
          runCustomBreathing();
          break;
      }
    }, 100);
  };

  // Pause/Resume
  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      // Resume timer
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setIsPaused(true);
      clearInterval(timerRef.current);
    }
  };

  // Reset
  const resetSession = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(currentMode.duration);
    setCurrentPhase('ready');
    setCycleCount(0);
    setShowPostSession(false);
    clearInterval(timerRef.current);
    clearTimeout(phaseRef.current);
  };

  // Log session to database
  const logSession = async () => {
    setIsLogging(true);
    try {
      const sessionData = {
        patient_email: user?.email?.toLowerCase(),
        notes: JSON.stringify({
          mode: selectedMode,
          mode_name: currentMode.instruction,
          duration_seconds: currentMode.duration,
          completed: true,
          pre_stress: preSession.stress,
          pre_calm: preSession.calm,
          pre_focus: preSession.focus,
          post_stress: postSession.stress,
          post_calm: postSession.calm,
          post_focus: postSession.focus,
          delta_stress: preSession.stress - postSession.stress,
          delta_calm: postSession.calm - preSession.calm,
          delta_focus: postSession.focus - preSession.focus,
          user_notes: notes || null
        }),
        session_date: new Date().toISOString().split('T')[0]
      };

      const { error } = await supabase.from('ans_sessions').insert(sessionData);

      if (error) {
        console.error('Error saving ANS session:', error);
        toast.error('Failed to save session. Please try again.');
      } else {
        toast.success('Session logged successfully!');
        // Refresh progress data
        await fetchProgress();
        // Reset for next session
        setShowPostSession(false);
        setNotes('');
        setPreSession({ stress: 5, calm: 5, focus: 5 });
        setPostSession({ stress: 5, calm: 5, focus: 5 });
        resetSession();
      }
    } catch (error) {
      console.error('Error logging session:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(phaseRef.current);
    };
  }, []);

  // Update time when mode changes and reset video
  useEffect(() => {
    if (!isRunning) {
      setTimeRemaining(currentMode.duration);
      setCountdown(null);
      // Reset video when mode changes
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [selectedMode, currentMode.duration, isRunning]);

  // Pause video when session ends
  useEffect(() => {
    if (showPostSession && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [showPostSession]);

  // Custom breathing sine wave animation - only runs when session is active
  useEffect(() => {
    if (selectedMode !== 'custom' || !isRunning) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let progress = 0;
    const totalCycleTime = (customBreath.inhale + customBreath.hold1 + customBreath.exhale + customBreath.hold2) * 60;

    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        // Canvas not ready yet, try again next frame
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Calculate current phase based on progress
      const cycleProgress = progress % totalCycleTime;
      const inhaleFrames = customBreath.inhale * 60;
      const hold1Frames = customBreath.hold1 * 60;
      const exhaleFrames = customBreath.exhale * 60;

      let currentPhase = 'inhale';
      if (cycleProgress < inhaleFrames) {
        currentPhase = 'inhale';
      } else if (cycleProgress < inhaleFrames + hold1Frames) {
        currentPhase = 'hold1';
      } else if (cycleProgress < inhaleFrames + hold1Frames + exhaleFrames) {
        currentPhase = 'exhale';
      } else {
        currentPhase = 'hold2';
      }
      setWavePhase(currentPhase);

      const padding = 15;
      const topY = padding;
      const bottomY = height - padding;
      const centerX = width / 2;

      // Draw simple V-shape wave
      ctx.beginPath();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Left flat line
      ctx.moveTo(padding, topY);
      ctx.lineTo(centerX - 60, topY);

      // V curve down and up
      ctx.quadraticCurveTo(centerX - 30, topY, centerX, bottomY);
      ctx.quadraticCurveTo(centerX + 30, topY, centerX + 60, topY);

      // Right flat line
      ctx.lineTo(width - padding, topY);

      ctx.stroke();

      // Calculate dot position based on progress in cycle
      const dotProgress = (progress % totalCycleTime) / totalCycleTime;
      let dotX, dotY;

      const totalTime = customBreath.inhale + customBreath.hold1 + customBreath.exhale + customBreath.hold2;
      const inhaleRatio = customBreath.inhale / totalTime;
      const hold1Ratio = customBreath.hold1 / totalTime;
      const exhaleRatio = customBreath.exhale / totalTime;

      if (dotProgress < inhaleRatio / 2) {
        // First half of inhale - moving on left flat
        const t = dotProgress / (inhaleRatio / 2);
        dotX = padding + t * (centerX - 60 - padding);
        dotY = topY;
      } else if (dotProgress < inhaleRatio) {
        // Second half - curve down
        const t = (dotProgress - inhaleRatio / 2) / (inhaleRatio / 2);
        const p0x = centerX - 60, p0y = topY;
        const p1x = centerX - 30, p1y = topY;
        const p2x = centerX, p2y = bottomY;
        dotX = (1-t)*(1-t)*p0x + 2*(1-t)*t*p1x + t*t*p2x;
        dotY = (1-t)*(1-t)*p0y + 2*(1-t)*t*p1y + t*t*p2y;
      } else if (dotProgress < inhaleRatio + hold1Ratio) {
        // Hold at bottom
        dotX = centerX;
        dotY = bottomY;
      } else if (dotProgress < inhaleRatio + hold1Ratio + exhaleRatio) {
        // Exhale - curve up
        const t = (dotProgress - inhaleRatio - hold1Ratio) / exhaleRatio;
        const p0x = centerX, p0y = bottomY;
        const p1x = centerX + 30, p1y = topY;
        const p2x = centerX + 60, p2y = topY;
        dotX = (1-t)*(1-t)*p0x + 2*(1-t)*t*p1x + t*t*p2x;
        dotY = (1-t)*(1-t)*p0y + 2*(1-t)*t*p1y + t*t*p2y;
      } else {
        // Hold 2 - moving on right flat
        const t = (dotProgress - inhaleRatio - hold1Ratio - exhaleRatio) / (customBreath.hold2 / totalTime || 0.001);
        dotX = centerX + 60 + t * (width - padding - centerX - 60);
        dotY = topY;
      }

      // Draw white dot
      ctx.beginPath();
      ctx.fillStyle = 'white';
      ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
      ctx.fill();

      progress++;
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation with small delay to ensure canvas is mounted
    const timeoutId = setTimeout(() => {
      animate();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [selectedMode, isRunning, customBreath]);

  // Static wave preview for custom breathing (before starting)
  useEffect(() => {
    if (selectedMode !== 'custom' || isRunning) return;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const padding = 20;
    const topY = padding + 10;
    const bottomY = height - padding - 10;
    const centerX = width / 2;

    // Calculate wave shape based on breath timings
    const totalTime = customBreath.inhale + customBreath.hold1 + customBreath.exhale + customBreath.hold2;
    const inhaleWidth = (customBreath.inhale / totalTime) * (width - padding * 2) * 0.4;
    const exhaleWidth = (customBreath.exhale / totalTime) * (width - padding * 2) * 0.4;

    // Draw V-shape wave
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Left flat line (hold before inhale)
    ctx.moveTo(padding, topY);
    ctx.lineTo(centerX - inhaleWidth, topY);

    // Curve down (exhale visualization) and up (inhale visualization)
    ctx.quadraticCurveTo(centerX - inhaleWidth * 0.3, topY, centerX, bottomY);
    ctx.quadraticCurveTo(centerX + exhaleWidth * 0.3, topY, centerX + exhaleWidth, topY);

    // Right flat line (hold after exhale)
    ctx.lineTo(width - padding, topY);

    ctx.stroke();

    // Draw a static dot at the start
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.arc(padding + 5, topY, 5, 0, Math.PI * 2);
    ctx.fill();

  }, [selectedMode, isRunning, customBreath]);

  // Slider component
  const Slider = ({ label, value, onChange, color = 'blue' }) => {
    const colorClasses = {
      red: 'text-red-600 dark:text-red-400',
      green: 'text-green-600 dark:text-green-400',
      blue: 'text-blue-600 dark:text-blue-400'
    };

    const colorHex = {
      red: '#ef4444',
      green: '#22c55e',
      blue: '#3b82f6'
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className={`text-lg font-bold ${colorClasses[color]}`}>{value}</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onChange(Math.max(0, value - 1))}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Minus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex-1 relative">
            <input
              type="range"
              min="0"
              max="10"
              value={value}
              onChange={(e) => onChange(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${colorHex[color]} 0%, ${colorHex[color]} ${value * 10}%, #e5e7eb ${value * 10}%, #e5e7eb 100%)`
              }}
            />
          </div>
          <button
            onClick={() => onChange(Math.min(10, value + 1))}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    );
  };

  // Sparkline component
  const Sparkline = ({ data }) => {
    const max = Math.max(...data);
    const hasData = data.some(v => v > 0);

    // If no data, show dashed placeholder
    if (!hasData) {
      return (
        <div className="flex items-center justify-center h-8">
          <div className="flex space-x-1">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"
              />
            ))}
          </div>
        </div>
      );
    }

    const min = Math.min(...data);
    const range = max - min || 1;

    return (
      <div className="flex items-end justify-center space-x-1 h-8">
        {data.map((value, index) => (
          <div
            key={index}
            className="w-2 bg-gradient-to-t from-[#323956] to-[#CAE0FF] rounded-t transition-all"
            style={{ height: `${Math.max(15, ((value - min) / range) * 100)}%` }}
            title={`Day ${index + 1}: ${value} session${value !== 1 ? 's' : ''}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] text-white">
        <div className="max-w-4xl px-3 sm:px-6 py-4 sm:py-6">
          <button
            onClick={() => navigate('/dashboard/welcome')}
            className="flex items-center space-x-2 text-blue-200 hover:text-white mb-3 sm:mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-2.5 sm:space-x-4">
            <div className="bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 flex-shrink-0">
              <Wind className="h-5 w-5 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-bold">Breath Reset Protocol</h1>
              <p className="text-blue-200 text-[11px] sm:text-sm">Autonomic Nervous System Reset Protocol</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Technique Selector - Original Cards - HIDDEN */}
        {false && (<div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Choose Breathing Technique</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {Object.entries(modeConfigs).filter(([key]) => key !== 'custom').map(([key, config]) => (
              <div key={key} className="relative">
                <button
                  onClick={() => !isRunning && setSelectedMode(key)}
                  disabled={isRunning}
                  className={`w-full h-full p-2.5 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all text-left flex flex-col ${
                    selectedMode === key
                      ? 'border-[#323956] bg-[#E4EFFF] dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 pr-5 sm:pr-6">
                    <span className="text-lg sm:text-2xl flex-shrink-0 w-6 sm:w-8 text-center">{config.icon}</span>
                    <span className="text-[11px] sm:text-sm font-bold text-gray-900 dark:text-white leading-tight">{config.name}</span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-2 flex-1 min-h-[28px] sm:min-h-[32px]">{config.description}</div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400 flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs text-gray-400">{Math.floor(config.duration / 60)} min</span>
                  </div>
                </button>
                {/* How to Do button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHowToModal(key);
                  }}
                  className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1 sm:p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="How to do"
                >
                  <Info className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg text-center" style={{ backgroundColor: `${currentMode.color}15` }}>
            <p className="text-xs sm:text-sm font-medium" style={{ color: currentMode.color }}>
              {currentMode.instruction}: {
                selectedMode === 'custom'
                  ? `Inhale ${customBreath.inhale}s → Hold ${customBreath.hold1}s → Exhale ${customBreath.exhale}s → Hold ${customBreath.hold2}s`
                  : currentMode.description
              }
            </p>
          </div>
        </div>)}

        {/* OXA Style - Goal Selection & Visualization Panel - HIDDEN */}
        {false && (
        <div className="bg-[#1a1f2e] dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Side - Goal Selection */}
            <div className="p-3 sm:p-6 lg:p-8">
              <h2 className="text-sm sm:text-lg font-semibold text-white mb-3 sm:mb-6">Select your goal:</h2>

              <div className="space-y-2.5 sm:space-y-4">
                {(protocolGoals[selectedMode] || protocolGoals['478']).map((goalLabel, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
                    onClick={() => setSelectedGoal(goalLabel)}
                  >
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      selectedGoal === goalLabel
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-gray-500 group-hover:border-gray-400'
                    }`}>
                      {selectedGoal === goalLabel && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />}
                    </div>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-white font-medium text-xs sm:text-base">{goalLabel}</span>
                  </label>
                ))}
              </div>

              {/* Custom breathing controls - Show when custom mode selected */}
              {selectedMode === 'custom' ? (
                <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-5">
                  {/* Customize your breath heading */}
                  <h3 className="text-white font-semibold text-base sm:text-lg">Customize your breath</h3>

                  {/* Inhale Slider */}
                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium">Inhale</label>
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-700 text-white px-3 py-2 rounded-lg min-w-[50px] text-center font-semibold">
                        {customBreath.inhale}
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={customBreath.inhale}
                        onChange={(e) => setCustomBreath(prev => ({ ...prev, inhale: parseInt(e.target.value) }))}
                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>
                  </div>

                  {/* Hold (after inhale) Slider */}
                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium">Hold</label>
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-700 text-white px-3 py-2 rounded-lg min-w-[50px] text-center font-semibold">
                        {customBreath.hold1}
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={customBreath.hold1}
                        onChange={(e) => setCustomBreath(prev => ({ ...prev, hold1: parseInt(e.target.value) }))}
                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>
                  </div>

                  {/* Exhale Slider */}
                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium">Exhale</label>
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-700 text-white px-3 py-2 rounded-lg min-w-[50px] text-center font-semibold">
                        {customBreath.exhale}
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={customBreath.exhale}
                        onChange={(e) => setCustomBreath(prev => ({ ...prev, exhale: parseInt(e.target.value) }))}
                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>
                  </div>

                  {/* Hold (after exhale) Slider */}
                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium">Hold</label>
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-700 text-white px-3 py-2 rounded-lg min-w-[50px] text-center font-semibold">
                        {customBreath.hold2}
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={customBreath.hold2}
                        onChange={(e) => setCustomBreath(prev => ({ ...prev, hold2: parseInt(e.target.value) }))}
                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Selected technique info - for non-custom modes */
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/5 rounded-lg sm:rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{currentMode.icon}</span>
                    <span className="text-white font-semibold">{currentMode.name}</span>
                  </div>
                  <p className="text-gray-400 text-sm">{currentMode.description}</p>
                  <button
                    onClick={() => setShowHowToModal(selectedMode)}
                    className="mt-3 text-orange-400 text-sm hover:text-orange-300 transition-colors flex items-center gap-1"
                  >
                    <Info className="h-4 w-4" />
                    How to do this technique
                  </button>
                </div>
              )}
            </div>

            {/* Right Side - Video Player Panel */}
            <div className="bg-[#0d1117] flex flex-col min-h-[250px] sm:min-h-[400px] lg:min-h-[450px]">
              {selectedGoal === 'Yogic Breathing' ? (
                /* ===== GAMIFIED YOGIC BREATHING SESSION ===== */
                <div className="flex-1 relative bg-black flex flex-col items-center justify-center overflow-hidden p-4 sm:p-6">

                  {/* Screen 1: Tips & Instructions */}
                  {yogicPhase === 'tips' && (
                    <div className="flex flex-col items-center w-full max-w-sm">
                      {/* Tip box */}
                      <div className="w-full bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6">
                        <p className="text-orange-400 text-xs font-semibold uppercase tracking-wider mb-1">Tip</p>
                        <p className="text-white text-sm">Relax your face, shoulders, and neck</p>
                      </div>

                      {/* Instructions */}
                      <div className="w-full space-y-3 mb-8">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                          <p className="text-gray-300 text-sm">Breathe slowly through your nose</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                          <p className="text-gray-300 text-sm">Sit or lie down in a comfortable position</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                          <p className="text-gray-300 text-sm">Follow the on-screen guide</p>
                        </div>
                      </div>

                      {/* Begin Session button */}
                      <button
                        onClick={() => {
                          setYogicPhase('countdown');
                          setYogicTimer(5);
                        }}
                        className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:scale-105"
                      >
                        Begin Session
                      </button>
                    </div>
                  )}

                  {/* Screen 2: Countdown */}
                  {yogicPhase === 'countdown' && (
                    <div className="flex flex-col items-center">
                      <p className="text-gray-400 text-sm mb-4">Your session starts in</p>
                      <div className="text-6xl sm:text-8xl font-bold text-white mb-2 tabular-nums">{yogicTimer}</div>
                      <p className="text-gray-500 text-sm">seconds</p>
                    </div>
                  )}

                  {/* Screen 3: Breathing Animation */}
                  {yogicPhase === 'breathing' && (
                    <div className="flex flex-col items-center w-full">
                      {/* Animated breathing circle */}
                      <div className="relative flex items-center justify-center mb-6" style={{ width: 200, height: 200 }}>
                        {/* Outer glow ring */}
                        <div
                          className="absolute rounded-full transition-transform duration-1000 ease-in-out"
                          style={{
                            width: 200,
                            height: 200,
                            background: `radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)`,
                            transform: `scale(${0.4 + breathScale * 0.6})`,
                          }}
                        />
                        {/* Main circle */}
                        <div
                          className="absolute rounded-full border-2 border-orange-500/60 transition-transform duration-1000 ease-in-out"
                          style={{
                            width: 160,
                            height: 160,
                            background: `radial-gradient(circle, rgba(249,115,22,0.25) 0%, rgba(249,115,22,0.05) 100%)`,
                            transform: `scale(${0.4 + breathScale * 0.6})`,
                          }}
                        />
                        {/* Inner circle with timer */}
                        <div
                          className="relative z-10 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center transition-transform duration-1000 ease-in-out"
                          style={{
                            width: 100,
                            height: 100,
                            transform: `scale(${0.5 + breathScale * 0.5})`,
                          }}
                        >
                          <span className="text-3xl font-bold text-white tabular-nums">{yogicTimer}</span>
                        </div>
                      </div>

                      {/* Phase label */}
                      <p className="text-orange-400 text-xl font-semibold mb-2 animate-pulse">
                        {yogicBreathPhase === 'inhale' ? 'Inhale...' : 'Exhale...'}
                      </p>

                      {/* Breathing flow text */}
                      <p className="text-gray-400 text-sm mb-4">
                        {yogicBreathPhase === 'inhale'
                          ? 'Belly \u2192 Ribcage \u2192 Collarbones'
                          : 'Collarbones \u2192 Ribcage \u2192 Belly'}
                      </p>

                      {/* Cycle indicator */}
                      <div className="flex items-center gap-2">
                        {[1, 2, 3].map(c => (
                          <div
                            key={c}
                            className={`w-3 h-3 rounded-full transition-colors ${
                              c < yogicCycle ? 'bg-orange-500' : c === yogicCycle ? 'bg-orange-400 animate-pulse' : 'bg-gray-600'
                            }`}
                          />
                        ))}
                        <span className="text-gray-500 text-xs ml-2">Cycle {yogicCycle} of 3</span>
                      </div>
                    </div>
                  )}

                  {/* Screen 4: Complete */}
                  {yogicPhase === 'complete' && (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-green-400" />
                      </div>
                      <h3 className="text-white text-xl sm:text-2xl font-bold mb-2">Session Complete!</h3>
                      <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">You completed 3 breathing cycles</p>
                      <button
                        onClick={() => {
                          setYogicPhase('tips');
                          setYogicCycle(1);
                          setYogicBreathPhase('inhale');
                          setYogicTimer(0);
                          setBreathScale(0);
                        }}
                        className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:scale-105"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ===== ORIGINAL VIDEO / PLAY BUTTON PANEL ===== */
                <>
                  {/* Video Area with Play Button */}
                  <div className="flex-1 relative bg-black flex flex-col items-center justify-center overflow-hidden">
                    {/* Video Element (hidden until playing) */}
                    {currentMode.videoUrl && (
                      <video
                        ref={videoRef}
                        src={currentMode.videoUrl}
                        className={`absolute inset-0 w-full h-full object-cover ${isRunning ? 'block' : 'hidden'}`}
                        loop
                        playsInline
                      />
                    )}

                    {/* Custom Breathing Wave Animation Canvas - Only shows when running */}
                    {selectedMode === 'custom' && isRunning && (
                      <div className="absolute top-4 left-0 right-0 z-20 flex justify-center pointer-events-none">
                        <canvas
                          ref={canvasRef}
                          width={300}
                          height={120}
                          className="max-w-full"
                        />
                      </div>
                    )}

                    {/* Overlay Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center text-center p-4 sm:p-6">
                      {countdown !== null ? (
                        <>
                          <p className="text-gray-400 text-xs sm:text-sm mb-2">Your session starts in</p>
                          <div className="text-5xl sm:text-6xl font-bold text-white mb-1">{countdown}</div>
                          <p className="text-gray-500 text-xs sm:text-sm">seconds</p>
                        </>
                      ) : isRunning ? (
                        <>
                          {/* For custom breathing, show wave animation content */}
                          {selectedMode === 'custom' ? (
                            <>
                              <div className="mt-16"></div>
                              <div className="text-4xl sm:text-5xl font-mono font-bold text-white mb-3">{formatTime(timeRemaining)}</div>
                              <div className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
                                Cycle: <span className="text-white font-bold">{cycleCount}</span>
                                {currentMode.pattern.cycles && <span> / {currentMode.pattern.cycles}</span>}
                              </div>
                              {/* Phase labels */}
                              <div className="flex items-center justify-center gap-3 sm:gap-6">
                                <span className={`text-sm font-medium transition-all duration-300 ${wavePhase === 'inhale' ? 'text-orange-500 scale-110' : 'text-gray-500'}`}>
                                  Inhale
                                </span>
                                <span className={`text-sm font-medium transition-all duration-300 ${wavePhase === 'hold1' ? 'text-orange-500 scale-110' : 'text-gray-500'}`}>
                                  Hold
                                </span>
                                <span className={`text-sm font-medium transition-all duration-300 ${wavePhase === 'exhale' ? 'text-orange-500 scale-110' : 'text-gray-500'}`}>
                                  Exhale
                                </span>
                                <span className={`text-sm font-medium transition-all duration-300 ${wavePhase === 'hold2' ? 'text-orange-500 scale-110' : 'text-gray-500'}`}>
                                  Hold
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-orange-400 text-lg sm:text-xl mb-3 animate-pulse font-medium">{getPhaseInstruction()}</div>
                              <div className="text-4xl sm:text-5xl font-mono font-bold text-white mb-3">{formatTime(timeRemaining)}</div>
                              <div className="text-gray-400 text-xs sm:text-sm">
                                Cycle: <span className="text-white font-bold">{cycleCount}</span>
                                {currentMode.pattern.cycles && <span> / {currentMode.pattern.cycles}</span>}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Static Wave Preview for Custom Breathing */}
                          {selectedMode === 'custom' && (
                            <div className="absolute top-8 left-0 right-0 z-20 flex justify-center pointer-events-none">
                              <canvas
                                ref={previewCanvasRef}
                                width={280}
                                height={100}
                                className="max-w-full"
                              />
                            </div>
                          )}
                          {/* Play Button Circle */}
                          <button
                            onClick={() => {
                              // Start countdown
                              setCountdown(5);
                              let count = 5;
                              const countdownInterval = setInterval(() => {
                                count--;
                                if (count <= 0) {
                                  clearInterval(countdownInterval);
                                  setCountdown(null);
                                  startSession();
                                  if (videoRef.current) {
                                    videoRef.current.play();
                                  }
                                } else {
                                  setCountdown(count);
                                }
                              }, 1000);
                            }}
                            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-all shadow-lg hover:scale-105 mb-3 sm:mb-4 ${selectedMode === 'custom' ? 'mt-12' : ''}`}
                          >
                            <Play className="h-8 w-8 sm:h-10 sm:w-10 text-white ml-1" fill="white" />
                          </button>
                          <p className="text-white text-base sm:text-lg font-medium">Start exercise</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Video Controls Bar */}
                  <div className="bg-[#0d1117] px-2 sm:px-4 py-2 sm:py-3 border-t border-gray-800">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      {/* Play/Pause Button */}
                      <button
                        onClick={() => {
                          if (!isRunning) {
                            setCountdown(5);
                            let count = 5;
                            const countdownInterval = setInterval(() => {
                              count--;
                              if (count <= 0) {
                                clearInterval(countdownInterval);
                                setCountdown(null);
                                startSession();
                                if (videoRef.current) videoRef.current.play();
                              } else {
                                setCountdown(count);
                              }
                            }, 1000);
                          } else {
                            togglePause();
                            if (videoRef.current) {
                              if (isPaused) videoRef.current.play();
                              else videoRef.current.pause();
                            }
                          }
                        }}
                        className="text-white hover:text-orange-400 transition-colors"
                      >
                        {!isRunning || isPaused ? (
                          <Play className="h-5 w-5" fill="currentColor" />
                        ) : (
                          <Pause className="h-5 w-5" fill="currentColor" />
                        )}
                      </button>

                      {/* Time Display */}
                      <span className="text-gray-400 text-[10px] sm:text-sm font-mono min-w-[70px] sm:min-w-[90px]">
                        {isRunning ? formatTime(currentMode.duration - timeRemaining) : '00:00'} / {formatTime(currentMode.duration)}
                      </span>

                      {/* Progress Bar */}
                      <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden cursor-pointer">
                        <div
                          className="h-full bg-white transition-all duration-1000"
                          style={{ width: `${((currentMode.duration - timeRemaining) / currentMode.duration) * 100}%` }}
                        />
                      </div>

                      {/* Volume Button */}
                      <button className="text-white hover:text-orange-400 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                      </button>

                      {/* Fullscreen Button */}
                      <button className="text-white hover:text-orange-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </button>

                      {/* More Options */}
                      <button className="text-white hover:text-orange-400 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>)}

        {/* ===== REUSABLE VIDEO CAROUSEL SECTIONS ===== */}
        {[
          {
            id: 'breathing-scroll',
            title: 'Neuro-Breathing',
            icon: '🌬️',
            subtitle: '12 guided pranayama exercises for brain optimization',
            videos: [
              { name: 'Yogic Breathing', url: 'https://www.youtube.com/embed/u3KzhRZruI4' },
              { name: 'Bahya Kumbhaka Pranayama', url: 'https://www.youtube.com/embed/Yn08s9ayDrI' },
              { name: 'Ujjayi Breath Pranayama', url: 'https://www.youtube.com/embed/_FPB0rIWhks' },
              { name: 'Antara Kumbhaka Pranayama', url: 'https://www.youtube.com/embed/q0b7HWjV34U' },
              { name: 'Chandra Bhedi Pranayama', url: 'https://www.youtube.com/embed/6PIti8EXp-8' },
              { name: 'Box Breathing', url: 'https://www.youtube.com/embed/dCTyR_ctBCw' },
              { name: '4-7-8 Breathing', url: 'https://www.youtube.com/embed/D_dAD0v1Xhk' },
              { name: 'Cyclic Sigh Breathing', url: 'https://www.youtube.com/embed/zoGeWD-VbDM' },
              { name: 'Kapalbhati Pranayama', url: 'https://www.youtube.com/embed/-H09m4WmMfs' },
              { name: 'Anulom Vilom Pranayama', url: 'https://www.youtube.com/embed/ThwZunO-G0g' },
              { name: 'Bhramari Pranayama', url: 'https://www.youtube.com/embed/HFii9LyX62Y' },
              { name: 'Bhastrika Pranayama', url: 'https://www.youtube.com/embed/C1gUTcn3UpY' }
            ]
          },
          {
            id: 'exercise-scroll',
            title: 'Neuro-Exercise',
            icon: '🧘',
            subtitle: '12 yoga asana videos for brain health',
            videos: [
              { name: 'Marjaryasana', url: 'https://www.youtube.com/embed/RByueJq1Hc4' },
              { name: 'Padahastasana', url: 'https://www.youtube.com/embed/2cxGhZU09PE' },
              { name: 'Ushtrasana', url: 'https://www.youtube.com/embed/CP3xBoIQGQU' },
              { name: 'Vakrasana', url: 'https://www.youtube.com/embed/iyILI9Z837A' },
              { name: 'Janushirshasana', url: 'https://www.youtube.com/embed/7Wm0w5k7qq0' },
              { name: 'Surya Namaskar', url: 'https://www.youtube.com/embed/av0kGdQxW_0' },
              { name: 'Saral Matsyasana', url: 'https://www.youtube.com/embed/SsuxBsQ5I34' },
              { name: 'Tadasana', url: 'https://www.youtube.com/embed/ibIEOBQGvxQ' },
              { name: 'Setubandhasana', url: 'https://www.youtube.com/embed/uz57iy_S3hg' },
              { name: 'Balasana', url: 'https://www.youtube.com/embed/uteb420ZZ-o' },
              { name: 'Viparita Karani', url: 'https://www.youtube.com/embed/P4jcF_1eqpI' },
              { name: 'Vrikshasana', url: 'https://www.youtube.com/embed/c7bNHGkqqms' }
            ]
          },
          {
            id: 'chants-scroll',
            title: 'Neuro-Chants',
            icon: '🙏',
            subtitle: 'Short audio chants for brain activation',
            videos: [
              { name: 'Aim Beej Mantra', url: getFrequencyMediaUrl('Aim Beejmantra.mp4'), color: 'from-orange-400 to-red-500', isAudio: true },
              { name: 'Ar Ra Pa Ca Na Dhi', url: getFrequencyMediaUrl('ArRaPaCaNaDhi..mp4'), color: 'from-yellow-400 to-orange-500', isAudio: true },
              { name: 'Aum Beej Mantra', url: getFrequencyMediaUrl('Aum BeejMantra.mp4'), color: 'from-purple-500 to-indigo-600', isAudio: true },
              { name: 'Aum Gang Ganpataye Namah', url: getFrequencyMediaUrl('AumGangGanpataye Namah.mp4'), color: 'from-red-500 to-orange-600', isAudio: true },
              { name: 'Bhramari Breath', url: getFrequencyMediaUrl('Bharamar.mp4'), color: 'from-blue-400 to-blue-600', isAudio: true },
              { name: 'Gang Beej Mantra', url: getFrequencyMediaUrl('Gang BeejMantra.mp4'), color: 'from-orange-500 to-yellow-600', isAudio: true },
              { name: 'Mahamrityunjaya Mantra', url: getFrequencyMediaUrl('MahaMrutyunjay Mantra.mp4'), color: 'from-blue-600 to-indigo-800', isAudio: true },
              { name: 'Maheshwar Sutrani', url: getFrequencyMediaUrl('Maheshwar Sutrani.mp4'), color: 'from-gray-600 to-gray-800', isAudio: true },
              { name: 'Saraswati Mantra', url: getFrequencyMediaUrl('Saraswati Mantra.mp4'), color: 'from-teal-400 to-emerald-600', isAudio: true },
              { name: 'Shree Dhanvantari Mantra', url: getFrequencyMediaUrl('Shree DHanvantari Mnatra.mp4'), color: 'from-green-500 to-green-700', isAudio: true },
              { name: 'Sohum Meditation', url: getFrequencyMediaUrl('Sohum.mp4'), color: 'from-blue-300 to-blue-500', isAudio: true },
              { name: 'Vam Beej Mantra', url: getFrequencyMediaUrl('Vam Beejmantra.mp4'), color: 'from-cyan-400 to-blue-600', isAudio: true }
            ]
          }
        ].map((section) => (
          <div key={section.id} className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            {/* Header with scroll arrows */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-2xl">{section.icon}</span> {section.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{section.subtitle}</p>
              </div>
              {section.videos.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { const el = document.getElementById(section.id); if (el) el.scrollBy({ left: -380, behavior: 'smooth' }); }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 transition-all"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => { const el = document.getElementById(section.id); if (el) el.scrollBy({ left: 380, behavior: 'smooth' }); }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 transition-all"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable cards */}
            <div id={section.id} className="flex overflow-x-auto gap-4 sm:gap-5 pb-2 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
              {section.videos.length > 0 ? section.videos.map((video, idx) => {
                const isAudio = video.isAudio;
                const videoSlug = video.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                return (
                  <div
                    key={idx}
                    id={`video-${videoSlug}`}
                    className={`flex-shrink-0 w-[calc(33.333%-14px)] min-w-[250px] rounded-xl overflow-hidden border bg-white dark:bg-gray-900 shadow-md hover:shadow-xl transition-shadow ${
                      highlightedVideos.includes(videoSlug)
                        ? 'border-blue-500 ring-2 ring-blue-400 ring-offset-2'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-black">
                      {isAudio ? (
                        <video
                          src={`${video.url}#t=0.5`}
                          className="w-full h-full object-cover"
                          preload="metadata"
                          muted
                          playsInline
                        />
                      ) : (
                        <div className="relative w-full h-full">
                          <img
                            src={getYouTubeThumbnail(video.url)}
                            alt={video.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-900 to-green-900 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                              <Play className="h-7 w-7 text-white ml-1" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Card body */}
                    <div className="p-3 sm:p-4">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">{video.name}</h3>
                      <button
                        onClick={() => setVideoPopup({ open: true, url: isAudio ? video.url : video.url + '?autoplay=1', name: video.name, isAudio })}
                        className="mt-3 w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <Play className="h-4 w-4" />
                        {isAudio ? 'Listen Now' : 'Watch Now'}
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <div className="flex-shrink-0 w-[calc(33.333%-14px)] min-w-[250px] rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 flex items-center justify-center min-h-[300px]">
                  <div className="text-center p-6">
                    <span className="text-5xl block mb-3">🕉️</span>
                    <p className="text-sm sm:text-base font-semibold text-gray-500 dark:text-gray-400">Coming Soon</p>
                    <p className="text-xs text-gray-400 mt-1">Audio chants will be added here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

      </div>

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-[#323956]" />
                  Set Daily Reminder
                </h3>
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Time Picker */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reminder Time
                </label>
                <input
                  type="time"
                  value={reminderData.time}
                  onChange={(e) => setReminderData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-[#323956]"
                />
              </div>

              {/* Day Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Repeat on
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleReminderDay(day)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        reminderData.days.includes(day)
                          ? 'bg-[#323956] text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enable Toggle */}
              <div className="mb-6 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Reminder
                </span>
                <button
                  onClick={() => setReminderData(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    reminderData.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    reminderData.enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveReminder}
                  disabled={reminderData.days.length === 0}
                  className="flex-1 px-4 py-3 bg-[#323956] text-white rounded-xl hover:bg-[#232D3C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save as Routine Modal */}
      {showRoutineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                  <Save className="h-5 w-5 mr-2 text-[#323956]" />
                  Save as Routine
                </h3>
                <button
                  onClick={() => setShowRoutineModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Current Settings Preview */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Your Current Settings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Technique:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {currentMode.name}
                    </span>
                  </div>
                  {selectedMode === 'custom' && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Pattern:</span>
                      <span className="font-medium text-pink-600 dark:text-pink-400">
                        {customBreath.inhale}-{customBreath.hold1}-{customBreath.exhale}-{customBreath.hold2}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Headphones:</span>
                    <span className={`font-medium ${headphonesOn ? 'text-green-600' : 'text-gray-500'}`}>
                      {headphonesOn ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Haptic Feedback:</span>
                    <span className={`font-medium ${hapticOn ? 'text-green-600' : 'text-gray-500'}`}>
                      {hapticOn ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Eyes Closed Mode:</span>
                    <span className={`font-medium ${eyesClosed ? 'text-green-600' : 'text-gray-500'}`}>
                      {eyesClosed ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>
              </div>

              {savedRoutine && (
                <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    You have a saved routine from {new Date(savedRoutine.savedAt).toLocaleDateString()}. Saving will update it.
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                These settings will be automatically loaded when you open Breath Reset Protocol.
              </p>

              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRoutineModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRoutine}
                  disabled={isSavingRoutine}
                  className="flex-1 px-4 py-3 bg-[#323956] text-white rounded-xl hover:bg-[#232D3C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSavingRoutine ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Routine'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How to Do Modal */}
      {showHowToModal && modeConfigs[showHowToModal] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{modeConfigs[showHowToModal].icon}</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {modeConfigs[showHowToModal].howTo.title}
                </h3>
              </div>
              <button
                onClick={() => setShowHowToModal(null)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Steps */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#323956] text-white text-xs flex items-center justify-center">?</span>
                  How to Do
                </h4>
                <ol className="space-y-3">
                  {modeConfigs[showHowToModal].howTo.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold"
                        style={{ backgroundColor: modeConfigs[showHowToModal].color }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Benefits */}
              <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: `${modeConfigs[showHowToModal].color}15` }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: modeConfigs[showHowToModal].color }}>
                  Benefits
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {modeConfigs[showHowToModal].howTo.benefits}
                </p>
              </div>

              {/* Pro Tip */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                  💡 Pro Tip
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  {modeConfigs[showHowToModal].howTo.tip}
                </p>
              </div>

              {/* Try Now Button */}
              <button
                onClick={() => {
                  setSelectedMode(showHowToModal);
                  setShowHowToModal(null);
                }}
                className="w-full mt-6 py-3 rounded-xl text-white font-semibold transition-colors hover:opacity-90"
                style={{ backgroundColor: modeConfigs[showHowToModal].color }}
              >
                Try {modeConfigs[showHowToModal].name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Popup Modal */}
      {videoPopup.open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setVideoPopup({ open: false, url: '', name: '' })}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{videoPopup.name}</h3>
              <button
                onClick={() => setVideoPopup({ open: false, url: '', name: '' })}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              {videoPopup.isAudio ? (
                <video
                  src={videoPopup.url}
                  title={videoPopup.name}
                  className="w-full h-full"
                  controls
                  autoPlay
                />
              ) : (
                <iframe
                  src={videoPopup.url}
                  title={videoPopup.name}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ANSResetProtocol;
