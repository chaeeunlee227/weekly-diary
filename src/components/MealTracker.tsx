import { Coffee, Sun, Moon, Cookie } from 'lucide-react';
import { useState } from 'react';
import { getDaysArray, type WeekStartDay } from '../lib/weekUtils';

interface MealTrackerProps {
  meals: {
    [day: number]: {
      breakfast: string;
      lunch: string;
      dinner: string;
      extra: string;
    };
  };
  weekStart: Date;
  onUpdate: (meals: MealTrackerProps['meals']) => void;
  weekStartDay?: WeekStartDay;
}

const MEAL_CATEGORIES = [
  { key: 'breakfast' as const, label: 'Breakfast', icon: Coffee, color: 'text-orange-500' },
  { key: 'lunch' as const, label: 'Lunch', icon: Sun, color: 'text-yellow-500' },
  { key: 'dinner' as const, label: 'Dinner', icon: Moon, color: 'text-indigo-500' },
  { key: 'extra' as const, label: 'Extra', icon: Cookie, color: 'text-pink-500' }
];

export function MealTracker({ meals, weekStart, onUpdate, weekStartDay = 'sunday' }: MealTrackerProps) {
  const DAYS = getDaysArray(weekStartDay, 'full');
  const [expandedDay, setExpandedDay] = useState<number | null>(0);

  const updateMeal = (dayIndex: number, category: string, value: string) => {
    const updated = {
      ...meals,
      [dayIndex]: {
        ...(meals[dayIndex] || { breakfast: '', lunch: '', dinner: '', extra: '' }),
        [category]: value
      }
    };
    onUpdate(updated);
  };

  const hasMeals = (dayIndex: number) => {
    const dayMeals = meals[dayIndex];
    if (!dayMeals) return false;
    return Object.values(dayMeals).some(v => v.trim() !== '');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h2 className="font-semibold mb-4">What I Ate</h2>

      <div className="space-y-2">
        {DAYS.map((day, dayIndex) => (
          <div key={dayIndex} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedDay(expandedDay === dayIndex ? null : dayIndex)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-sm">{day}</span>
              <div className="flex items-center gap-2">
                {hasMeals(dayIndex) && (
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                )}
                <span className="text-gray-400">
                  {expandedDay === dayIndex ? '−' : '+'}
                </span>
              </div>
            </button>

            {expandedDay === dayIndex && (
              <div className="px-4 pb-4 space-y-3 bg-gray-50">
                {MEAL_CATEGORIES.map(({ key, label, icon: Icon, color }) => (
                  <div key={key}>
                    <label className="flex items-center gap-2 mb-1.5">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                    <input
                      type="text"
                      value={meals[dayIndex]?.[key] || ''}
                      onChange={(e) => updateMeal(dayIndex, key, e.target.value)}
                      placeholder={`What did you have for ${label.toLowerCase()}?`}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
