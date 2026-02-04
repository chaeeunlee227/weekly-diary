import { Calendar, Heart, MessageSquare, CheckCircle2 } from 'lucide-react';
import type { WeekData } from '../App';
import { getDaysArray, type WeekStartDay } from '../lib/weekUtils';

interface WeekSummaryProps {
  weekData: WeekData;
  weekStart: Date;
  weekStartDay: WeekStartDay;
  onClose: () => void;
  onSave: () => void;
}

export function WeekSummary({ weekData, weekStart, weekStartDay, onClose, onSave }: WeekSummaryProps) {
  const DAYS = getDaysArray(weekStartDay, 'short');
  
  // Calculate statistics
  const validMoods = weekData.moods.filter(m => m > 0);
  const moodAverage = validMoods.length > 0
    ? (validMoods.reduce((sum, m) => sum + m, 0) / validMoods.length).toFixed(1)
    : null;

  const trackers = weekData.habits.trackers || [];
  let habitCompletion = 0;
  if (trackers.length > 0) {
    let totalCompletions = 0;
    let totalPossible = trackers.length * 7;
    trackers.forEach(tracker => {
      const completed = weekData.habits.completed[tracker] || [];
      totalCompletions += completed.filter(Boolean).length;
    });
    habitCompletion = totalPossible > 0
      ? Math.round((totalCompletions / totalPossible) * 100)
      : 0;
  }

  const eventsCount = weekData.events?.length || 0;
  const hasGrateful = weekData.grateful?.trim().length > 0;
  const hasComment = weekData.comment?.trim().length > 0;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Week Summary</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Week Range */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(weekStart)} - {formatDate(weekEnd)}</span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            {moodAverage !== null && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Mood Average</div>
                <div className="text-xl font-semibold text-blue-900">{moodAverage}</div>
              </div>
            )}
            
            {trackers.length > 0 && (
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Habit Completion</div>
                <div className="text-xl font-semibold text-green-900">{habitCompletion}%</div>
              </div>
            )}
          </div>

          {/* Habits Summary */}
          {trackers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <h3 className="font-medium text-sm">Habits ({trackers.length})</h3>
              </div>
              <div className="space-y-1">
                {trackers.slice(0, 5).map((tracker, idx) => {
                  const completed = weekData.habits.completed[tracker] || [];
                  const completedCount = completed.filter(Boolean).length;
                  return (
                    <div key={idx} className="text-sm flex items-center justify-between">
                      <span className="text-gray-700">{tracker}</span>
                      <span className="text-gray-500">{completedCount}/7</span>
                    </div>
                  );
                })}
                {trackers.length > 5 && (
                  <div className="text-xs text-gray-500">+{trackers.length - 5} more</div>
                )}
              </div>
            </div>
          )}

          {/* Events Summary */}
          {eventsCount > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <h3 className="font-medium text-sm">Events ({eventsCount})</h3>
              </div>
              <div className="text-sm text-gray-700">
                {weekData.events.slice(0, 3).map((event, idx) => (
                  <div key={idx} className="mb-1">
                    • {event.text}
                  </div>
                ))}
                {eventsCount > 3 && (
                  <div className="text-xs text-gray-500">+{eventsCount - 3} more</div>
                )}
              </div>
            </div>
          )}

          {/* Grateful Things */}
          {hasGrateful && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-pink-500" />
                <h3 className="font-medium text-sm">Grateful For</h3>
              </div>
              <div className="text-sm text-gray-700 bg-pink-50 rounded p-2">
                {weekData.grateful.length > 100
                  ? `${weekData.grateful.substring(0, 100)}...`
                  : weekData.grateful}
              </div>
            </div>
          )}

          {/* Comment Preview */}
          {hasComment && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <h3 className="font-medium text-sm">Weekly Comment</h3>
              </div>
              <div className="text-sm text-gray-700 bg-blue-50 rounded p-2">
                {weekData.comment.length > 150
                  ? `${weekData.comment.substring(0, 150)}...`
                  : weekData.comment}
              </div>
            </div>
          )}

          {/* Empty State */}
          {trackers.length === 0 && !hasGrateful && !hasComment && eventsCount === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No data recorded for this week yet.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t px-4 py-3 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Save Week
          </button>
        </div>
      </div>
    </div>
  );
}
