import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type WeekStartDay } from '../lib/weekUtils';

interface WeekSelectorProps {
  currentWeek: Date;
  onWeekChange: (date: Date) => void;
  weekStartDay: WeekStartDay;
  getWeekStart: (date: Date, startDay?: WeekStartDay) => Date;
}

export function WeekSelector({ currentWeek, onWeekChange, weekStartDay, getWeekStart }: WeekSelectorProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

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

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      navigateWeek('next');
    }
    if (isRightSwipe) {
      navigateWeek('prev');
    }
  };

  const weekStart = getWeekStart(currentWeek, weekStartDay);
  const weekEnd = getWeekEnd(currentWeek);

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-between touch-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <button
        onClick={() => navigateWeek('prev')}
        className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Previous week"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="text-center flex-1 px-2">
        <div className="font-medium">
          {formatDate(weekStart)} - {formatDate(weekEnd)}
        </div>
        <div className="text-sm text-gray-500">
          {weekStart.getFullYear()}
        </div>
      </div>

      <button
        onClick={() => navigateWeek('next')}
        className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Next week"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
