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
import { auth } from './lib/supabase';

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
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
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
      try {
        const currentUser = await auth.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    }
    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
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
