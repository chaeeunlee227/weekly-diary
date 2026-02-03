import { Heart } from 'lucide-react';

interface GratefulThingsProps {
  grateful: string;
  onUpdate: (grateful: string) => void;
}

export function GratefulThings({ grateful, onUpdate }: GratefulThingsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="w-5 h-5 text-pink-500" />
        <h2 className="font-semibold">Grateful Things This Week</h2>
      </div>

      <textarea
        value={grateful}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="What are you grateful for this week?"
        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={4}
      />
    </div>
  );
}
