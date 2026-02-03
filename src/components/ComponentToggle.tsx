import { Settings, X } from 'lucide-react';
import { useState } from 'react';

interface ComponentToggleProps {
  visibleComponents: {
    habits: boolean;
    mood: boolean;
    meals: boolean;
    events: boolean;
    grateful: boolean;
    comment: boolean;
  };
  onToggle: (component: keyof ComponentToggleProps['visibleComponents']) => void;
}

const COMPONENT_LABELS = {
  habits: 'Habit Tracker',
  mood: 'Mood Tracker',
  meals: 'What I Ate',
  events: 'Main Events',
  grateful: 'Grateful Things',
  comment: 'Weekly Comment'
};

export function ComponentToggle({ visibleComponents, onToggle }: ComponentToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <Settings className="w-4 h-4" />
        Customize Components
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-20"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border z-30 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Show/Hide Components</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {(Object.keys(COMPONENT_LABELS) as Array<keyof typeof COMPONENT_LABELS>).map((key) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleComponents[key]}
                    onChange={() => onToggle(key)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{COMPONENT_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
