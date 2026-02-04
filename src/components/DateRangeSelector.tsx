import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { WeekStartDay } from '../lib/weekUtils';

export type DateRangeType = 'weekly' | 'monthly' | 'yearly';

interface DateRangeSelectorProps {
  currentDate: Date;
  rangeType: DateRangeType;
  onDateChange: (date: Date) => void;
  onRangeTypeChange: (type: DateRangeType) => void;
  weekStartDay: WeekStartDay;
  getWeekStart: (date: Date, startDay?: WeekStartDay) => Date;
}

export function DateRangeSelector({
  currentDate,
  rangeType,
  onDateChange,
  onRangeTypeChange,
  weekStartDay,
  getWeekStart
}: DateRangeSelectorProps) {
  const getWeekEnd = (date: Date) => {
    const start = getWeekStart(date, weekStartDay);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  };

  const getMonthStart = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getMonthEnd = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatYear = (date: Date) => {
    return date.getFullYear().toString();
  };

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (rangeType === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (rangeType === 'monthly') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (rangeType === 'yearly') {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }
    
    onDateChange(newDate);
  };

  const weekStart = rangeType === 'weekly' ? getWeekStart(currentDate, weekStartDay) : null;
  const weekEnd = rangeType === 'weekly' && weekStart ? getWeekEnd(currentDate) : null;

  return (
    <div className="space-y-2">
      {/* Range Type Selector */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onRangeTypeChange('weekly')}
          className={`px-3 py-1 text-xs rounded-lg transition-colors font-medium ${
            rangeType === 'weekly'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={
            rangeType === 'weekly'
              ? { backgroundColor: '#2563eb', color: '#ffffff' }
              : undefined
          }
        >
          Weekly
        </button>
        <button
          onClick={() => onRangeTypeChange('monthly')}
          className={`px-3 py-1 text-xs rounded-lg transition-colors font-medium ${
            rangeType === 'monthly'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={
            rangeType === 'monthly'
              ? { backgroundColor: '#2563eb', color: '#ffffff' }
              : undefined
          }
        >
          Monthly
        </button>
        <button
          onClick={() => onRangeTypeChange('yearly')}
          className={`px-3 py-1 text-xs rounded-lg transition-colors font-medium ${
            rangeType === 'yearly'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={
            rangeType === 'yearly'
              ? { backgroundColor: '#2563eb', color: '#ffffff' }
              : undefined
          }
        >
          Yearly
        </button>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('prev')}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={`Previous ${rangeType}`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center flex-1 px-2">
          <div className="font-medium">
            {rangeType === 'weekly' && weekStart && weekEnd ? (
              <>
                {formatDate(weekStart)} - {formatDate(weekEnd)}
                <div className="text-sm text-gray-500">{currentDate.getFullYear()}</div>
              </>
            ) : rangeType === 'monthly' ? (
              formatMonth(currentDate)
            ) : (
              formatYear(currentDate)
            )}
          </div>
        </div>

        <button
          onClick={() => navigate('next')}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={`Next ${rangeType}`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
