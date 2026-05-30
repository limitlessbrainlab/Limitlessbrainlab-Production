import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import DatabaseService from '../services/databaseService';
import toast from 'react-hot-toast';
import FeatureGate from '../components/access/FeatureGate';
import {
  Play,
  Brain,
  Target,
  TrendingUp,
  Heart,
  Shield,
  Zap,
  CheckCircle2,
  CheckCircle,
  Circle,
  ArrowRight,
  Sparkles,
  Activity,
  Clock,
  Users,
  Wind,
  Sun,
  Moon,
  Coffee,
  Dumbbell,
  Footprints,
  TreePine,
  Music,
  Smile,
  Loader2,
  Calendar,
  Flame,
  Video,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  BookMarked,
  Mic2
} from 'lucide-react';

const MoversSection = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');
  const [completedActivities, setCompletedActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [progress, setProgress] = useState({
    todayCount: 0,
    weekCount: 0,
    streakDays: 0,
    totalActivities: 0
  });

  // Track weekly progress for 12-week journey (6 Foundation + 6 Mastery)
  const [weeklyProgress, setWeeklyProgress] = useState({
    week1: { completed: 0, target: 35, startDate: null },
    week2: { completed: 0, target: 35, startDate: null },
    week3: { completed: 0, target: 35, startDate: null },
    week4: { completed: 0, target: 35, startDate: null },
    week5: { completed: 0, target: 35, startDate: null },
    week6: { completed: 0, target: 35, startDate: null },
    week7: { completed: 0, target: 42, startDate: null },
    week8: { completed: 0, target: 42, startDate: null },
    week9: { completed: 0, target: 42, startDate: null },
    week10: { completed: 0, target: 42, startDate: null },
    week11: { completed: 0, target: 42, startDate: null },
    week12: { completed: 0, target: 42, startDate: null }
  });
  const [journeyStartDate, setJourneyStartDate] = useState(null);
  const [currentJourneyWeek, setCurrentJourneyWeek] = useState(1);

  // Personalization based on patient's algorithm results
  const [algorithmResults, setAlgorithmResults] = useState(null);
  const [priorityCategories, setPriorityCategories] = useState([]);
  const [patientName, setPatientName] = useState('');

  // MOVERS Categories with activities (matching the MOVERS framework)
  const moversCategories = [
    {
      id: 'meditation',
      letter: 'M',
      title: 'Meditation | Music',
      shortTitle: 'Meditation',
      subtitle: 'Music',
      color: '#22C55E', // Green
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      icon: Music,
      description: 'Calm your mind through meditation and healing music',
      guidedVideoUrl: 'https://www.youtube.com/embed/inpok4MKVLM', // 10-min guided meditation
      tips: [
        'Find a quiet, comfortable space',
        'Start with just 5 minutes and gradually increase',
        'Focus on your breath when thoughts wander'
      ],
      activities: [
        { id: 'morning-meditation', name: 'Morning Meditation', duration: '10 min', points: 15, videoUrl: 'https://www.youtube.com/embed/inpok4MKVLM' },
        { id: 'guided-meditation', name: 'Guided Meditation', duration: '15 min', points: 15, videoUrl: 'https://www.youtube.com/embed/z6X5oEIg6Ak' },
        { id: 'binaural-beats', name: 'Listen to Binaural Beats', duration: '20 min', points: 10, link: '/dashboard/frequencies' },
        { id: 'healing-music', name: 'Healing Frequency Music', duration: '15 min', points: 10, link: '/dashboard/frequencies' },
        { id: 'mantra-chanting', name: 'Mantra/Chanting Practice', duration: '10 min', points: 15, videoUrl: 'https://www.youtube.com/embed/YLO7tCdBVrA' }
      ]
    },
    {
      id: 'oxygenation',
      letter: 'O',
      title: 'Oxygenation | Breathing',
      shortTitle: 'Oxygenation',
      subtitle: 'Breathing',
      color: '#3B82F6', // Blue
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      icon: Wind,
      description: 'Breathe deeply to energize your brain',
      guidedVideoUrl: 'https://www.youtube.com/embed/tEmt1Znux58', // Box breathing guide
      tips: [
        'Practice in a comfortable seated position',
        'Breathe through your nose when possible',
        'Focus on slow, controlled exhales for calm'
      ],
      activities: [
        { id: 'box-breathing', name: 'Box Breathing (4-4-4-4)', duration: '5 min', points: 10, videoUrl: 'https://www.youtube.com/embed/tEmt1Znux58' },
        { id: 'deep-breathing', name: 'Deep Diaphragmatic Breathing', duration: '5 min', points: 10, videoUrl: 'https://www.youtube.com/embed/UB3tSaiEbNY' },
        { id: 'pranayama', name: 'Pranayama Practice', duration: '10 min', points: 15, videoUrl: 'https://www.youtube.com/embed/1YdJWqKYiY8' },
        { id: 'physiological-sigh', name: 'Physiological Sigh (5x)', duration: '2 min', points: 5, videoUrl: 'https://www.youtube.com/embed/rBdhqBGqiMc' },
        { id: 'outdoor-breathing', name: 'Fresh Air Breathing (Outside)', duration: '10 min', points: 10 }
      ]
    },
    {
      id: 'vitamins',
      letter: 'V',
      title: 'Vitamins & Supplements',
      shortTitle: 'Vitamins &',
      subtitle: 'Supplements',
      color: '#F97316', // Orange
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      icon: Eye,
      description: 'Nourish your brain with essential vitamins and supplements',
      guidedVideoUrl: 'https://www.youtube.com/embed/1vx8iUvfyCY',
      tips: [
        'Consult your healthcare provider before starting supplements',
        'Omega-3s and B-vitamins are essential for brain health',
        'Consistency is key for supplement effectiveness'
      ],
      activities: [
        { id: 'daily-vitamins', name: 'Take Daily Vitamins', duration: '5 min', points: 10 },
        { id: 'omega3', name: 'Omega-3 Supplement', duration: '5 min', points: 10 },
        { id: 'b-vitamins', name: 'B-Complex Vitamins', duration: '5 min', points: 10 },
        { id: 'vitamin-d', name: 'Vitamin D Supplement', duration: '5 min', points: 10 },
        { id: 'magnesium', name: 'Magnesium Supplement', duration: '5 min', points: 10 }
      ]
    },
    {
      id: 'exercise',
      letter: 'E',
      title: 'Exercise',
      shortTitle: 'Exercise',
      subtitle: '',
      color: '#EAB308', // Yellow
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: Dumbbell,
      description: 'Move your body to boost your brain',
      guidedVideoUrl: 'https://www.youtube.com/embed/gC_L9qAHVJ8', // Morning workout
      tips: [
        'Start with activities you enjoy',
        'Exercise releases BDNF for brain growth',
        'Even 10 minutes of movement helps'
      ],
      activities: [
        { id: 'morning-walk', name: 'Morning Walk (20 min)', duration: '20 min', points: 20 },
        { id: 'yoga', name: 'Yoga Session', duration: '30 min', points: 20, videoUrl: 'https://www.youtube.com/embed/v7AYKMP6rOE' },
        { id: 'stretching', name: 'Full Body Stretching', duration: '10 min', points: 10, videoUrl: 'https://www.youtube.com/embed/g_tea8ZNk5A' },
        { id: 'cardio', name: 'Cardio Exercise', duration: '30 min', points: 25, videoUrl: 'https://www.youtube.com/embed/gC_L9qAHVJ8' },
        { id: 'strength', name: 'Strength Training', duration: '30 min', points: 25, videoUrl: 'https://www.youtube.com/embed/UBMk30rjy0o' },
        { id: 'dance', name: 'Dance/Movement Therapy', duration: '20 min', points: 15, videoUrl: 'https://www.youtube.com/embed/D2N-voRkR4E' }
      ]
    },
    {
      id: 'reading',
      letter: 'R',
      title: 'Reading | Chanting',
      shortTitle: 'Reading',
      subtitle: 'Chanting',
      color: '#8B5CF6', // Purple
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      icon: BookMarked,
      description: 'Read to learn and chant for inner peace',
      guidedVideoUrl: 'https://www.youtube.com/embed/YLO7tCdBVrA', // Chanting guide
      tips: [
        'Read before bed to wind down (physical books)',
        'Audiobooks count - learning is learning',
        'Chanting creates meditative brain states'
      ],
      activities: [
        { id: 'daily-reading', name: 'Daily Reading (30 min)', duration: '30 min', points: 15 },
        { id: 'audiobook', name: 'Listen to Audiobook', duration: '20 min', points: 10 },
        { id: 'chanting', name: 'Chanting/Mantras', duration: '10 min', points: 15, videoUrl: 'https://www.youtube.com/embed/YLO7tCdBVrA' },
        { id: 'spiritual-reading', name: 'Spiritual/Self-Help Reading', duration: '20 min', points: 15 },
        { id: 'learn-something', name: 'Learn Something New', duration: '15 min', points: 15 }
      ]
    },
    {
      id: 'supplementary',
      letter: 'S',
      title: 'Supplementary',
      shortTitle: 'Supplementary',
      subtitle: '',
      color: '#6366F1', // Indigo
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      icon: Moon,
      description: 'Supplementary practices to enhance your brain optimization journey',
      guidedVideoUrl: 'https://www.youtube.com/embed/t0kACis_dJE',
      tips: [
        'Supplementary activities complement your core MOVERS routine',
        'Quality sleep is a key supplementary practice',
        'Journaling and reflection enhance overall brain wellness'
      ],
      activities: [
        { id: 'sleep-7h', name: '7+ Hours Quality Sleep', duration: 'Night', points: 25 },
        { id: 'power-nap', name: '20-min Power Nap', duration: '20 min', points: 10, videoUrl: 'https://www.youtube.com/embed/H6p1cqmvEwU' },
        { id: 'digital-detox', name: 'Digital Detox (1 hour before bed)', duration: '1 hour', points: 15 },
        { id: 'stillness-practice', name: 'Stillness/Silence Practice', duration: '15 min', points: 10, videoUrl: 'https://www.youtube.com/embed/vj0JDwQLof4' },
        { id: 'sleep-routine', name: 'Consistent Sleep Routine', duration: 'Night', points: 20 }
      ]
    }
  ];

  // Theory video URL
  const theoryVideoUrl = 'https://www.youtube.com/embed/Uo5bx0ZPoTU';

  // Mapping of brain parameters to MOVERS categories
  const parameterToMoversMap = {
    'stress': ['meditation', 'oxygenation', 'supplementary'],
    'burnout': ['meditation', 'supplementary', 'exercise'],
    'focus': ['oxygenation', 'meditation', 'reading'],
    'attention': ['oxygenation', 'meditation', 'exercise'],
    'emotional': ['meditation', 'vitamins', 'supplementary'],
    'cognition': ['reading', 'exercise', 'oxygenation'],
    'learning': ['reading', 'exercise', 'vitamins'],
    'creativity': ['vitamins', 'meditation', 'reading'],
    'fatigue': ['supplementary', 'exercise', 'oxygenation']
  };

  // Fetch patient's algorithm results and calculate personalized recommendations
  const fetchAlgorithmResults = useCallback(async () => {
    if (!user?.email) return;

    try {
      // Get patient profile for name
      const { data: patient } = await supabase
        .from('patients')
        .select('name, profile')
        .eq('email', user.email.toLowerCase())
        .single();

      if (patient) {
        setPatientName(patient.name || patient.profile?.name || '');
      }

      // Fetch algorithm results
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

        // Find weak areas (scores < 60) and determine priority MOVERS categories
        const weakAreas = outputData.filter(item => item.score < 60);
        const priorityCategorySet = new Set();

        weakAreas.forEach(area => {
          const paramName = area.parameter?.toLowerCase() || '';
          Object.keys(parameterToMoversMap).forEach(key => {
            if (paramName.includes(key)) {
              parameterToMoversMap[key].forEach(cat => priorityCategorySet.add(cat));
            }
          });
        });

        // If no weak areas, check for moderate areas (60-75)
        if (priorityCategorySet.size === 0) {
          const moderateAreas = outputData.filter(item => item.score >= 60 && item.score < 75);
          moderateAreas.forEach(area => {
            const paramName = area.parameter?.toLowerCase() || '';
            Object.keys(parameterToMoversMap).forEach(key => {
              if (paramName.includes(key)) {
                parameterToMoversMap[key].forEach(cat => priorityCategorySet.add(cat));
              }
            });
          });
        }

        setPriorityCategories([...priorityCategorySet]);
      }
    } catch (error) {
      console.error('Error fetching algorithm results for MOVERS:', error);
    }
  }, [user?.email]);

  // Fetch completed activities for today and weekly journey progress
  const fetchProgress = useCallback(async () => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const userEmail = user.email.toLowerCase();
      const today = new Date().toISOString().split('T')[0];

      // Get today's completed activities
      const { data: todayData, error: todayError } = await supabase
        .from('movers_activities')
        .select('activity_id')
        .eq('patient_email', userEmail)
        .eq('activity_date', today);

      if (!todayError && todayData) {
        setCompletedActivities(todayData.map(d => d.activity_id));
      }

      // Get week's activities
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: weekData } = await supabase
        .from('movers_activities')
        .select('activity_date')
        .eq('patient_email', userEmail)
        .gte('activity_date', weekAgo.toISOString().split('T')[0]);

      // Get ALL activities for streak and journey calculations
      const { data: allData } = await supabase
        .from('movers_activities')
        .select('activity_date, activity_id, category')
        .eq('patient_email', userEmail)
        .order('activity_date', { ascending: true });

      let streakDays = 0;
      let startDate = null;

      if (allData && allData.length > 0) {
        // First activity date is journey start
        startDate = new Date(allData[0].activity_date);
        setJourneyStartDate(startDate);

        // Calculate streak (consecutive days)
        const uniqueDates = [...new Set(allData.map(d => d.activity_date))].sort().reverse();
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
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

        // Calculate weekly progress for 12-week journey (6 Foundation + 6 Mastery)
        const weeklyData = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 };
        const weeklyCategories = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set(), 6: new Set(), 7: new Set(), 8: new Set(), 9: new Set(), 10: new Set(), 11: new Set(), 12: new Set() };

        allData.forEach(activity => {
          const activityDate = new Date(activity.activity_date);
          const daysSinceStart = Math.floor((activityDate - startDate) / (1000 * 60 * 60 * 24));
          const weekNumber = Math.floor(daysSinceStart / 7) + 1;

          if (weekNumber >= 1 && weekNumber <= 12) {
            weeklyData[weekNumber]++;
            if (activity.category) {
              weeklyCategories[weekNumber].add(activity.category);
            }
          }
        });

        // Calculate current journey week
        const daysSinceJourneyStart = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
        const currentWeek = Math.min(Math.floor(daysSinceJourneyStart / 7) + 1, 12);
        setCurrentJourneyWeek(currentWeek);

        // Set weekly progress with targets
        // Weeks 1-6: Foundation (5 activities/day * 7 days = 35 target)
        // Weeks 7-12: Mastery (6 activities/day * 7 days = 42 target for all 6 MOVERS)
        const newWeeklyProgress = {};
        for (let w = 1; w <= 12; w++) {
          newWeeklyProgress[`week${w}`] = {
            completed: weeklyData[w],
            target: w <= 6 ? 35 : 42,
            categoriesCompleted: weeklyCategories[w].size,
            startDate: new Date(startDate.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000)
          };
        }
        setWeeklyProgress(newWeeklyProgress);
      }

      setProgress({
        todayCount: todayData?.length || 0,
        weekCount: weekData?.length || 0,
        streakDays,
        totalActivities: allData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching MOVERS progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    fetchAlgorithmResults();
  }, [fetchAlgorithmResults]);

  // Toggle activity completion
  const toggleActivity = async (categoryId, activityId, points) => {
    if (!user?.email) {
      toast.error('Please log in to track activities');
      return;
    }

    const fullActivityId = `${categoryId}-${activityId}`;
    const isCompleted = completedActivities.includes(fullActivityId);

    setIsSaving(true);
    try {
      const userEmail = user.email.toLowerCase();
      const today = new Date().toISOString().split('T')[0];

      if (isCompleted) {
        // Remove activity
        await supabase
          .from('movers_activities')
          .delete()
          .eq('patient_email', userEmail)
          .eq('activity_id', fullActivityId)
          .eq('activity_date', today);

        setCompletedActivities(prev => prev.filter(id => id !== fullActivityId));
        toast.success('Activity unmarked');
      } else {
        // Add activity
        await supabase
          .from('movers_activities')
          .insert({
            patient_email: userEmail,
            activity_id: fullActivityId,
            category: categoryId,
            points: points,
            activity_date: today
          });

        setCompletedActivities(prev => [...prev, fullActivityId]);
        toast.success(`+${points} points! Great job!`);
      }

      // Refresh progress
      await fetchProgress();
    } catch (error) {
      console.error('Error toggling activity:', error);
      toast.error('Failed to update activity');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate today's points
  const todayPoints = moversCategories.reduce((total, category) => {
    return total + category.activities.reduce((catTotal, activity) => {
      const fullId = `${category.id}-${activity.id}`;
      return catTotal + (completedActivities.includes(fullId) ? activity.points : 0);
    }, 0);
  }, 0);

  // Calculate completion percentage
  const totalActivitiesCount = moversCategories.reduce((t, c) => t + c.activities.length, 0);
  const completionPercent = Math.round((completedActivities.length / totalActivitiesCount) * 100);

  return (
    <FeatureGate featureId="movers">
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative py-6 sm:py-12 overflow-hidden bg-gradient-to-r from-[#323956] to-[#4a5578]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-full mb-3 sm:mb-4">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#F5D05D]" />
              <span className="text-xs sm:text-sm font-medium">
                {patientName ? `${patientName.split(' ')[0]}'s ` : ''}Daily Brain Optimization
              </span>
            </div>

            <h1 className="text-lg sm:text-4xl font-bold mb-2 sm:mb-4 leading-tight">
              <span className="text-[#F5D05D]">M</span>editation ·{' '}
              <span className="text-[#F5D05D]">O</span>xygenation ·{' '}
              <span className="text-[#F5D05D]">V</span>isualization ·{' '}
              <span className="text-[#F5D05D]">E</span>xercise ·{' '}
              <span className="text-[#F5D05D]">R</span>eading ·{' '}
              <span className="text-[#F5D05D]">S</span>leep
            </h1>

            <p className="text-blue-100 max-w-2xl mx-auto text-xs sm:text-base">
              {priorityCategories.length > 0
                ? `Focus on ${priorityCategories.length} personalized categories based on your assessment`
                : 'Complete daily activities across all 6 categories to optimize your brain health'
              }
            </p>
          </div>
        </div>
      </section>

      {/* Progress Stats */}
      <section className="py-4 sm:py-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              <div className="text-center p-2 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-xl">
                <div className="text-lg sm:text-3xl font-bold text-green-600">{todayPoints}</div>
                <div className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400">Points Today</div>
              </div>
              <div className="text-center p-2 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg sm:rounded-xl">
                <div className="text-lg sm:text-3xl font-bold text-blue-600">{completionPercent}%</div>
                <div className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400">Daily Progress</div>
              </div>
              <div className="text-center p-2 sm:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg sm:rounded-xl">
                <div className="text-lg sm:text-3xl font-bold text-amber-600 flex items-center justify-center gap-0.5 sm:gap-1">
                  <Flame className="h-4 w-4 sm:h-6 sm:w-6" />
                  {progress.streakDays}
                </div>
                <div className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400">Day Streak</div>
              </div>
              <div className="text-center p-2 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg sm:rounded-xl">
                <div className="text-lg sm:text-3xl font-bold text-purple-600">{progress.weekCount}</div>
                <div className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400">This Week</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-2.5 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'daily'
                  ? 'border-[#323956] text-[#323956] dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
              Daily Activities
            </button>
            <button
              onClick={() => setActiveTab('theory')}
              className={`px-2.5 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'theory'
                  ? 'border-[#323956] text-[#323956] dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
              Theory + Video
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-2.5 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'guide'
                  ? 'border-[#323956] text-[#323956] dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
              MOVERS Guide
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Daily Activities Tab */}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            {/* Personalized Recommendations Banner */}
            {priorityCategories.length > 0 && algorithmResults && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                    <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                      {patientName ? `${patientName.split(' ')[0]}, here are your` : 'Your'} Personalized Focus Areas
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Based on your brain wellness assessment, we recommend focusing on these MOVERS categories:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {priorityCategories.map(catId => {
                        const cat = moversCategories.find(c => c.id === catId);
                        if (!cat) return null;
                        return (
                          <span
                            key={catId}
                            className="px-3 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: cat.color }}
                          >
                            {cat.letter} - {cat.shortTitle}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Welcome message for new users */}
            {!algorithmResults && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                  Complete your brain wellness assessment to get personalized MOVERS recommendations!
                </p>
              </div>
            )}

            {moversCategories.map((category) => {
              const categoryCompleted = category.activities.filter(a =>
                completedActivities.includes(`${category.id}-${a.id}`)
              ).length;
              const isExpanded = expandedCategory === category.id;
              const isPriority = priorityCategories.includes(category.id);

              return (
                <div
                  key={category.id}
                  className={`rounded-xl border overflow-hidden transition-all ${
                    isPriority
                      ? 'border-2 border-amber-400 dark:border-amber-600 shadow-lg shadow-amber-100 dark:shadow-amber-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  } ${category.bgColor}`}
                >
                  {/* Priority Badge */}
                  {isPriority && (
                    <div className="px-3 py-1 bg-amber-500 text-white text-xs font-semibold flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Recommended for You
                    </div>
                  )}

                  {/* Category Header */}
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl ${
                          isPriority ? 'ring-2 ring-amber-400 ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: category.color }}
                      >
                        {category.letter}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{category.title}</h3>
                          {isPriority && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-medium">
                              Priority
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-sm font-medium" style={{ color: category.color }}>
                          {categoryCompleted}/{category.activities.length}
                        </span>
                        <span className="text-xs text-gray-400 block">completed</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Activities List */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      {/* Tips Section */}
                      {category.tips && category.tips.length > 0 && (
                        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 mb-3">
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Quick Tips</h4>
                          <ul className="space-y-1">
                            {category.tips.map((tip, idx) => (
                              <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                                <span className="mr-2" style={{ color: category.color }}>•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Guided Video Link */}
                      {category.guidedVideoUrl && (
                        <a
                          href={category.guidedVideoUrl.replace('/embed/', '/watch?v=')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-gradient-to-r rounded-lg text-white mb-3"
                          style={{ background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)` }}
                        >
                          <div className="flex items-center space-x-3">
                            <Video className="h-5 w-5" />
                            <span className="font-medium">Watch Guided {category.shortTitle} Video</span>
                          </div>
                          <ArrowRight className="h-5 w-5" />
                        </a>
                      )}

                      {category.activities.map((activity) => {
                        const fullId = `${category.id}-${activity.id}`;
                        const isCompleted = completedActivities.includes(fullId);

                        return (
                          <div key={activity.id} className="flex items-center gap-2">
                            <button
                              onClick={() => toggleActivity(category.id, activity.id, activity.points)}
                              disabled={isSaving}
                              className={`flex-1 p-3 rounded-lg flex items-center justify-between transition-all ${
                                isCompleted
                                  ? 'bg-white dark:bg-gray-800 border-2 border-green-500'
                                  : 'bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-600 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                {isCompleted ? (
                                  <CheckCircle className="h-6 w-6 text-green-500" />
                                ) : (
                                  <Circle className="h-6 w-6 text-gray-300" />
                                )}
                                <div className="text-left">
                                  <span className={`font-medium ${isCompleted ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                    {activity.name}
                                  </span>
                                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                                    <Clock className="h-3 w-3" />
                                    <span>{activity.duration}</span>
                                  </div>
                                </div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                isCompleted
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                +{activity.points} pts
                              </div>
                            </button>
                            {/* Video/Link Button */}
                            {(activity.videoUrl || activity.link) && (
                              <a
                                href={activity.link || activity.videoUrl?.replace('/embed/', '/watch?v=')}
                                target={activity.link ? '_self' : '_blank'}
                                rel="noopener noreferrer"
                                className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                title={activity.link ? 'Open in App' : 'Watch Video'}
                              >
                                {activity.link ? (
                                  <ArrowRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                ) : (
                                  <Play className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                )}
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Theory + Video Tab */}
        {activeTab === 'theory' && (
          <div className="space-y-4 sm:space-y-6">
            {/* MOVERS Protocol Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg sm:rounded-xl p-2 sm:p-3 flex-shrink-0">
                  <Activity className="h-5 w-5 sm:h-8 sm:w-8 text-[#323956] dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">MOVERS Protocol</h2>
                  <p className="text-xs sm:text-base text-gray-500 dark:text-gray-400">Your Daily Brain Optimization Framework</p>
                </div>
              </div>
              <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                MOVERS is a comprehensive daily protocol designed to optimize your brain function. Each letter represents a key practice for mental clarity, emotional balance, and peak cognitive performance.
              </p>
            </div>

            {/* The MOVERS Framework */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white text-center mb-4 sm:mb-6">The MOVERS Framework</h3>
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap sm:justify-center gap-3 sm:gap-6">
                {moversCategories.map((category) => (
                  <div key={category.id} className="flex flex-col items-center">
                    <div
                      className="w-11 h-11 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-2xl shadow-lg mb-1.5 sm:mb-2"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.letter}
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] sm:text-sm font-medium text-gray-700 dark:text-gray-300">{category.shortTitle}</p>
                      {category.subtitle && (
                        <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400">| {category.subtitle}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] px-4 sm:px-6 py-3 sm:py-4">
                <h2 className="text-sm sm:text-lg font-bold text-white flex items-center space-x-2">
                  <Video className="h-4 w-4 sm:h-5 sm:w-5 text-[#CAE0FF]" />
                  <span>Movers Video</span>
                </h2>
                <p className="text-blue-200 text-[11px] sm:text-sm mt-1">Watch and learn how to implement MOVERS</p>
              </div>
              <div className="p-3 sm:p-6">
                <div className="aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-gray-900">
                  <iframe
                    src={theoryVideoUrl}
                    title="Movers Video"
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Why MOVERS Works</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  { icon: Brain, title: 'Neuroplasticity Boost', desc: 'Regular practice strengthens neural pathways and creates new connections' },
                  { icon: Heart, title: 'Stress Reduction', desc: 'Breathing and meditation activate parasympathetic response' },
                  { icon: Zap, title: 'Enhanced Focus', desc: 'Improved oxygenation and rest lead to sharper mental clarity' },
                  { icon: TrendingUp, title: 'Peak Performance', desc: 'Holistic approach optimizes all aspects of brain function' }
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-start space-x-2.5 sm:space-x-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <benefit.icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#323956] dark:text-blue-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{benefit.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Start Guide */}
            <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white">
              <h3 className="text-sm sm:text-lg font-bold mb-3 sm:mb-4">Quick Start Guide</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="text-lg sm:text-2xl font-bold text-[#F5D05D] mb-1 sm:mb-2">1</div>
                  <p className="text-[11px] sm:text-sm">Start your day with 5-10 minutes of <strong>Meditation</strong></p>
                </div>
                <div className="bg-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="text-lg sm:text-2xl font-bold text-[#F5D05D] mb-1 sm:mb-2">2</div>
                  <p className="text-[11px] sm:text-sm">Practice <strong>Breathing exercises</strong> before important tasks</p>
                </div>
                <div className="bg-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="text-lg sm:text-2xl font-bold text-[#F5D05D] mb-1 sm:mb-2">3</div>
                  <p className="text-[11px] sm:text-sm">Take your <strong>Vitamins & Supplements</strong> daily for brain health</p>
                </div>
                <div className="bg-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="text-lg sm:text-2xl font-bold text-[#F5D05D] mb-1 sm:mb-2">4</div>
                  <p className="text-[11px] sm:text-sm">Get at least 20 minutes of <strong>Exercise</strong> daily</p>
                </div>
                <div className="bg-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="text-lg sm:text-2xl font-bold text-[#F5D05D] mb-1 sm:mb-2">5</div>
                  <p className="text-[11px] sm:text-sm"><strong>Read</strong> something meaningful every day</p>
                </div>
                <div className="bg-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="text-lg sm:text-2xl font-bold text-[#F5D05D] mb-1 sm:mb-2">6</div>
                  <p className="text-[11px] sm:text-sm">Follow <strong>Supplementary</strong> practices for overall wellness</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MOVERS Guide Tab */}
        {activeTab === 'guide' && (
          <div className="space-y-4 sm:space-y-6">
            {moversCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div
                  className="px-3 sm:px-6 py-3 sm:py-4 flex items-center space-x-3 sm:space-x-4"
                  style={{ backgroundColor: category.color }}
                >
                  <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <category.icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="text-white min-w-0">
                    <h3 className="text-sm sm:text-xl font-bold truncate">{category.letter} - {category.title}</h3>
                    <p className="text-white/80 text-[11px] sm:text-sm">{category.description}</p>
                  </div>
                </div>
                <div className="p-3 sm:p-6">
                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-2 sm:mb-3">Why it matters for your brain:</h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    {category.id === 'meditation' && (
                      <>
                        <p>• Meditation increases gray matter density in areas associated with learning and memory</p>
                        <p>• Music therapy at specific frequencies (432Hz, 528Hz) promotes brain wave coherence</p>
                        <p>• Regular practice improves attention span and emotional regulation by 25%</p>
                        <p>• Reduces cortisol levels and activates parasympathetic nervous system</p>
                      </>
                    )}
                    {category.id === 'oxygenation' && (
                      <>
                        <p>• Your brain uses 20% of your body's oxygen despite being only 2% of body weight</p>
                        <p>• Deep breathing activates the parasympathetic nervous system (rest & digest)</p>
                        <p>• Box breathing reduces stress hormones by up to 40%</p>
                        <p>• Improved oxygenation enhances cognitive performance and mental clarity</p>
                      </>
                    )}
                    {category.id === 'vitamins' && (
                      <>
                        <p>• Essential vitamins support neurotransmitter production and brain health</p>
                        <p>• Omega-3 fatty acids improve cognitive function and reduce inflammation</p>
                        <p>• B-vitamins are critical for energy production and nervous system function</p>
                        <p>• Proper supplementation can bridge nutritional gaps for optimal brain performance</p>
                      </>
                    )}
                    {category.id === 'exercise' && (
                      <>
                        <p>• Exercise increases BDNF (brain fertilizer) production by up to 300%</p>
                        <p>• 20 minutes of walking improves creativity by 60%</p>
                        <p>• Regular exercise reduces risk of cognitive decline by 30%</p>
                        <p>• Movement increases blood flow to the brain by 15-20%</p>
                      </>
                    )}
                    {category.id === 'reading' && (
                      <>
                        <p>• Reading builds new neural connections and strengthens existing ones</p>
                        <p>• Chanting and mantras activate the vagus nerve and reduce stress</p>
                        <p>• Learning new information creates new synaptic connections</p>
                        <p>• 6 minutes of reading reduces stress levels by 68%</p>
                      </>
                    )}
                    {category.id === 'supplementary' && (
                      <>
                        <p>• Supplementary practices enhance the effectiveness of core MOVERS activities</p>
                        <p>• Consistent sleep schedule strengthens circadian rhythm and brain function</p>
                        <p>• Stillness practices prepare the brain for restorative sleep</p>
                        <p>• Complementary therapies support overall neurological well-being</p>
                      </>
                    )}
                  </div>

                  {/* Recommended Activities */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Recommended Activities:</h5>
                    <div className="flex flex-wrap gap-2">
                      {category.activities.slice(0, 3).map((activity) => (
                        <span
                          key={activity.id}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300"
                        >
                          {activity.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </FeatureGate>
  );
};

export default MoversSection;
