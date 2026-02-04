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
import { StatisticsPage } from './components/StatisticsPage';
import { WeekSummary } from './components/WeekSummary';
import { PullToRefresh } from './components/PullToRefresh';
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

import { type WeekStartDay } from './lib/weekUtils';

const WEEK_START_STORAGE_KEY = 'weekStartDay';

const getStoredWeekStart = (userId?: string): WeekStartDay => {
  try {
    const key = userId ? `${WEEK_START_STORAGE_KEY}_${userId}` : WEEK_START_STORAGE_KEY;
    const stored = localStorage.getItem(key);
    return (stored === 'monday' || stored === 'sunday') ? stored : 'sunday';
  } catch {
    return 'sunday';
  }
};

const setStoredWeekStart = (weekStart: WeekStartDay, userId?: string) => {
  try {
    const key = userId ? `${WEEK_START_STORAGE_KEY}_${userId}` : WEEK_START_STORAGE_KEY;
    localStorage.setItem(key, weekStart);
  } catch {
    // Ignore storage errors
  }
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
  const previousWeekKeyRef = useRef<string | null>(null);
  const previousWeekDataRef = useRef<WeekData | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(220);
  const [weekStartDay, setWeekStartDay] = useState<WeekStartDay>('sunday');
  const [showWeekSummary, setShowWeekSummary] = useState(false);
  const [showStatisticsPage, setShowStatisticsPage] = useState(false);

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

  // Load week start preference
  useEffect(() => {
    if (user) {
      const stored = getStoredWeekStart(user.id);
      setWeekStartDay(stored);
    } else {
      const stored = getStoredWeekStart();
      setWeekStartDay(stored);
    }
  }, [user]);

  // Measure header height for spacer
  useEffect(() => {
    if (headerRef.current && !showStatisticsPage) {
      const updateHeight = () => {
        if (headerRef.current) {
          // Use getBoundingClientRect for accurate measurement
          const height = headerRef.current.getBoundingClientRect().height;
          setHeaderHeight(height);
        }
      };
      // Use multiple timeouts to catch layout changes
      updateHeight();
      const timeout1 = setTimeout(updateHeight, 50);
      const timeout2 = setTimeout(updateHeight, 200);
      const timeout3 = setTimeout(updateHeight, 500);
      window.addEventListener('resize', updateHeight);
      return () => {
        window.removeEventListener('resize', updateHeight);
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
      };
    }
  }, [showStatisticsPage, weekStartDay, lastSaved, hasUnsavedChanges, currentWeek]);

  // Normalized week key function - always uses Sunday as base for database consistency
  // This ensures the same calendar week always uses the same database key,
  // regardless of the user's start-of-week preference
  const getNormalizedWeekKey = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    // Always normalize to Sunday (day 0)
    const diff = -day;
    const normalizedWeekStart = new Date(d.setDate(d.getDate() + diff));
    return normalizedWeekStart.toISOString().split('T')[0];
  };

  // Display week key - uses user's preference for UI purposes (kept for backward compatibility)
  const getWeekKey = (date: Date) => {
    const weekStart = getWeekStart(date);
    return weekStart.toISOString().split('T')[0];
  };

  const getWeekStart = (date: Date, startDay: WeekStartDay = weekStartDay) => {
    const d = new Date(date);
    const day = d.getDay();
    let diff: number;
    
    if (startDay === 'monday') {
      // Monday = 1, so if day is 0 (Sunday), we go back 6 days
      // Otherwise, go back (day - 1) days
      diff = day === 0 ? -6 : -(day - 1);
    } else {
      // Sunday = 0, so go back 'day' days
      diff = -day;
    }
    
    return new Date(d.setDate(d.getDate() + diff));
  };

  const handleWeekStartChange = (newWeekStart: WeekStartDay) => {
    setWeekStartDay(newWeekStart);
    setStoredWeekStart(newWeekStart, user?.id);
    // Recalculate current week based on new start day
    const newWeekStartDate = getWeekStart(currentWeek, newWeekStart);
    setCurrentWeek(newWeekStartDate);
  };

  // Track previous week key for auto-save
  useEffect(() => {
    const weekKey = getNormalizedWeekKey(currentWeek);
    const previousWeekKey = previousWeekKeyRef.current;

    // If week changed and we have previous week data to save
    if (previousWeekKey !== null && previousWeekKey !== weekKey && previousWeekDataRef.current && user) {
      // Save previous week's data before loading new week
      const previousData = previousWeekDataRef.current;
      saveWeekData(user.id, previousWeekKey, previousData).catch(err => {
        console.error('Auto-save on week change failed:', err);
      });
      // Clear the previous week data after saving
      previousWeekDataRef.current = null;
    }

    // Update the previous week key reference
    previousWeekKeyRef.current = weekKey;
  }, [currentWeek, user]);

  // Load data from database when week changes or user is available
  useEffect(() => {
    if (!user) return;

    const weekKey = getNormalizedWeekKey(currentWeek);

    async function loadWeekData() {
      try {
        const data = await getWeekData(user.id, weekKey);
        // Deep clone to ensure proper comparison later
        const dataToSave = data ? JSON.parse(JSON.stringify(data)) : JSON.parse(JSON.stringify(INITIAL_WEEK_DATA));

        setWeekData(prev => ({ ...prev, [weekKey]: dataToSave }));
        setSavedData(prev => ({ ...prev, [weekKey]: JSON.parse(JSON.stringify(dataToSave)) }));
        setHasUnsavedChanges(false);
        if (data) {
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error('Error loading week data:', error);
        // Fallback to local state if database fails
        const key = getNormalizedWeekKey(currentWeek);
        if (!weekData[key]) {
          const initialData = JSON.parse(JSON.stringify(INITIAL_WEEK_DATA));
          setWeekData(prev => ({ ...prev, [key]: initialData }));
          setSavedData(prev => ({ ...prev, [key]: JSON.parse(JSON.stringify(initialData)) }));
        }
      }
    }

    loadWeekData();
  }, [user, currentWeek]);

  // Check for unsaved changes whenever weekData changes
  useEffect(() => {
    if (!user) return;

    const weekKey = getNormalizedWeekKey(currentWeek);
    const currentData = weekData[weekKey];
    const saved = savedData[weekKey];

    // If we don't have current data yet, no changes
    if (!currentData) {
      setHasUnsavedChanges(false);
      return;
    }

    // If we have current data but no saved data yet, initialize saved data to match
    if (!saved) {
      setSavedData(prev => ({ ...prev, [weekKey]: JSON.parse(JSON.stringify(currentData)) }));
      setHasUnsavedChanges(false);
      return;
    }

    // Normalize data for comparison (handle Date objects in events)
    const normalizeForComparison = (data: WeekData) => {
      const normalized = JSON.parse(JSON.stringify(data));
      // Ensure dates are strings for comparison
      if (normalized.events) {
        normalized.events = normalized.events.map((e: any) => ({
          ...e,
          date: e.date instanceof Date ? e.date.toISOString() : (typeof e.date === 'string' ? e.date : new Date(e.date).toISOString())
        }));
      }
      return normalized;
    };

    // Compare current data with saved data
    const currentNormalized = normalizeForComparison(currentData);
    const savedNormalized = normalizeForComparison(saved);
    const hasChanges = JSON.stringify(currentNormalized) !== JSON.stringify(savedNormalized);

    setHasUnsavedChanges(hasChanges);

    // Store pending data for auto-save on critical events
    if (hasChanges) {
      pendingSaveRef.current = currentData;
      // Store for week change auto-save (only if this is the current week)
      if (previousWeekKeyRef.current === weekKey) {
        previousWeekDataRef.current = currentData;
      }
    } else {
      pendingSaveRef.current = null;
      // Clear previous week data if no changes and this is the current week
      if (previousWeekKeyRef.current === weekKey) {
        previousWeekDataRef.current = null;
      }
    }
  }, [weekData, savedData, currentWeek, user]);

  // Auto-save on page unload (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && pendingSaveRef.current && user) {
        // Try to save synchronously (may not always work)
        const weekKey = getNormalizedWeekKey(currentWeek);
        // Use sendBeacon or sync XHR for more reliable unload save
        // For now, we'll just warn the user
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, currentWeek, user]);

  const getCurrentWeekData = (): WeekData => {
    const key = getNormalizedWeekKey(currentWeek);
    return weekData[key] || INITIAL_WEEK_DATA;
  };

  const updateWeekData = (updater: (data: WeekData) => WeekData) => {
    const key = getNormalizedWeekKey(currentWeek);
    setWeekData(prev => {
      const updated = {
        ...prev,
        [key]: updater(prev[key] || JSON.parse(JSON.stringify(INITIAL_WEEK_DATA)))
      };
      // Update previous week data ref if this is the current week
      if (previousWeekKeyRef.current === key) {
        previousWeekDataRef.current = updated[key];
      }
      return updated;
    });
  };

  // Manual save function
  const handleSave = async () => {
    if (!user) return;

    const weekKey = getNormalizedWeekKey(currentWeek);
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
      setShowWeekSummary(false);
    } catch (error) {
      console.error('Error saving week data:', error);
      alert('Failed to save data. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  // Refresh data
  const handleRefresh = async () => {
    if (!user) return;
    const weekKey = getNormalizedWeekKey(currentWeek);
    try {
      const data = await getWeekData(user.id, weekKey);
      const dataToSave = data ? JSON.parse(JSON.stringify(data)) : JSON.parse(JSON.stringify(INITIAL_WEEK_DATA));
      setWeekData(prev => ({ ...prev, [weekKey]: dataToSave }));
      setSavedData(prev => ({ ...prev, [weekKey]: JSON.parse(JSON.stringify(dataToSave)) }));
      setHasUnsavedChanges(false);
      if (data) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const toggleComponent = (component: keyof typeof visibleComponents) => {
    setVisibleComponents(prev => ({
      ...prev,
      [component]: !prev[component]
    }));
  };

  const getNormalizedWeekKeyString = (date: Date): string => {
    return getNormalizedWeekKey(date);
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
    <>
    {/* Header + Week Selector - Fixed at top */}
    {!showStatisticsPage && (
      <div className="fixed top-0 left-0 right-0" style={{ zIndex: 9999 }}>
        <div className="max-w-md mx-auto bg-white border-b shadow-sm" ref={headerRef}>
            <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold">Weekly Diary</h1>
                {lastSaved && (
                  <span className="text-xs text-gray-500">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !user || !hasUnsavedChanges}
                  style={{
                    backgroundColor: hasUnsavedChanges ? '#2563eb' : '#9ca3af',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: (saving || !user || !hasUnsavedChanges) ? 'not-allowed' : 'pointer',
                    opacity: (saving || !user || !hasUnsavedChanges) ? 0.5 : 1,
                    minWidth: '60px',
                    height: '28px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (!saving && user && hasUnsavedChanges) {
                      e.currentTarget.style.backgroundColor = '#1d4ed8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving && user && hasUnsavedChanges) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }
                  }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={async () => {
                    await auth.signOut();
                    setUser(null);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  Sign Out
                </button>
              </div>
            </div>

            <WeekSelector
              currentWeek={currentWeek}
              onWeekChange={setCurrentWeek}
              weekStartDay={weekStartDay}
              getWeekStart={getWeekStart}
            />
          </div>

          {/* Settings (under header) */}
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <ComponentToggle
              visibleComponents={visibleComponents}
              onToggle={toggleComponent}
              weekStartDay={weekStartDay}
              onWeekStartChange={handleWeekStartChange}
            />
            <button
              onClick={() => setShowStatisticsPage(true)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Statistics
            </button>
          </div>
        </div>
      </div>
    )}

    <div className={`min-h-screen bg-gray-50 pb-24 ${showStatisticsPage ? 'statistics-page-open' : ''}`} style={{ overflow: showStatisticsPage ? 'hidden' : 'auto' }}>
      <div className="max-w-md mx-auto">
        {/* Spacer for fixed header */}
        {!showStatisticsPage && (
          <div style={{ height: `${headerHeight + 4}px` }}></div>
        )}

        {/* Main Content */}
        <div className="min-h-[calc(100vh-200px)] relative z-0">
          <PullToRefresh onRefresh={handleRefresh} disabled={!user || saving}>
            <div className="py-4">
            <div className="mx-auto max-w-md w-[calc(100%-2rem)] space-y-4 relative z-0">
              {visibleComponents.habits && (
              <HabitTracker
                data={data.habits}
                weekStart={getWeekStart(currentWeek)}
                onUpdate={(habits) => updateWeekData(d => ({ ...d, habits }))}
                userId={user?.id}
                weekStartDay={weekStartDay}
              />
            )}

            {visibleComponents.mood && (
              <MoodTracker
                moods={data.moods}
                weekStart={getWeekStart(currentWeek)}
                onUpdate={(moods) => updateWeekData(d => ({ ...d, moods }))}
                weekStartDay={weekStartDay}
              />
            )}

            {visibleComponents.meals && (
              <MealTracker
                meals={data.meals}
                weekStart={getWeekStart(currentWeek)}
                onUpdate={(meals) => updateWeekData(d => ({ ...d, meals }))}
                weekStartDay={weekStartDay}
              />
            )}

            {visibleComponents.events && (
              <MainEvents
                events={data.events}
                weekStart={getWeekStart(currentWeek)}
                onUpdate={(events) => updateWeekData(d => ({ ...d, events }))}
                weekStartDay={weekStartDay}
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
          </PullToRefresh>
        </div>
      </div>

      {/* Week Summary Modal */}
      {showWeekSummary && (
        <WeekSummary
          weekData={getCurrentWeekData()}
          weekStart={getWeekStart(currentWeek)}
          weekStartDay={weekStartDay}
          onClose={() => setShowWeekSummary(false)}
          onSave={handleSave}
        />
      )}

      {/* Floating Save Button - Only show when Statistics page is NOT open */}
      {hasUnsavedChanges && !showStatisticsPage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] transition-all duration-300" style={{ display: showStatisticsPage ? 'none' : 'block' }}>
          <div className="bg-white rounded-full shadow-lg border border-gray-200 px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate">
                  Unsaved changes
                </span>
                <span className="text-xs text-gray-500 truncate">
                  Tap to save
                </span>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-md flex-shrink-0"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Saving...
                </span>
              ) : (
                'Save Now'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Floating Saved Indicator - Only show when Statistics page is NOT open */}
      {!hasUnsavedChanges && lastSaved && !showStatisticsPage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] transition-all duration-300" style={{ display: showStatisticsPage ? 'none' : 'block' }}>
          <div className="bg-green-50 border border-green-200 rounded-full px-4 py-2.5 flex items-center justify-center gap-2 shadow-md">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>

    {/* Statistics Page - Rendered outside main container to ensure it's above everything */}
    {showStatisticsPage && user && (
      <StatisticsPage
        userId={user.id}
        currentWeekStart={getNormalizedWeekKeyString(currentWeek)}
        weekData={getCurrentWeekData()}
        weekStart={getWeekStart(currentWeek)}
        weekStartDay={weekStartDay}
        onClose={() => setShowStatisticsPage(false)}
        onSave={handleSave}
      />
    )}
    </>
  );
}
