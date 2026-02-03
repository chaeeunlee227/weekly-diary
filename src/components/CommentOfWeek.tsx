import { MessageSquare } from 'lucide-react';

interface CommentOfWeekProps {
  comment: string;
  onUpdate: (comment: string) => void;
}

export function CommentOfWeek({ comment, onUpdate }: CommentOfWeekProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-5 h-5 text-blue-500" />
        <h2 className="font-semibold">Weekly Comment</h2>
      </div>

      <textarea
        value={comment}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="How was your week overall? Any thoughts or reflections?"
        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={5}
      />
    </div>
  );
}
