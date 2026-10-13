import { Smile, Frown, Meh } from 'lucide-react';

export function MoodIcon({ mood }) {
  if (mood === 'happy') return <Smile className="size-4 text-emerald-500" />;
  if (mood === 'sad') return <Frown className="size-4 text-red-500" />;
  if (mood === 'neutral') return <Meh className="size-4 text-amber-500" />;
  return null;
}
