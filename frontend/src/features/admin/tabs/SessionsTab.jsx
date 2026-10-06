import { CheckCircle, Timer, Clock, Zap, Coffee, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDuration, formatTimestamp } from '../utils/formatters';
import { MoodIcon } from '../components/MoodIcon';
import { cn } from '@/lib/utils';

const StatusBadge = ({ status, isDone }) => {
  const config = {
    active:    { icon: Zap,         text: 'active',    cls: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/25', pulse: true },
    completed: { icon: CheckCircle, text: 'done',      cls: 'bg-blue-500/10 text-blue-400 ring-blue-500/25',         pulse: false },
    abandoned: { icon: XCircle,     text: 'abandoned', cls: 'bg-destructive/10 text-destructive ring-destructive/25', pulse: false },
  };
  const c = config[status] || config.completed;
  const Icon = c.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ring-1', c.cls)}>
      {c.pulse ? <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> : <Icon className="size-2.5" />}
      {c.text}
    </span>
  );
};

export function SessionsTab({ userSessions, setSelectedSession, setShowSessionDetails }) {
  const active = userSessions.filter((s) => s.status === 'active').length;
  const done   = userSessions.filter((s) => s.isDone).length;

  return (
    <div className="space-y-4 max-w-5xl">
      {/* summary bar */}
      <div className="flex items-center gap-2 font-mono text-[11px]">
        <span className="text-muted-foreground">sessions:</span>
        <span className="text-emerald-400 font-bold">{active} live</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="text-blue-400 font-bold">{done} done</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="text-muted-foreground">{userSessions.length} total</span>
      </div>

      {userSessions.length > 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
          <div className="divide-y divide-border/20">
            {userSessions.map((session, i) => (
              <div
                key={session.id}
                className="group flex cursor-pointer items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/20"
                onClick={() => { setSelectedSession(session); setShowSessionDetails(true); }}
              >
                {/* index */}
                <span className="w-7 shrink-0 font-mono text-[10px] text-muted-foreground/40 tabular-nums">
                  {String(i + 1).padStart(3, '0')}
                </span>

                {/* avatar */}
                <div className="relative shrink-0">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/60 to-primary text-[13px] font-black text-primary-foreground ring-1 ring-primary/20 transition-transform group-hover:scale-105">
                    {session.userName ? session.userName.charAt(0).toUpperCase() : '?'}
                  </div>
                  {session.status === 'active' && (
                    <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-2 border-card bg-emerald-500" />
                  )}
                </div>

                {/* user + title */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight group-hover:text-primary transition-colors">{session.userName || 'Anonymous User'}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">{session.title}</p>
                </div>

                {/* metrics */}
                <div className="hidden sm:flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <p className="font-mono text-[11px] font-bold tabular-nums">{formatDuration(session.totalDuration)}</p>
                    <p className="font-mono text-[8px] text-muted-foreground/60 uppercase tracking-wider">duration</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-[11px] font-bold tabular-nums">{session.breaksNumber}</p>
                    <p className="font-mono text-[8px] text-muted-foreground/60 uppercase tracking-wider">breaks</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-[11px] font-bold tabular-nums">{Array.isArray(session.todos) ? session.todos.length : 0}</p>
                    <p className="font-mono text-[8px] text-muted-foreground/60 uppercase tracking-wider">tasks</p>
                  </div>
                </div>

                {/* status */}
                <div className="shrink-0">
                  <StatusBadge status={session.status} isDone={session.isDone} />
                </div>

                {/* timestamp */}
                <div className="hidden lg:block shrink-0">
                  <span className="font-mono text-[10px] text-muted-foreground/50">
                    {formatTimestamp(session.timestamp)}
                  </span>
                </div>

                {/* mood */}
                {session.mood && (
                  <div className="shrink-0">
                    <MoodIcon mood={session.mood} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/30 bg-card/40 py-16">
          <Timer className="mb-3 size-8 text-muted-foreground/20" />
          <p className="font-mono text-xs text-muted-foreground">// no sessions found</p>
        </div>
      )}
    </div>
  );
}
