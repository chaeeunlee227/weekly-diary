import { Smile, Meh, Frown } from 'lucide-react';
import { getDaysArray, type WeekStartDay } from '../lib/weekUtils';

interface MoodTrackerProps {
  moods: number[]; // 7 days, scores 1-6 (0 = not set)
  weekStart: Date;
  onUpdate: (moods: number[]) => void;
  weekStartDay?: WeekStartDay;
}

const MOOD_OPTIONS = [
  { label: 'Very Good', score: 6, color: 'bg-green-500', emoji: '😄' },
  { label: 'Good', score: 5, color: 'bg-green-400', emoji: '🙂' },
  { label: 'Okay', score: 4, color: 'bg-yellow-400', emoji: '😐' },
  { label: 'Not Bad', score: 3, color: 'bg-orange-400', emoji: '😕' },
  { label: 'Awful', score: 2, color: 'bg-red-400', emoji: '😢' },
  { label: 'Worst', score: 1, color: 'bg-red-600', emoji: '😭' }
];

export function MoodTracker({ moods, weekStart, onUpdate, weekStartDay = 'sunday' }: MoodTrackerProps) {
  const DAYS = getDaysArray(weekStartDay, 'short');
  const setMood = (dayIndex: number, score: number) => {
    const updated = [...moods];
    // Toggle: if clicking the same mood, remove it (set to 0)
    updated[dayIndex] = moods[dayIndex] === score ? 0 : score;
    onUpdate(updated);
  };

  const calculateAverage = () => {
    const validMoods = moods.filter(m => m > 0);
    if (validMoods.length === 0) return null;
    const sum = validMoods.reduce((acc, m) => acc + m, 0);
    return (sum / validMoods.length).toFixed(1);
  };

  const average = calculateAverage();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Mood Tracker</h2>
        {average && (
          <div className="text-sm">
            <span className="text-gray-500">Avg: </span>
            <span className="font-semibold text-blue-600">{average}</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {DAYS.map((day, index) => {
          const currentMood = moods[index] || 0;
          const selectedMood = MOOD_OPTIONS.find(m => m.score === currentMood);

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{day}</span>
                {selectedMood && (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                    {selectedMood.emoji} {selectedMood.label}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-6 gap-1">
                {MOOD_OPTIONS.slice().reverse().map((mood) => (
                  <button
                    key={mood.score}
                    onClick={() => setMood(index, mood.score)}
                    className={`
                      aspect-square rounded-lg border-2 flex items-center justify-center text-lg
                      transition-all
                      ${currentMood === mood.score 
                        ? `${mood.color} border-gray-800 scale-105` 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-400'
                      }
                    `}
                    title={mood.label}
                  >
                    {mood.emoji}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>1 = Worst</span>
            <span className="text-center -ml-8">2 = Awful&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
            <span>3 = Not Bad</span>
          </div>
          <div className="flex items-center justify-between">
            <span>4 = Okay</span>
            <span className="text-center -ml-8">5 = Good</span>
            <span>6 = Very Good</span>
          </div>
        </div>
      </div>
    </div>
  );
}
