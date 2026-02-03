// Example: Updated App.tsx with database integration
// This shows how to integrate the database hooks into your existing App.tsx

import { useState, useEffect } from 'react';
import { WeekSelector } from './components/WeekSelector';
import { ComponentToggle } from './components/ComponentToggle';
import { HabitTracker } from './components/HabitTracker';
import { MoodTracker } from './components/MoodTracker';
import { MealTracker } from './components/MealTracker';
import { MainEvents } from './components/MainEvents';
import { GratefulThings } from './components/GratefulThings';
import { CommentOfWeek } from './components/CommentOfWeek';
import { Auth } from './components/Auth';
import { useWeekData } from './hooks/useWeekData';
import { auth } from './lib/supabase';
import type { WeekData } from './App';

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
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
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

  const weekKey = getWeekKey(currentWeek);
  const { data: weekData, loading: dataLoading, updateData } = useWeekData(weekKey);

  const [visibleComponents, setVisibleComponents] = useState({
    habits: true,
    mood: true,
    meals: true,
    events: true,
    grateful: true,
    comment: true
  });

  // Check authentication status
  useEffect(() => {
    async function checkUser() {
      const currentUser = await auth.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    }
    checkUser();

    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleComponent = (component: keyof typeof visibleComponents) => {
    setVisibleComponents(prev => ({
      ...prev,
      [component]: !prev[component]
    }));
  };

  // Show auth screen if not logged in
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // Use database data or fallback to initial data
  const data = weekData || INITIAL_WEEK_DATA;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-center flex-1">Weekly Diary</h1>
              <button
                onClick={() => auth.signOut()}
                className="text-sm text-gray-500 hover:text-gray-700"
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

        {/* Loading indicator */}
        {dataLoading && (
          <div className="px-4 py-2 bg-blue-50 text-blue-600 text-sm text-center">
            Loading week data...
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
              onUpdate={(habits) => updateData(d => ({ ...d, habits }))}
            />
          )}

          {visibleComponents.mood && (
            <MoodTracker 
              moods={data.moods}
              weekStart={getWeekStart(currentWeek)}
              onUpdate={(moods) => updateData(d => ({ ...d, moods }))}
            />
          )}

          {visibleComponents.meals && (
            <MealTracker 
              meals={data.meals}
              weekStart={getWeekStart(currentWeek)}
              onUpdate={(meals) => updateData(d => ({ ...d, meals }))}
            />
          )}

          {visibleComponents.events && (
            <MainEvents 
              events={data.events}
              weekStart={getWeekStart(currentWeek)}
              onUpdate={(events) => updateData(d => ({ ...d, events }))}
            />
          )}

          {visibleComponents.grateful && (
            <GratefulThings 
              grateful={data.grateful}
              onUpdate={(grateful) => updateData(d => ({ ...d, grateful }))}
            />
          )}

          {visibleComponents.comment && (
            <CommentOfWeek 
              comment={data.comment}
              onUpdate={(comment) => updateData(d => ({ ...d, comment }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
