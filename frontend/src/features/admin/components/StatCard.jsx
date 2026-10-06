import { Users, UserCheck, Timer, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({ label, value, icon: Icon, color, delay = 0 }) {
  const colorConfig = {
    blue:   { ring: 'ring-blue-500/30',   text: 'text-blue-400',   bg: 'bg-blue-500/10',   glow: 'shadow-blue-500/20' },
    green:  { ring: 'ring-emerald-500/30',text: 'text-emerald-400',bg: 'bg-emerald-500/10',glow: 'shadow-emerald-500/20' },
    purple: { ring: 'ring-violet-500/30', text: 'text-violet-400', bg: 'bg-violet-500/10', glow: 'shadow-violet-500/20' },
    orange: { ring: 'ring-amber-500/30',  text: 'text-amber-400',  bg: 'bg-amber-500/10',  glow: 'shadow-amber-500/20' },
  };

  const c = colorConfig[color] || colorConfig.blue;

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
        c.glow
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      {/* top row */}
      <div className="flex items-center justify-between">
        <div className={cn('flex size-9 items-center justify-center rounded-lg ring-1 transition-all duration-300 group-hover:scale-110', c.ring, c.bg)}>
          <Icon className={cn('size-4', c.text)} />
        </div>
        <span className={cn('font-mono text-[10px] font-bold uppercase tracking-widest', c.text)}>
          SYS
        </span>
      </div>

      {/* value */}
      <div>
        <p className="font-mono text-3xl font-black tracking-tighter tabular-nums">{value ?? '—'}</p>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>

      {/* decorative corner */}
      <div className={cn('absolute bottom-3 right-3 size-1.5 rounded-full animate-pulse', c.bg, 'ring-1', c.ring)} />
    </div>
  );
}
