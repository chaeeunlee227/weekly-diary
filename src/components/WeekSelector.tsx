import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type WeekStartDay } from '../lib/weekUtils';

interface WeekSelectorProps {
  currentWeek: Date;
  onWeekChange: (date: Date) => void;
  weekStartDay: WeekStartDay;
  getWeekStart: (date: Date, startDay?: WeekStartDay) => Date;
}

export function WeekSelector({ currentWeek, onWeekChange, weekStartDay, getWeekStart }: WeekSelectorProps) {

  const getWeekEnd = (date: Date) => {
    const start = getWeekStart(date, weekStartDay);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    onWeekChange(newDate);
  };

  const weekStart = getWeekStart(currentWeek, weekStartDay);
  const weekEnd = getWeekEnd(currentWeek);

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => navigateWeek('prev')}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Previous week"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="text-center">
        <div className="font-medium">
          {formatDate(weekStart)} - {formatDate(weekEnd)}
        </div>
        <div className="text-sm text-gray-500">
          {weekStart.getFullYear()}
        </div>
      </div>

      <button
        onClick={() => navigateWeek('next')}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Next week"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
