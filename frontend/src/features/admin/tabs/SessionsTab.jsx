import React, { useState, useMemo } from 'react';
import {
  CheckCircle,
  Timer,
  Clock,
  Zap,
  Coffee,
  XCircle,
  Search,
  User,
  X,
  Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

export function SessionsTab({
  userSessions = [],
  users = [],
  selectedUserId = null,
  onSelectUserId,
  setSelectedSession,
  setShowSessionDetails,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return userSessions.filter((s) => {
      // 1. User filter
      if (selectedUserId && s.userId !== selectedUserId) {
        return false;
      }

      // 2. Status filter
      if (statusFilter === 'active' && s.status !== 'active') return false;
      if (statusFilter === 'completed' && !s.isDone && s.status !== 'completed') return false;
      if (statusFilter === 'abandoned' && s.status !== 'abandoned' && s.completionType !== 'abandoned') return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = s.title && s.title.toLowerCase().includes(q);
        const matchesUser = s.userName && s.userName.toLowerCase().includes(q);
        const matchesEmail = s.userEmail && s.userEmail.toLowerCase().includes(q);
        if (!matchesTitle && !matchesUser && !matchesEmail) return false;
      }

      return true;
    });
  }, [userSessions, selectedUserId, statusFilter, searchQuery]);

  const active = filteredSessions.filter((s) => s.status === 'active').length;
  const done = filteredSessions.filter((s) => s.isDone).length;

  const selectedUserObj = users.find((u) => (u.id || u._id) === selectedUserId);

  return (
    <div className="space-y-4 max-w-5xl">
      {/* ── Toolbar: User Filter, Search, and Status ── */}
      <div className="rounded-xl border border-border/40 bg-card/60 p-3.5 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* User Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <User className="size-3 text-primary" />
              Filter by User:
            </span>
            <select
              value={selectedUserId || ''}
              onChange={(e) => onSelectUserId && onSelectUserId(e.target.value || null)}
              aria-label="Filter by user"
              className="h-8 rounded-lg border border-border/50 bg-background/70 px-2.5 font-mono text-xs text-foreground focus:border-primary/50 focus:outline-none"
            >
              <option value="">All Users ({users.length})</option>
              {users.map((u) => (
                <option key={u.id || u._id} value={u.id || u._id}>
                  {u.fullName || u.username} (@{u.username})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              type="text"
              placeholder="Search by session title, user or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 font-mono text-xs bg-background/50 border-border/50 rounded-lg"
            />
          </div>

          {/* Status Buttons */}
          <div className="flex items-center gap-1 font-mono text-[11px]">
            {['all', 'active', 'completed', 'abandoned'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'px-2.5 py-1 rounded-md capitalize font-semibold transition-colors cursor-pointer',
                  statusFilter === st
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filter Pill */}
        {selectedUserObj && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/20 text-xs font-mono">
            <span className="text-muted-foreground/70">Showing sessions for:</span>
            <Badge variant="secondary" className="gap-1.5 py-0.5 px-2 bg-primary/10 text-primary border-primary/20">
              <span>{selectedUserObj.fullName} (@{selectedUserObj.username})</span>
              <button
                type="button"
                onClick={() => onSelectUserId && onSelectUserId(null)}
                className="hover:text-destructive cursor-pointer"
                title="Clear user filter"
              >
                <X className="size-3" />
              </button>
            </Badge>
          </div>
        )}
      </div>

      {/* ── Summary Bar ── */}
      <div className="flex items-center justify-between font-mono text-[11px] px-1">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">sessions:</span>
          <span className="text-emerald-400 font-bold">{active} live</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-blue-400 font-bold">{done} done</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-muted-foreground">{filteredSessions.length} matching</span>
        </div>
        {userSessions.length > filteredSessions.length && (
          <span className="text-muted-foreground/50 text-[10px]">
            (filtered from {userSessions.length} total)
          </span>
        )}
      </div>

      {/* ── Sessions List ── */}
      {filteredSessions.length > 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
          <div className="divide-y divide-border/20">
            {filteredSessions.map((session, i) => (
              <div
                key={session.id || i}
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
                  <p className="truncate font-mono text-[10px] text-muted-foreground">{session.title || 'Focus Session'}</p>
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
          <p className="font-mono text-xs text-muted-foreground">// no sessions found matching criteria</p>
          {selectedUserId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectUserId && onSelectUserId(null)}
              className="mt-2 text-xs font-mono text-primary hover:underline"
            >
              Clear user filter
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
