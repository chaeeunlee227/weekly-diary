import { Plus, Trash2, Calendar } from 'lucide-react';
import { useState } from 'react';

interface MainEventsProps {
  events: Array<{
    id: string;
    date: Date;
    text: string;
  }>;
  weekStart: Date;
  onUpdate: (events: MainEventsProps['events']) => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function MainEvents({ events, weekStart, onUpdate }: MainEventsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(weekStart);
  const [newEventText, setNewEventText] = useState('');

  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const addEvent = () => {
    if (newEventText.trim() && events.length < 3) {
      const newEvent = {
        id: Date.now().toString(),
        date: selectedDate,
        text: newEventText.trim()
      };
      onUpdate([...events, newEvent]);
      setNewEventText('');
      setIsAdding(false);
    }
  };

  const deleteEvent = (id: string) => {
    onUpdate(events.filter(e => e.id !== id));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDayName = (date: Date) => {
    return DAYS[date.getDay()];
  };

  const weekDates = getWeekDates();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Main Events</h2>
        {events.length < 3 && (
          <button
            onClick={() => setIsAdding(true)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Add event"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Select Date</label>
            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((date, index) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      p-2 rounded text-xs flex flex-col items-center gap-1
                      ${isSelected 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border hover:border-blue-300'
                      }
                    `}
                  >
                    <span className="font-medium">{DAYS[index].slice(0, 3)}</span>
                    <span>{date.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Event Description</label>
            <textarea
              value={newEventText}
              onChange={(e) => setNewEventText(e.target.value)}
              placeholder="What happened on this day?"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={addEvent}
              disabled={!newEventText.trim()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Event
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewEventText('');
              }}
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">
          No events yet. Click + to add one (max 3).
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="border rounded-lg p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm font-medium">
                      {getDayName(new Date(event.date))}, {formatDate(new Date(event.date))}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{event.text}</p>
                </div>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="p-1 hover:bg-red-50 rounded flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
          {events.length < 3 && (
            <p className="text-xs text-gray-400 text-center">
              {3 - events.length} more event{3 - events.length !== 1 ? 's' : ''} can be added
            </p>
          )}
        </div>
      )}
    </div>
  );
}
