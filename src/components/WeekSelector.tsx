import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekSelectorProps {
  currentWeek: Date;
  onWeekChange: (date: Date) => void;
}

export function WeekSelector({ currentWeek, onWeekChange }: WeekSelectorProps) {
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekEnd = (date: Date) => {
    const start = getWeekStart(date);
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

  const weekStart = getWeekStart(currentWeek);
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
