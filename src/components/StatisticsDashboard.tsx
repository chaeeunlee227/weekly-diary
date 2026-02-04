import { useState, useEffect } from 'react';
import { TrendingUp, Target, Flame, BarChart3 } from 'lucide-react';
import { getMultipleWeeksData, getAllWeekKeys } from '../lib/weekDataApi';
import type { WeekData } from '../App';

interface StatisticsDashboardProps {
  userId: string;
  currentWeekStart: string;
}

interface WeekStats {
  weekStart: string;
  moodAverage: number;
  habitCompletion: number;
}

export function StatisticsDashboard({ userId, currentWeekStart }: StatisticsDashboardProps) {
  const [stats, setStats] = useState<WeekStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStats, setCurrentStats] = useState<{
    moodAverage: number | null;
    habitCompletion: number;
    longestStreak: number;
  }>({
    moodAverage: null,
    habitCompletion: 0,
    longestStreak: 0
  });

  useEffect(() => {
    async function loadStatistics() {
      try {
        setLoading(true);
        // Get last 8 weeks for trend analysis
        const allWeekKeys = await getAllWeekKeys(userId);
        const recentWeeks = allWeekKeys.slice(0, 8);
        
        if (recentWeeks.length === 0) {
          setLoading(false);
          return;
        }

        const weeksData = await getMultipleWeeksData(userId, recentWeeks);
        
        // Calculate statistics for each week
        const weekStats: WeekStats[] = weeksData.map(({ weekStart, data }) => {
          // Calculate mood average
          const validMoods = data.moods.filter(m => m > 0);
          const moodAverage = validMoods.length > 0
            ? validMoods.reduce((sum, m) => sum + m, 0) / validMoods.length
            : 0;

          // Calculate habit completion percentage
          const trackers = data.habits.trackers || [];
          if (trackers.length === 0) {
            return { weekStart, moodAverage, habitCompletion: 0 };
          }

          let totalCompletions = 0;
          let totalPossible = trackers.length * 7;

          trackers.forEach(tracker => {
            const completed = data.habits.completed[tracker] || [];
            totalCompletions += completed.filter(Boolean).length;
          });

          const habitCompletion = totalPossible > 0
            ? (totalCompletions / totalPossible) * 100
            : 0;

          return { weekStart, moodAverage, habitCompletion };
        });

        setStats(weekStats);

        // Calculate current week stats
        const currentWeekData = weeksData.find(w => w.weekStart === currentWeekStart);
        if (currentWeekData) {
          const { data } = currentWeekData;
          
          // Current mood average
          const validMoods = data.moods.filter(m => m > 0);
          const moodAvg = validMoods.length > 0
            ? validMoods.reduce((sum, m) => sum + m, 0) / validMoods.length
            : null;

          // Current habit completion
          const trackers = data.habits.trackers || [];
          let habitCompletion = 0;
          if (trackers.length > 0) {
            let totalCompletions = 0;
            let totalPossible = trackers.length * 7;
            trackers.forEach(tracker => {
              const completed = data.habits.completed[tracker] || [];
              totalCompletions += completed.filter(Boolean).length;
            });
            habitCompletion = totalPossible > 0
              ? (totalCompletions / totalPossible) * 100
              : 0;
          }

          // Calculate longest streak across all habits
          let longestStreak = 0;
          trackers.forEach(tracker => {
            const completed = data.habits.completed[tracker] || [];
            let currentStreak = 0;
            let maxStreak = 0;
            
            for (let i = 0; i < completed.length; i++) {
              if (completed[i]) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
              } else {
                currentStreak = 0;
              }
            }
            
            longestStreak = Math.max(longestStreak, maxStreak);
          });

          setCurrentStats({
            moodAverage: moodAvg,
            habitCompletion,
            longestStreak
          });
        }
      } catch (error) {
        console.error('Error loading statistics:', error);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      loadStatistics();
    }
  }, [userId, currentWeekStart]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 w-full">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold">Statistics</h2>
        </div>
        <div className="text-sm text-gray-500">Loading statistics...</div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 w-full">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold">Statistics</h2>
        </div>
        <div className="text-sm text-gray-500">No data available yet. Start tracking to see your statistics!</div>
      </div>
    );
  }

  // Calculate trend (comparing last 2 weeks)
  const recentMoodTrend = stats.length >= 2
    ? stats[0].moodAverage - stats[1].moodAverage
    : 0;
  
  const recentHabitTrend = stats.length >= 2
    ? stats[0].habitCompletion - stats[1].habitCompletion
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 w-full">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        <h2 className="font-semibold">Statistics</h2>
      </div>

      {/* Current Week Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-2 sm:p-3">
          <div className="flex items-center gap-1 sm:gap-2 mb-1">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
            <span className="text-xs text-gray-600 truncate">Mood</span>
          </div>
          <div className="text-base sm:text-lg font-semibold text-blue-900">
            {currentStats.moodAverage !== null ? currentStats.moodAverage.toFixed(1) : '—'}
          </div>
          {recentMoodTrend !== 0 && (
            <div className={`text-xs ${recentMoodTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {recentMoodTrend > 0 ? '↑' : '↓'} {Math.abs(recentMoodTrend).toFixed(1)}
            </div>
          )}
        </div>

        <div className="bg-green-50 rounded-lg p-2 sm:p-3">
          <div className="flex items-center gap-1 sm:gap-2 mb-1">
            <Target className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
            <span className="text-xs text-gray-600 truncate">Habits</span>
          </div>
          <div className="text-base sm:text-lg font-semibold text-green-900">
            {currentStats.habitCompletion.toFixed(0)}%
          </div>
          {recentHabitTrend !== 0 && (
            <div className={`text-xs ${recentHabitTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {recentHabitTrend > 0 ? '↑' : '↓'} {Math.abs(recentHabitTrend).toFixed(0)}%
            </div>
          )}
        </div>

        <div className="bg-orange-50 rounded-lg p-2 sm:p-3">
          <div className="flex items-center gap-1 sm:gap-2 mb-1">
            <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" />
            <span className="text-xs text-gray-600 truncate">Streak</span>
          </div>
          <div className="text-base sm:text-lg font-semibold text-orange-900">
            {currentStats.longestStreak} days
          </div>
        </div>
      </div>

      {/* Mood Trend Chart */}
      {stats.length > 1 && (
        <div className="mt-4">
          <div className="text-xs text-gray-600 mb-2">Mood Trend (Last {Math.min(stats.length, 8)} weeks)</div>
          <div className="flex items-end gap-0.5 sm:gap-1 h-20 overflow-x-auto pb-2">
            {stats.slice(0, 8).reverse().map((stat, index) => {
              const height = stat.moodAverage > 0 ? (stat.moodAverage / 6) * 100 : 5;
              return (
                <div key={stat.weekStart} className="flex-1 min-w-[30px] flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all min-h-[4px]"
                    style={{ height: `${height}%` }}
                    title={`Week ${index + 1}: ${stat.moodAverage.toFixed(1)}`}
                  />
                  <div className="text-xs text-gray-400 mt-1 whitespace-nowrap">W{index + 1}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
