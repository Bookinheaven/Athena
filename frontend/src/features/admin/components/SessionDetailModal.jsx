import { Timer, Coffee, Target, Calendar, ListTodo, CheckCircle, FileText, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { formatDuration, formatTimestamp } from '../utils/formatters';
import { MoodIcon } from './MoodIcon';

const MetricCell = ({ label, value, icon: Icon, accent }) => (
  <div className={cn(
    'rounded-lg border p-3 text-center',
    accent
      ? 'border-primary/20 bg-primary/5'
      : 'border-border/30 bg-muted/20'
  )}>
    {Icon && <Icon className={cn('mx-auto mb-1 size-3.5', accent ? 'text-primary' : 'text-muted-foreground/60')} />}
    <p className="font-mono text-[13px] font-black tabular-nums">{value}</p>
    <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground/50 mt-0.5">{label}</p>
  </div>
);

const StatusBadge = ({ status, isDone }) => {
  const cfg = {
    active:    'bg-emerald-500/10 text-emerald-400 ring-emerald-500/25',
    completed: 'bg-blue-500/10 text-blue-400 ring-blue-500/25',
    abandoned: 'bg-destructive/10 text-destructive ring-destructive/25',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ring-1', cfg[status] || cfg.completed)}>
      {status === 'active' && <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {status}
    </span>
  );
};

export function SessionDetailModal({ session, open, onClose }) {
  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-border/50 max-h-[90vh] overflow-y-auto">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-border/30 bg-muted/20 px-5 py-4 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/60 to-primary font-mono text-sm font-black text-primary-foreground ring-1 ring-primary/20">
            {session.userName?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight truncate text-sm">{session.userName}</p>
            <p className="font-mono text-[10px] text-muted-foreground truncate">{session.title}</p>
          </div>
          <StatusBadge status={session.status} isDone={session.isDone} />
        </div>

        <div className="p-5 space-y-4">
          {/* metrics grid */}
          <div className="grid grid-cols-4 gap-2">
            <MetricCell label="duration"    value={formatDuration(session.totalDuration)}  icon={Timer}  accent />
            <MetricCell label="breaks"      value={session.breaksNumber}                   icon={Coffee} />
            <MetricCell label="tasks"       value={Array.isArray(session.todos) ? session.todos.length : 0} icon={ListTodo} />
            <MetricCell label="focus/5"     value={session.focus ?? '—'}                  icon={Target} />
          </div>

          {/* timestamp */}
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
            <Calendar className="size-3" />
            {formatTimestamp(session.timestamp)}
          </div>

          {/* todos */}
          {session.todos?.length > 0 && (
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Tasks</p>
              <div className="space-y-1 rounded-lg border border-border/30 bg-muted/10 p-2">
                {session.todos.map((todo, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs">
                    <CheckCircle className={cn('size-3.5 shrink-0', todo.completed ? 'text-emerald-500' : 'text-muted-foreground/30')} />
                    <span className={cn('font-mono', todo.completed && 'text-muted-foreground line-through')}>{todo.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* notes */}
          {session.notes?.length > 0 && (
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Notes</p>
              <div className="space-y-1 rounded-lg border border-border/30 bg-muted/10 p-3">
                {session.notes.map((note, i) => (
                  <p key={i} className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                    {note.content || note.text || note}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* feedback */}
          {(session.mood || session.distractions) && (
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Feedback</p>
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/30 bg-muted/10 px-3 py-2.5">
                {session.mood && (
                  <div className="flex items-center gap-1.5">
                    <MoodIcon mood={session.mood} />
                    <span className="font-mono text-xs capitalize text-muted-foreground">{session.mood}</span>
                  </div>
                )}
                {session.distractions && (
                  <p className="font-mono text-xs text-muted-foreground">{session.distractions}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border/30 px-5 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-border/50 bg-muted/20 py-1.5 font-mono text-[11px] text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
          >
            close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
