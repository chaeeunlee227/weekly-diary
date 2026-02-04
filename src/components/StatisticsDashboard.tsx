import { useState, useEffect } from 'react';
import { TrendingUp, Target, Flame, BarChart3 } from 'lucide-react';
import { getMultipleWeeksData, getAllWeekKeys } from '../lib/weekDataApi';
import type { WeekData } from '../App';
import type { WeekStartDay } from '../lib/weekUtils';
import type { DateRangeType } from './DateRangeSelector';

interface StatisticsDashboardProps {
  userId: string;
  currentDate: Date;
  rangeType: DateRangeType;
  weekStartDay: WeekStartDay;
  getWeekStart: (date: Date, startDay?: WeekStartDay) => Date;
}

interface PeriodStats {
  periodStart: string;
  moodAverage: number;
  habitCompletion: number;
}

export function StatisticsDashboard({ 
  userId, 
  currentDate, 
  rangeType,
  weekStartDay,
  getWeekStart
}: StatisticsDashboardProps) {
  const [stats, setStats] = useState<PeriodStats[]>([]);
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

  // Helper function to normalize week key (always Sunday-based for database)
  const getNormalizedWeekKey = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = -day; // Always normalize to Sunday
    const normalizedWeekStart = new Date(d.setDate(d.getDate() + diff));
    return normalizedWeekStart.toISOString().split('T')[0];
  };

  // Get all week keys that fall within a month
  const getWeekKeysInMonth = (allWeekKeys: string[], year: number, month: number): string[] => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    return allWeekKeys.filter(weekKey => {
      const weekDate = new Date(weekKey);
      // Check if the week overlaps with the month
      // A week overlaps if its start date is before month end and its end date (start + 6 days) is after month start
      const weekEnd = new Date(weekDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return weekDate <= monthEnd && weekEnd >= monthStart;
    });
  };

  // Get all week keys that fall within a year
  const getWeekKeysInYear = (allWeekKeys: string[], year: number): string[] => {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    
    return allWeekKeys.filter(weekKey => {
      const weekDate = new Date(weekKey);
      const weekEnd = new Date(weekDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return weekDate <= yearEnd && weekEnd >= yearStart;
    });
  };

  // Aggregate data from multiple weeks
  const aggregateWeeksData = (weeksData: Array<{ weekStart: string; data: WeekData }>) => {
    if (weeksData.length === 0) {
      return {
        moodAverage: null,
        habitCompletion: 0,
        longestStreak: 0
      };
    }

    // Aggregate moods
    const allMoods: number[] = [];
    weeksData.forEach(({ data }) => {
      allMoods.push(...data.moods.filter(m => m > 0));
    });
    const moodAverage = allMoods.length > 0
      ? allMoods.reduce((sum, m) => sum + m, 0) / allMoods.length
      : null;

    // Aggregate habits
    const allTrackers = new Set<string>();
    const allCompletions: { [tracker: string]: boolean[] } = {};
    
    weeksData.forEach(({ data }) => {
      const trackers = data.habits.trackers || [];
      trackers.forEach(tracker => {
        allTrackers.add(tracker);
        if (!allCompletions[tracker]) {
          allCompletions[tracker] = [];
        }
        const completed = data.habits.completed[tracker] || [];
        allCompletions[tracker].push(...completed);
      });
    });

    let totalCompletions = 0;
    let totalPossible = 0;
    allTrackers.forEach(tracker => {
      const completed = allCompletions[tracker] || [];
      totalCompletions += completed.filter(Boolean).length;
      totalPossible += completed.length;
    });

    const habitCompletion = totalPossible > 0
      ? (totalCompletions / totalPossible) * 100
      : 0;

    // Calculate longest streak across all habits and weeks
    let longestStreak = 0;
    allTrackers.forEach(tracker => {
      const completed = allCompletions[tracker] || [];
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

    return {
      moodAverage,
      habitCompletion,
      longestStreak
    };
  };

  useEffect(() => {
    async function loadStatistics() {
      try {
        setLoading(true);
        const allWeekKeys = await getAllWeekKeys(userId);
        
        if (allWeekKeys.length === 0) {
          setLoading(false);
          return;
        }

        let targetWeekKeys: string[] = [];
        let periodWeekKeys: string[] = [];

        if (rangeType === 'weekly') {
          // For weekly, get the current week and last 8 weeks for trend
          const currentWeekKey = getNormalizedWeekKey(getWeekStart(currentDate, weekStartDay));
          targetWeekKeys = [currentWeekKey];
          periodWeekKeys = allWeekKeys.slice(0, 8);
        } else if (rangeType === 'monthly') {
          // For monthly, get all weeks in the selected month
          const month = currentDate.getMonth();
          const year = currentDate.getFullYear();
          periodWeekKeys = getWeekKeysInMonth(allWeekKeys, year, month);
          targetWeekKeys = periodWeekKeys;
        } else if (rangeType === 'yearly') {
          // For yearly, get all weeks in the selected year
          const year = currentDate.getFullYear();
          periodWeekKeys = getWeekKeysInYear(allWeekKeys, year);
          targetWeekKeys = periodWeekKeys;
        }

        if (targetWeekKeys.length === 0) {
          setLoading(false);
          return;
        }

        const weeksData = await getMultipleWeeksData(userId, targetWeekKeys);
        
        // Calculate current period stats
        const aggregated = aggregateWeeksData(weeksData);
        setCurrentStats(aggregated);

        // For trend analysis, get historical periods
        if (rangeType === 'weekly') {
          // Calculate stats for each week in trend
          const trendWeeksData = await getMultipleWeeksData(userId, periodWeekKeys);
          const weekStats: PeriodStats[] = trendWeeksData.map(({ weekStart, data }) => {
            const validMoods = data.moods.filter(m => m > 0);
            const moodAverage = validMoods.length > 0
              ? validMoods.reduce((sum, m) => sum + m, 0) / validMoods.length
              : 0;

            const trackers = data.habits.trackers || [];
            if (trackers.length === 0) {
              return { periodStart: weekStart, moodAverage, habitCompletion: 0 };
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

            return { periodStart: weekStart, moodAverage, habitCompletion };
          });
          setStats(weekStats);
        } else if (rangeType === 'monthly') {
          // Get last 6 months for trend
          const trendMonths: PeriodStats[] = [];
          for (let i = 0; i < 6; i++) {
            const monthDate = new Date(currentDate);
            monthDate.setMonth(monthDate.getMonth() - i);
            const month = monthDate.getMonth();
            const year = monthDate.getFullYear();
            const monthWeekKeys = getWeekKeysInMonth(allWeekKeys, year, month);
            
            if (monthWeekKeys.length > 0) {
              const monthData = await getMultipleWeeksData(userId, monthWeekKeys);
              const aggregated = aggregateWeeksData(monthData);
              trendMonths.unshift({
                periodStart: `${year}-${String(month + 1).padStart(2, '0')}`,
                moodAverage: aggregated.moodAverage || 0,
                habitCompletion: aggregated.habitCompletion
              });
            }
          }
          setStats(trendMonths);
        } else if (rangeType === 'yearly') {
          // Get last 3 years for trend
          const trendYears: PeriodStats[] = [];
          for (let i = 0; i < 3; i++) {
            const year = currentDate.getFullYear() - i;
            const yearWeekKeys = getWeekKeysInYear(allWeekKeys, year);
            
            if (yearWeekKeys.length > 0) {
              const yearData = await getMultipleWeeksData(userId, yearWeekKeys);
              const aggregated = aggregateWeeksData(yearData);
              trendYears.unshift({
                periodStart: year.toString(),
                moodAverage: aggregated.moodAverage || 0,
                habitCompletion: aggregated.habitCompletion
              });
            }
          }
          setStats(trendYears);
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
  }, [userId, currentDate, rangeType, weekStartDay]);

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

  if (stats.length === 0 && !currentStats.moodAverage && currentStats.habitCompletion === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 w-full">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold">Statistics</h2>
        </div>
        <div className="text-sm text-gray-500">No data available for this period. Start tracking to see your statistics!</div>
      </div>
    );
  }

  // Calculate trend (comparing last 2 periods)
  const recentMoodTrend = stats.length >= 2
    ? stats[stats.length - 1].moodAverage - stats[stats.length - 2].moodAverage
    : 0;
  
  const recentHabitTrend = stats.length >= 2
    ? stats[stats.length - 1].habitCompletion - stats[stats.length - 2].habitCompletion
    : 0;

  const getTrendLabel = () => {
    if (rangeType === 'weekly') {
      return `Mood Trend (Last ${Math.min(stats.length, 8)} weeks)`;
    } else if (rangeType === 'monthly') {
      return `Mood Trend (Last ${Math.min(stats.length, 6)} months)`;
    } else {
      return `Mood Trend (Last ${Math.min(stats.length, 3)} years)`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 w-full">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        <h2 className="font-semibold">Statistics</h2>
      </div>

      {/* Current Period Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-2 sm:p-3">
          <div className="flex items-center gap-1 sm:gap-2 mb-1">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
            <span className="text-xs text-gray-600 truncate">Mood</span>
          </div>
          <div className="text-base sm:text-lg font-semibold text-blue-900">
            {currentStats.moodAverage !== null ? currentStats.moodAverage.toFixed(1) : '—'}
          </div>
          {recentMoodTrend !== 0 && stats.length >= 2 && (
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
          {recentHabitTrend !== 0 && stats.length >= 2 && (
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
          <div className="text-xs text-gray-600 mb-2">{getTrendLabel()}</div>
          <div className="flex items-end gap-0.5 sm:gap-1 h-20 overflow-x-auto pb-2">
            {stats.slice(-8).map((stat, index) => {
              const height = stat.moodAverage > 0 ? (stat.moodAverage / 6) * 100 : 5;
              const label = rangeType === 'weekly' 
                ? `W${index + 1}`
                : rangeType === 'monthly'
                ? new Date(stat.periodStart + '-01').toLocaleDateString('en-US', { month: 'short' })
                : stat.periodStart;
              return (
                <div key={stat.periodStart} className="flex-1 min-w-[30px] flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all min-h-[4px]"
                    style={{ height: `${height}%` }}
                    title={`${label}: ${stat.moodAverage.toFixed(1)}`}
                  />
                  <div className="text-xs text-gray-400 mt-1 whitespace-nowrap">{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
