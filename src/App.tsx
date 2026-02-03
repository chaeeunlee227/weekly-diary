// Recommended approach: Manual Save + Safety Auto-Save
// This balances user control with data safety while minimizing database costs

import { useState, useEffect, useRef } from 'react';
import { WeekSelector } from './components/WeekSelector';
import { ComponentToggle } from './components/ComponentToggle';
import { HabitTracker } from './components/HabitTracker';
import { MoodTracker } from './components/MoodTracker';
import { MealTracker } from './components/MealTracker';
import { MainEvents } from './components/MainEvents';
import { GratefulThings } from './components/GratefulThings';
import { CommentOfWeek } from './components/CommentOfWeek';
import { Auth } from './components/Auth';
import { auth, supabase } from './lib/supabase';
import { getWeekData, saveWeekData } from './lib/weekDataApi';
import { Button } from './components/ui/button';

export interface WeekData {
  habits: {
    trackers: string[];
    completed: { [tracker: string]: boolean[] }; // 7 days
  };
  moods: number[]; // 7 days, scores 1-6
  meals: {
    [day: number]: {
      breakfast: string;
      lunch: string;
      dinner: string;
      extra: string;
    };
  };
  events: Array<{
    id: string;
    date: Date;
    text: string;
  }>;
  grateful: string;
  comment: string;
}

const INITIAL_WEEK_DATA: WeekData = {
  habits: {
    trackers: [],
    completed: {}
  },
  moods: [0, 0, 0, 0, 0, 0, 0],
  meals: {},
  events: [],
  grateful: '',
  comment: ''
};

export default function App() {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [weekData, setWeekData] = useState<{ [weekKey: string]: WeekData }>({});
  const [savedData, setSavedData] = useState<{ [weekKey: string]: WeekData }>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const pendingSaveRef = useRef<WeekData | null>(null);
  
  const [visibleComponents, setVisibleComponents] = useState({
    habits: true,
    mood: true,
    meals: true,
    events: true,
    grateful: true,
    comment: true
  });

  // Check authentication status and handle OAuth callback
  useEffect(() => {
    async function checkUser() {
      try {
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setUser(session.user);
            if (window.location.hash) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          } else {
            const currentUser = await auth.getCurrentUser();
            setUser(currentUser);
          }
        } else {
          const currentUser = await auth.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    }
    checkUser();

    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getWeekKey = (date: Date) => {
    const weekStart = getWeekStart(date);
    return weekStart.toISOString().split('T')[0];
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  // Load data from database when week changes or user is available
  useEffect(() => {
    if (!user) return;

    const weekKey = getWeekKey(currentWeek);
    
    async function loadWeekData() {
      try {
        const data = await getWeekData(user.id, weekKey);
        if (data) {
          setWeekData(prev => ({ ...prev, [weekKey]: data }));
          setSavedData(prev => ({ ...prev, [weekKey]: data }));
          setHasUnsavedChanges(false);
          setLastSaved(new Date());
        } else {
          // Week doesn't exist yet, initialize with empty data
          const initialData = INITIAL_WEEK_DATA;
          setWeekData(prev => ({ ...prev, [weekKey]: initialData }));
          setSavedData(prev => ({ ...prev, [weekKey]: initialData }));
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('Error loading week data:', error);
        // Fallback to local state if database fails
        const key = getWeekKey(currentWeek);
        if (!weekData[key]) {
          setWeekData(prev => ({ ...prev, [key]: INITIAL_WEEK_DATA }));
          setSavedData(prev => ({ ...prev, [key]: INITIAL_WEEK_DATA }));
        }
      }
    }

    loadWeekData();
  }, [user, currentWeek]);

  // Check for unsaved changes whenever weekData changes
  useEffect(() => {
    if (!user) return;
    
    const weekKey = getWeekKey(currentWeek);
    const currentData = weekData[weekKey];
    const saved = savedData[weekKey];

    if (!currentData || !saved) {
      setHasUnsavedChanges(false);
      return;
    }

    // Compare current data with saved data
    const hasChanges = JSON.stringify(currentData) !== JSON.stringify(saved);
    setHasUnsavedChanges(hasChanges);
    
    // Store pending data for auto-save on critical events
    if (hasChanges) {
      pendingSaveRef.current = currentData;
    }
  }, [weekData, savedData, currentWeek, user]);

  // Auto-save when switching weeks (if there are unsaved changes)
  useEffect(() => {
    return () => {
      // This cleanup runs when currentWeek changes or component unmounts
      if (pendingSaveRef.current && user) {
        const previousWeekKey = getWeekKey(currentWeek);
        // Save in the background (fire and forget)
        saveWeekData(user.id, previousWeekKey, pendingSaveRef.current).catch(err => {
          console.error('Auto-save on week change failed:', err);
        });
      }
    };
  }, [currentWeek, user]);

  // Auto-save on page unload (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && pendingSaveRef.current && user) {
        // Try to save synchronously (may not always work)
        const weekKey = getWeekKey(currentWeek);
        // Use sendBeacon or sync XHR for more reliable unload save
        // For now, we'll just warn the user
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, currentWeek, user]);

  const getCurrentWeekData = (): WeekData => {
    const key = getWeekKey(currentWeek);
    return weekData[key] || INITIAL_WEEK_DATA;
  };

  const updateWeekData = (updater: (data: WeekData) => WeekData) => {
    const key = getWeekKey(currentWeek);
    setWeekData(prev => ({
      ...prev,
      [key]: updater(prev[key] || INITIAL_WEEK_DATA)
    }));
  };

  // Manual save function
  const handleSave = async () => {
    if (!user) return;

    const weekKey = getWeekKey(currentWeek);
    const currentData = weekData[weekKey];

    if (!currentData) return;

    setSaving(true);
    try {
      await saveWeekData(user.id, weekKey, currentData);
      // Update saved data to match current data
      setSavedData(prev => ({ ...prev, [weekKey]: currentData }));
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      pendingSaveRef.current = null;
    } catch (error) {
      console.error('Error saving week data:', error);
      alert('Failed to save data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleComponent = (component: keyof typeof visibleComponents) => {
    setVisibleComponents(prev => ({
      ...prev,
      [component]: !prev[component]
    }));
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <Auth />;
  }

  const data = getCurrentWeekData();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="px-4 py-4">
            <div className="relative flex items-center justify-center mb-3">
              <h1 className="text-center">Weekly Diary</h1>
              <button
                onClick={async () => {
                  await auth.signOut();
                  setUser(null);
                }}
                className="absolute right-0 text-sm text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                Sign Out
              </button>
            </div>
            <WeekSelector 
              currentWeek={currentWeek} 
              onWeekChange={setCurrentWeek}
            />
          </div>
        </div>

        {/* Save Button - always visible when there are unsaved changes */}
        {hasUnsavedChanges && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 sticky top-[73px] z-10">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-yellow-800 font-medium">
                  You have unsaved changes
                </span>
                <span className="text-xs text-yellow-600">
                  Changes will be saved when you switch weeks
                </span>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? 'Saving...' : 'Save Now'}
              </Button>
            </div>
          </div>
        )}

        {/* Saved indicator - shows briefly after manual save */}
        {!hasUnsavedChanges && lastSaved && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-2 sticky top-[73px] z-10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-800">
                ✓ Saved {lastSaved.toLocaleTimeString()}
              </span>
              <Button
                onClick={handleSave}
                disabled={saving}
                size="sm"
                variant="ghost"
                className="text-green-700 hover:text-green-800"
              >
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Component Toggle */}
        <div className="px-4 py-3 bg-white border-b">
          <ComponentToggle 
            visibleComponents={visibleComponents}
            onToggle={toggleComponent}
          />
        </div>

        {/* Main Content */}
        <div className="px-4 py-4 space-y-4">
          {visibleComponents.habits && (
            <HabitTracker 
              data={data.habits}
              weekStart={getWeekStart(currentWeek)}
              onUpdate={(habits) => updateWeekData(d => ({ ...d, habits }))}
            />
          )}

          {visibleComponents.mood && (
            <MoodTracker 
              moods={data.moods}
              weekStart={getWeekStart(currentWeek)}
              onUpdate={(moods) => updateWeekData(d => ({ ...d, moods }))}
            />
          )}

          {visibleComponents.meals && (
            <MealTracker 
              meals={data.meals}
              weekStart={getWeekStart(currentWeek)}
              onUpdate={(meals) => updateWeekData(d => ({ ...d, meals }))}
            />
          )}

          {visibleComponents.events && (
            <MainEvents 
              events={data.events}
              weekStart={getWeekStart(currentWeek)}
              onUpdate={(events) => updateWeekData(d => ({ ...d, events }))}
            />
          )}

          {visibleComponents.grateful && (
            <GratefulThings 
              grateful={data.grateful}
              onUpdate={(grateful) => updateWeekData(d => ({ ...d, grateful }))}
            />
          )}

          {visibleComponents.comment && (
            <CommentOfWeek 
              comment={data.comment}
              onUpdate={(comment) => updateWeekData(d => ({ ...d, comment }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
