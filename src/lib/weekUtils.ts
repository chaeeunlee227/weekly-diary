export type WeekStartDay = 'sunday' | 'monday';

export const getDaysArray = (weekStartDay: WeekStartDay, format: 'short' | 'full' = 'short'): string[] => {
  const daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const days = format === 'full' ? daysFull : daysShort;
  
  if (weekStartDay === 'monday') {
    // Move Sunday to the end
    return [...days.slice(1), days[0]];
  }
  
  return days;
};
