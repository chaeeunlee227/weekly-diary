import { Plus, Trash2, Edit2, Check, X, Save, FolderOpen, ChevronUp, GripVertical } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HabitTrackerProps {
  data: {
    trackers: string[];
    completed: { [tracker: string]: boolean[] };
  };
  weekStart: Date;
  onUpdate: (data: HabitTrackerProps['data']) => void;
  userId?: string;
}

interface HabitTemplate {
  id: string;
  name: string;
  trackers: string[];
  createdAt: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STORAGE_KEY = 'habitTemplates';

// Template management functions
const getTemplates = (userId?: string): HabitTemplate[] => {
  try {
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveTemplate = (template: Omit<HabitTemplate, 'id' | 'createdAt'>, userId?: string): HabitTemplate => {
  const templates = getTemplates(userId);
  const newTemplate: HabitTemplate = {
    id: Date.now().toString(),
    ...template,
    createdAt: Date.now()
  };
  templates.push(newTemplate);
  const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
  localStorage.setItem(key, JSON.stringify(templates));
  return newTemplate;
};

const deleteTemplate = (id: string, userId?: string): void => {
  const templates = getTemplates(userId);
  const filtered = templates.filter(t => t.id !== id);
  const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
  localStorage.setItem(key, JSON.stringify(filtered));
};

export function HabitTracker({ data, weekStart, onUpdate, userId }: HabitTrackerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newHabit, setNewHabit] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState<HabitTemplate[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchStartIndex, setTouchStartIndex] = useState<number | null>(null);

  // Load templates on mount and when userId changes
  useEffect(() => {
    setTemplates(getTemplates(userId));
  }, [userId]);

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

  const moveHabit = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newTrackers = [...data.trackers];
    const newCompleted = { ...data.completed };

    // Remove item from original position
    const [movedTracker] = newTrackers.splice(fromIndex, 1);
    const movedCompleted = newCompleted[movedTracker] || [false, false, false, false, false, false, false];

    // Insert at new position
    newTrackers.splice(toIndex, 0, movedTracker);

    // Rebuild completed object in new order
    const reorderedCompleted: { [tracker: string]: boolean[] } = {};
    newTrackers.forEach(tracker => {
      reorderedCompleted[tracker] = newCompleted[tracker] || [false, false, false, false, false, false, false];
    });

    onUpdate({
      trackers: newTrackers,
      completed: reorderedCompleted
    });
  };

  // Mouse drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Required for Firefox
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveHabit(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Touch drag handlers for mobile
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    // Don't start drag if clicking on buttons (edit, delete, checkboxes)
    const target = e.target as HTMLElement;
    const isButton = target.closest('button') && !target.closest('.grip-handle');
    
    if (!isButton) {
      const touch = e.touches[0];
      setTouchStartY(touch.clientY);
      setTouchStartIndex(index);
      setDraggedIndex(index);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null || touchStartIndex === null) return;
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - touchStartY;

    // Only start dragging if moved significantly (to avoid accidental drags)
    if (Math.abs(deltaY) > 15) {
      e.preventDefault(); // Prevent scrolling while dragging
      
      // Find which item we're over based on touch position
      const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
      const habitRow = elements.find(el => el.getAttribute('data-habit-index') !== null);
      
      if (habitRow) {
        const overIndex = parseInt(habitRow.getAttribute('data-habit-index') || '-1');
        if (overIndex >= 0 && overIndex !== touchStartIndex) {
          setDragOverIndex(overIndex);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchStartIndex !== null && dragOverIndex !== null && touchStartIndex !== dragOverIndex) {
      moveHabit(touchStartIndex, dragOverIndex);
    }
    setTouchStartY(null);
    setTouchStartIndex(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim() || data.trackers.length === 0) return;
    
    const newTemplate = saveTemplate({
      name: templateName.trim(),
      trackers: data.trackers
    }, userId);
    
    setTemplates(getTemplates(userId));
    setTemplateName('');
    setIsSavingTemplate(false);
  };

  const handleApplyTemplate = (template: HabitTemplate) => {
    const newCompleted: { [tracker: string]: boolean[] } = {};
    template.trackers.forEach(tracker => {
      newCompleted[tracker] = [false, false, false, false, false, false, false];
    });
    
    onUpdate({
      trackers: template.trackers,
      completed: newCompleted
    });
    setShowTemplates(false);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(id, userId);
      setTemplates(getTemplates(userId));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Habit Tracker</h2>
        <div className="flex items-center gap-2">
          {data.trackers.length > 0 && (
            <button
              onClick={() => setIsSavingTemplate(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Save as template"
              title="Save as template"
            >
              <Save className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Templates"
            title="Templates"
          >
            <FolderOpen className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Add habit"
            title="Add habit"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Save Template Dialog */}
      {isSavingTemplate && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTemplate();
                if (e.key === 'Escape') {
                  setIsSavingTemplate(false);
                  setTemplateName('');
                }
              }}
              placeholder="Template name..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsSavingTemplate(false);
                setTemplateName('');
              }}
              className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      {showTemplates && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Saved Templates</h3>
            <button
              onClick={() => setShowTemplates(false)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          {templates.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">No templates saved yet</p>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {template.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {template.trackers.length} habit{template.trackers.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleApplyTemplate(template)}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      title="Apply template"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-1 hover:bg-red-50 rounded"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
            <div
              key={tracker}
              data-habit-index={index}
              draggable={editingIndex !== index}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`
                flex items-center gap-2 p-2 rounded-lg transition-all
                ${draggedIndex === index ? 'opacity-50 bg-blue-50' : ''}
                ${dragOverIndex === index && draggedIndex !== index ? 'bg-blue-100 border-2 border-blue-300 border-dashed' : ''}
                ${editingIndex !== index ? 'cursor-move' : ''}
              `}
            >
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
                  <div className="flex-shrink-0 cursor-grab active:cursor-grabbing grip-handle touch-manipulation">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>
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
                    className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                    title="Edit habit"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => deleteHabit(tracker)}
                    className="p-1 hover:bg-red-50 rounded flex-shrink-0"
                    title="Delete habit"
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
