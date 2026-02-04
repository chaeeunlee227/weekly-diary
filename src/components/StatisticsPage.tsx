import { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { StatisticsDashboard } from './StatisticsDashboard';
import { WeekSummary } from './WeekSummary';
import { DateRangeSelector, type DateRangeType } from './DateRangeSelector';
import type { WeekData } from '../App';
import type { WeekStartDay } from '../lib/weekUtils';

interface StatisticsPageProps {
  userId: string;
  currentWeekStart: string;
  weekData: WeekData;
  weekStart: Date;
  weekStartDay: WeekStartDay;
  onClose: () => void;
  onSave: () => void;
}

const getWeekStart = (date: Date, startDay: WeekStartDay) => {
  const d = new Date(date);
  const day = d.getDay();
  let diff: number;
  
  if (startDay === 'monday') {
    diff = day === 0 ? -6 : -(day - 1);
  } else {
    diff = -day;
  }
  
  return new Date(d.setDate(d.getDate() + diff));
};

// Normalized week key function - always uses Sunday as base for database consistency
const getNormalizedWeekKey = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  // Always normalize to Sunday (day 0)
  const diff = -day;
  const normalizedWeekStart = new Date(d.setDate(d.getDate() + diff));
  return normalizedWeekStart.toISOString().split('T')[0];
};

export function StatisticsPage({
  userId,
  currentWeekStart,
  weekData,
  weekStart,
  weekStartDay,
  onClose,
  onSave
}: StatisticsPageProps) {
  const [showWeekSummary, setShowWeekSummary] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(weekStart);
  const [rangeType, setRangeType] = useState<DateRangeType>('weekly');
  
  const getNormalizedWeekKeyString = (date: Date): string => {
    return getNormalizedWeekKey(date);
  };

  return (
    <div data-statistics-page="true">
      {/* Backdrop to ensure everything is covered */}
      <div className="fixed inset-0 bg-gray-50 z-[99]" style={{ pointerEvents: 'none' }} />
      <div className="fixed inset-0 bg-gray-50 z-[100] overflow-y-auto" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="max-w-md mx-auto min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b z-20">
          <div className="px-4 py-3">
            <div className="flex items-center justify-center relative mb-3">
              <h2 className="text-lg font-semibold text-center">Statistics</h2>
              <button
                onClick={onClose}
                className="absolute right-0 p-1.5 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation flex items-center justify-center text-gray-700 hover:text-gray-900"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Date Range Selector */}
            <div className="px-2">
              <DateRangeSelector
                currentDate={selectedDate}
                rangeType={rangeType}
                onDateChange={setSelectedDate}
                onRangeTypeChange={setRangeType}
                weekStartDay={weekStartDay}
                getWeekStart={getWeekStart}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="py-4">
          <div className="mx-auto max-w-md w-[calc(100%-2rem)] space-y-4">
            {/* Statistics Dashboard */}
            <StatisticsDashboard
              userId={userId}
              currentDate={selectedDate}
              rangeType={rangeType}
              weekStartDay={weekStartDay}
              getWeekStart={getWeekStart}
            />

            {/* Week Summary Section - Only show for weekly view */}
            {rangeType === 'weekly' && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold">Current Week Summary</h3>
                  </div>
                  <button
                    onClick={() => setShowWeekSummary(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors touch-manipulation min-h-[44px] w-full sm:w-auto"
                  >
                    View Summary
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Review your week's highlights before saving or continue tracking.
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Week Summary Modal */}
      {showWeekSummary && rangeType === 'weekly' && (
        <WeekSummary
          weekData={weekData}
          weekStart={getWeekStart(selectedDate, weekStartDay)}
          weekStartDay={weekStartDay}
          onClose={() => setShowWeekSummary(false)}
          onSave={() => {
            onSave();
            setShowWeekSummary(false);
          }}
        />
      )}
    </div>
  );
}
