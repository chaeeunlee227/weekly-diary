import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useState } from 'react';

interface HabitTrackerProps {
  data: {
    trackers: string[];
    completed: { [tracker: string]: boolean[] };
  };
  weekStart: Date;
  onUpdate: (data: HabitTrackerProps['data']) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HabitTracker({ data, weekStart, onUpdate }: HabitTrackerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newHabit, setNewHabit] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  const addHabit = () => {
    if (newHabit.trim()) {
      const updated = {
        trackers: [...data.trackers, newHabit.trim()],
        completed: {
          ...data.completed,
          [newHabit.trim()]: [false, false, false, false, false, false, false]
        }
      };
      onUpdate(updated);
      setNewHabit('');
      setIsAdding(false);
    }
  };

  const deleteHabit = (tracker: string) => {
    const newCompleted = { ...data.completed };
    delete newCompleted[tracker];
    onUpdate({
      trackers: data.trackers.filter(t => t !== tracker),
      completed: newCompleted
    });
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingText(data.trackers[index]);
  };

  const saveEdit = () => {
    if (editingIndex !== null && editingText.trim()) {
      const oldTracker = data.trackers[editingIndex];
      const newTrackers = [...data.trackers];
      newTrackers[editingIndex] = editingText.trim();
      
      const newCompleted = { ...data.completed };
      if (oldTracker !== editingText.trim()) {
        newCompleted[editingText.trim()] = newCompleted[oldTracker] || [false, false, false, false, false, false, false];
        delete newCompleted[oldTracker];
      }
      
      onUpdate({
        trackers: newTrackers,
        completed: newCompleted
      });
      setEditingIndex(null);
      setEditingText('');
    }
  };

  const toggleDay = (tracker: string, dayIndex: number) => {
    const current = data.completed[tracker] || [false, false, false, false, false, false, false];
    const updated = [...current];
    updated[dayIndex] = !updated[dayIndex];
    
    onUpdate({
      ...data,
      completed: {
        ...data.completed,
        [tracker]: updated
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Habit Tracker</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Add habit"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {isAdding && (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addHabit()}
            placeholder="New habit..."
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={addHabit}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsAdding(false);
              setNewHabit('');
            }}
            className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {data.trackers.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">
          No habits yet. Click + to add one.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-1 justify-end pr-16">
            {DAYS.map(day => (
              <div key={day} className="w-8 text-center text-xs text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {data.trackers.map((tracker, index) => (
            <div key={tracker} className="flex items-center gap-2">
              {editingIndex === index ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={saveEdit}
                    className="p-1 hover:bg-green-50 rounded"
                  >
                    <Check className="w-4 h-4 text-green-600" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingIndex(null);
                      setEditingText('');
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 text-sm min-w-0">
                    <span className="truncate block">{tracker}</span>
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                      const completed = data.completed[tracker]?.[dayIndex] || false;
                      return (
                        <button
                          key={dayIndex}
                          onClick={() => toggleDay(tracker, dayIndex)}
                          className={`w-8 h-8 rounded border transition-colors ${
                            completed
                              ? 'bg-blue-500 border-blue-500'
                              : 'bg-white border-gray-300 hover:border-blue-300'
                          }`}
                        >
                          {completed && (
                            <Check className="w-4 h-4 text-white mx-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => startEditing(index)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => deleteHabit(tracker)}
                    className="p-1 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
