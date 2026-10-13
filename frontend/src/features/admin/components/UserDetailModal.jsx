import React, { useState, useEffect } from 'react';
import {
  Edit,
  User,
  Mail,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Flame,
  Target,
  Timer,
  CheckSquare,
  Copy,
  Check,
  Layers,
  Settings,
  Sparkles,
  Loader2,
  Database,
  Sliders,
  ExternalLink,
  Search,
  Star,
  Smile,
  AlertCircle,
  Filter,
  ArrowUpRight,
  Activity,
  Zap,
  Coffee,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import adminService from '../../../../services/adminService';
import toast from 'react-hot-toast';

const MetricBadge = ({ icon: Icon, label, value, subtext, color = 'text-primary' }) => (
  <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-center transition-all hover:bg-muted/20">
    <div className="flex items-center justify-center gap-1.5 mb-1">
      {Icon && <Icon className={cn('size-3.5', color)} />}
      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
    </div>
    <p className={cn('font-mono text-base font-black tabular-nums', color)}>{value}</p>
    {subtext && <p className="font-mono text-[8px] text-muted-foreground/50 mt-0.5">{subtext}</p>}
  </div>
);

const DetailRow = ({ label, value, valueClass, copyable }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/20 last:border-0 text-xs">
      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <span className={cn('font-mono text-[11px] font-medium text-foreground', valueClass)}>
          {value ?? '—'}
        </span>
        {copyable && value && (
          <button
            type="button"
            onClick={handleCopy}
            className="text-muted-foreground/50 hover:text-foreground transition-colors p-0.5 rounded cursor-pointer"
            title="Copy to clipboard"
          >
            {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
          </button>
        )}
      </div>
    </div>
  );
};

export function UserDetailModal({
  user,
  open,
  onClose,
  onEdit,
  initialTab = 'overview',
  onInspectSession,
  onViewInSessionsTab,
  onNavigateToDevData
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'overview' | 'sessions' | 'tasks' | 'goals-schedule' | 'config'
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Search & filter states
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionStatusFilter, setSessionStatusFilter] = useState('all');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');

  useEffect(() => {
    if (open && user?.id) {
      setActiveTab(initialTab || 'overview');
      fetchFullUserData(user.id);
    } else {
      setDetails(null);
      setSessionSearch('');
      setTaskSearch('');
    }
  }, [open, user?.id, initialTab]);

  const fetchFullUserData = async (userId) => {
    setIsLoading(true);
    try {
      const res = await adminService.getUserData(userId);
      if (res?.success) {
        setDetails(res);
      } else {
        const fallback = await adminService.getUserDetails(userId);
        if (fallback?.success) setDetails(fallback);
      }
    } catch (err) {
      console.warn("Could not fetch full user data, using details fallback:", err);
      try {
        const fallback = await adminService.getUserDetails(userId);
        if (fallback?.success) setDetails(fallback);
      } catch (e) {
        console.error("Failed fetching user details:", e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const displayUser = details?.user || user;
  const streak = details?.streak;
  const stats = details?.stats;
  const allSessions = details?.sessions || details?.recentSessions || [];
  const allTasks = details?.tasks || details?.recentTasks || [];
  const allGoals = details?.goals || [];
  const allScheduleBlocks = details?.scheduleBlocks || [];

  const focusHours = stats?.totalFocusMinutes ? (stats.totalFocusMinutes / 60).toFixed(1) : '0';
  const taskCompletionRate = stats?.totalTasks && stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  // Filtered Sessions
  const filteredSessions = allSessions.filter((s) => {
    const matchesSearch = !sessionSearch ||
      (s.title && s.title.toLowerCase().includes(sessionSearch.toLowerCase())) ||
      (s.id && s.id.toLowerCase().includes(sessionSearch.toLowerCase()));
    const matchesStatus = sessionStatusFilter === 'all' ||
      (sessionStatusFilter === 'completed' && (s.status === 'completed' || s.completionType === 'completed')) ||
      (sessionStatusFilter === 'active' && s.status === 'active') ||
      (sessionStatusFilter === 'abandoned' && (s.completionType === 'abandoned' || s.status === 'abandoned'));
    return matchesSearch && matchesStatus;
  });

  // Filtered Tasks
  const filteredTasks = allTasks.filter((t) => {
    const matchesSearch = !taskSearch ||
      (t.title && t.title.toLowerCase().includes(taskSearch.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(taskSearch.toLowerCase()));
    const matchesStatus = taskStatusFilter === 'all' || t.status === taskStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden border-border/50 max-h-[92vh] flex flex-col">
        {/* ── Top Header ── */}
        <div className="flex items-center gap-3.5 border-b border-border/30 bg-muted/20 px-6 py-4 shrink-0">
          <div className="relative">
            <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/70 to-primary font-mono text-xl font-black text-primary-foreground shadow-sm ring-1 ring-primary/20">
              {displayUser.fullName?.charAt(0).toUpperCase() || displayUser.username?.charAt(0).toUpperCase() || '?'}
            </div>
            {displayUser.isActive && (
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-emerald-500" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-base leading-tight truncate text-foreground">
                {displayUser.fullName || displayUser.username}
              </p>
              <span
                className={cn(
                  'font-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border',
                  displayUser.accountType === 'admin' || displayUser.type === 'admin'
                    ? 'border-violet-500/30 bg-violet-500/10 text-violet-400'
                    : 'border-border/40 bg-muted/30 text-muted-foreground'
                )}
              >
                {displayUser.accountType || displayUser.type || 'user'}
              </span>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
              <span>@{displayUser.username}</span>
              <span>•</span>
              <span>{displayUser.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onViewInSessionsTab && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 font-mono text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => onViewInSessionsTab(displayUser.id || displayUser._id)}
              >
                <Timer className="size-3" />
                Live Sessions View
              </Button>
            )}
            {displayUser.isEmailVerified ? (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                <CheckCircle className="size-3" /> verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                <XCircle className="size-3" /> unverified
              </span>
            )}
          </div>
        </div>

        {/* ── Sub-navigation Tabs ── */}
        <div className="flex items-center gap-1 border-b border-border/30 bg-background/50 px-6 py-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={cn(
              'px-3 py-1 font-mono text-xs rounded-md font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
              activeTab === 'overview'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <User className="size-3" />
            Overview & Telemetry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={cn(
              'px-3 py-1 font-mono text-xs rounded-md font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
              activeTab === 'sessions'
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Timer className="size-3" />
            Sessions ({allSessions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={cn(
              'px-3 py-1 font-mono text-xs rounded-md font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
              activeTab === 'tasks'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CheckSquare className="size-3" />
            Tasks ({allTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('goals-schedule')}
            className={cn(
              'px-3 py-1 font-mono text-xs rounded-md font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
              activeTab === 'goals-schedule'
                ? 'bg-violet-500/15 text-violet-400'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="size-3" />
            Goals & Timeline ({allGoals.length + allScheduleBlocks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={cn(
              'px-3 py-1 font-mono text-xs rounded-md font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
              activeTab === 'config'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sliders className="size-3" />
            Preferences
          </button>

          {isLoading && (
            <div className="ml-auto font-mono text-[10px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="size-3 animate-spin text-primary" /> syncing...
            </div>
          )}
        </div>

        {/* ── Body Content (Scrollable) ── */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <MetricBadge
                  icon={Timer}
                  label="Focus Time"
                  value={`${focusHours}h`}
                  subtext={`${stats?.totalFocusMinutes || 0} minutes total`}
                  color="text-primary"
                />
                <MetricBadge
                  icon={Target}
                  label="Sessions"
                  value={stats?.totalSessions ?? allSessions.length}
                  subtext={`${stats?.completedSessions ?? 0} completed`}
                  color="text-violet-400"
                />
                <MetricBadge
                  icon={Flame}
                  label="Streak"
                  value={`${streak?.currentStreak || 0}d`}
                  subtext={`Best: ${streak?.longestStreak || 0} days`}
                  color="text-amber-400"
                />
                <MetricBadge
                  icon={CheckSquare}
                  label="Tasks"
                  value={`${stats?.completedTasks || 0}/${stats?.totalTasks || allTasks.length}`}
                  subtext={`${taskCompletionRate}% completed`}
                  color="text-emerald-400"
                />
              </div>

              {/* Quick Jump Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('sessions')}
                  className="rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 p-3 text-left transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <p className="font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      Inspect {allSessions.length} Sessions
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      Durations, mood & ratings
                    </p>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground/60 group-hover:text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className="rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 p-3 text-left transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <p className="font-mono text-xs font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                      Inspect {allTasks.length} Tasks
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      Priorities & deferral friction
                    </p>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground/60 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('goals-schedule')}
                  className="rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 p-3 text-left transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <p className="font-mono text-xs font-bold text-foreground group-hover:text-violet-400 transition-colors">
                      Timeline & Goals
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      {allGoals.length} goals · {allScheduleBlocks.length} blocks
                    </p>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground/60 group-hover:text-violet-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>

              {/* Identity & Account Specs */}
              <div className="rounded-xl border border-border/40 bg-card/60 p-4 space-y-1">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 flex items-center gap-1.5">
                  <Database className="size-3 text-primary" />
                  Account Record
                </div>
                <DetailRow label="User ID (UUID)" value={displayUser.id} copyable valueClass="text-muted-foreground" />
                <DetailRow label="Username" value={displayUser.username} copyable />
                <DetailRow label="Email Address" value={displayUser.email} copyable />
                <DetailRow
                  label="Account Type"
                  value={displayUser.accountType || displayUser.type}
                  valueClass={displayUser.accountType === 'admin' ? 'text-violet-400' : 'text-foreground'}
                />
                <DetailRow
                  label="Status"
                  value={displayUser.isActive ? 'Active (Live)' : 'Inactive / Idle'}
                  valueClass={displayUser.isActive ? 'text-emerald-400' : 'text-muted-foreground'}
                />
                <DetailRow
                  label="Created At"
                  value={displayUser.createdAt ? new Date(displayUser.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                />
                <DetailRow
                  label="Last Login"
                  value={displayUser.lastLogin ? new Date(displayUser.lastLogin).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                />
                <DetailRow
                  label="Timezone"
                  value={displayUser.settings?.timezone || displayUser.timezone || 'UTC'}
                />
                <DetailRow
                  label="Interface Theme"
                  value={displayUser.settings?.theme || displayUser.theme || 'dark'}
                />
              </div>
            </div>
          )}

          {/* TAB 2: SESSIONS EXPLORER */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              {/* Search & Filter Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    type="text"
                    placeholder="Search sessions by title or ID..."
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    className="h-8 pl-8 font-mono text-xs bg-background/50 border-border/50 rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-1 font-mono text-[11px]">
                  {['all', 'completed', 'active', 'abandoned'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSessionStatusFilter(st)}
                      className={cn(
                        'px-2.5 py-1 rounded-md capitalize font-semibold transition-colors cursor-pointer',
                        sessionStatusFilter === st
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sessions List */}
              {filteredSessions.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-border/40 rounded-xl">
                  <Timer className="size-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="font-mono text-xs text-muted-foreground">// no sessions matching criteria</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border/40 divide-y divide-border/20 overflow-hidden bg-card/40 font-mono text-xs">
                  {filteredSessions.map((s, idx) => {
                    const dur = s.durationMinutes ?? Math.round((s.durationSeconds || s.totalFocusMinutes * 60 || 0) / 60);
                    const isDone = s.status === 'completed' || s.completionType === 'completed';
                    const isActive = s.status === 'active';

                    return (
                      <div
                        key={s.id || idx}
                        className="p-3.5 hover:bg-muted/20 transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-foreground text-xs group-hover:text-primary transition-colors truncate max-w-sm">
                              {s.title || 'Focus Session'}
                            </span>
                            <span
                              className={cn(
                                'text-[9px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider',
                                isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'
                                  : isDone
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-destructive/10 text-destructive border border-destructive/20'
                              )}
                            >
                              {s.completionType || s.status}
                            </span>
                            {s.sessionType && (
                              <span className="text-[9px] text-muted-foreground/70 uppercase px-1 rounded bg-muted/40">
                                {s.sessionType}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {s.startedAt ? new Date(s.startedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </span>
                            <span>•</span>
                            <span className="text-foreground font-semibold">
                              {dur}m focus
                            </span>
                            {s.totalBreakMinutes > 0 && (
                              <>
                                <span>•</span>
                                <span>{s.totalBreakMinutes}m breaks</span>
                              </>
                            )}
                            {s.pauseCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{s.pauseCount} pauses</span>
                              </>
                            )}
                          </div>

                          {/* Session Feedback / Rating if exists */}
                          {s.feedback && (
                            <div className="mt-1 pt-1 border-t border-border/20 flex items-center gap-3 text-[10px] text-muted-foreground">
                              {s.feedback.focusRating && (
                                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                                  <Star className="size-2.5 fill-amber-400" />
                                  Focus: {s.feedback.focusRating}/5
                                </span>
                              )}
                              {s.feedback.moodRating && (
                                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                  <Smile className="size-2.5" />
                                  Mood: {s.feedback.moodRating}/5
                                </span>
                              )}
                              {s.feedback.distractionsNotes && (
                                <span className="text-muted-foreground/70 italic truncate max-w-xs">
                                  "{s.feedback.distractionsNotes}"
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {onInspectSession && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onInspectSession(s)}
                            className="h-7 px-2.5 font-mono text-[10px] gap-1 shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            inspect
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TASKS & FRICTION */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {/* Task search & filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    type="text"
                    placeholder="Search tasks..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className="h-8 pl-8 font-mono text-xs bg-background/50 border-border/50 rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-1 font-mono text-[11px]">
                  {['all', 'todo', 'in_progress', 'completed', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTaskStatusFilter(st)}
                      className={cn(
                        'px-2.5 py-1 rounded-md capitalize font-semibold transition-colors cursor-pointer',
                        taskStatusFilter === st
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-border/40 rounded-xl">
                  <CheckSquare className="size-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="font-mono text-xs text-muted-foreground">// no tasks matching criteria</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border/40 divide-y divide-border/20 overflow-hidden bg-card/40 font-mono text-xs">
                  {filteredTasks.map((t, idx) => {
                    const isCompleted = t.status === 'completed';
                    const hasFriction = (t.rescheduleCount || 0) >= 3 && !isCompleted;

                    return (
                      <div
                        key={t.id || idx}
                        className="p-3.5 hover:bg-muted/20 transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn('font-semibold text-xs transition-colors', isCompleted ? 'line-through text-muted-foreground' : 'text-foreground')}>
                              {t.title}
                            </span>
                            <span
                              className={cn(
                                'text-[9px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider',
                                isCompleted
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : t.status === 'in_progress'
                                  ? 'bg-primary/10 text-primary border border-primary/20'
                                  : 'bg-muted/60 text-muted-foreground'
                              )}
                            >
                              {t.status || 'todo'}
                            </span>
                            {t.priority && (
                              <span
                                className={cn(
                                  'text-[9px] uppercase px-1.5 py-0.5 rounded font-bold',
                                  t.priority === 'high' ? 'text-destructive bg-destructive/10' : 'text-muted-foreground bg-muted/40'
                                )}
                              >
                                {t.priority}
                              </span>
                            )}
                            {hasFriction && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                <RefreshCw className="size-2.5 animate-spin" />
                                {t.rescheduleCount} reschedules (friction)
                              </span>
                            )}
                          </div>

                          {t.description && (
                            <p className="text-[11px] text-muted-foreground/70 line-clamp-1">
                              {t.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 flex-wrap">
                            {t.plannedProductDate && (
                              <span>Planned: {String(t.plannedProductDate).slice(0, 10)}</span>
                            )}
                            {t.dueDate && (
                              <span>Due: {String(t.dueDate).slice(0, 10)}</span>
                            )}
                            {t.createdAt && (
                              <span>Created: {new Date(t.createdAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GOALS & SCHEDULE BLOCKS */}
          {activeTab === 'goals-schedule' && (
            <div className="space-y-5">
              {/* Goals */}
              <div className="space-y-2">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                  <Target className="size-3 text-violet-400" />
                  User Goals ({allGoals.length})
                </div>
                {allGoals.length === 0 ? (
                  <p className="font-mono text-xs text-muted-foreground/60 py-3 text-center border border-dashed border-border/40 rounded-lg">
                    No goals defined for this user.
                  </p>
                ) : (
                  <div className="rounded-lg border border-border/40 divide-y divide-border/20 overflow-hidden bg-card/40 font-mono text-xs">
                    {allGoals.map((g, idx) => (
                      <div key={g.id || idx} className="p-3 flex items-center justify-between hover:bg-muted/15 transition-colors">
                        <div>
                          <p className="font-semibold text-foreground text-xs">{g.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                            {g.category && <span>Category: {g.category}</span>}
                            {g.targetDate && <span>Target: {String(g.targetDate).slice(0, 10)}</span>}
                          </div>
                        </div>
                        <span className={cn(
                          'text-[9px] uppercase px-1.5 py-0.5 rounded font-bold',
                          g.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted/60 text-muted-foreground'
                        )}>
                          {g.status || 'active'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule Blocks */}
              <div className="space-y-2 pt-2">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                  <Calendar className="size-3 text-primary" />
                  Planned Schedule Blocks ({allScheduleBlocks.length})
                </div>
                {allScheduleBlocks.length === 0 ? (
                  <p className="font-mono text-xs text-muted-foreground/60 py-3 text-center border border-dashed border-border/40 rounded-lg">
                    No calendar blocks scheduled.
                  </p>
                ) : (
                  <div className="rounded-lg border border-border/40 divide-y divide-border/20 overflow-hidden bg-card/40 font-mono text-xs">
                    {allScheduleBlocks.slice(0, 15).map((b, idx) => (
                      <div key={b.id || idx} className="p-2.5 flex items-center justify-between hover:bg-muted/15 transition-colors">
                        <div>
                          <p className="font-semibold text-foreground text-xs">{b.title || 'Focus Block'}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Date: {String(b.productDate || b.date).slice(0, 10)} • {b.durationMinutes || 25}m
                          </p>
                        </div>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-muted/60 text-muted-foreground">
                          {b.status || 'scheduled'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: TIMER PREFERENCES */}
          {activeTab === 'config' && (
            <div className="rounded-xl border border-border/40 bg-card/60 p-4 space-y-1">
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 flex items-center gap-1.5">
                <Settings className="size-3 text-primary" />
                Focus Session Settings
              </div>
              <DetailRow
                label="Break Duration"
                value={`${Math.round((displayUser.settings?.session?.breakDuration || 300) / 60)} minutes`}
              />
              <DetailRow
                label="Breaks Cycle Count"
                value={displayUser.settings?.session?.breaksNumber ?? 4}
              />
              <DetailRow
                label="Auto-Start Breaks"
                value={displayUser.settings?.session?.autoStartBreaks ? 'Enabled' : 'Disabled'}
                valueClass={displayUser.settings?.session?.autoStartBreaks ? 'text-emerald-400' : 'text-muted-foreground'}
              />
              <DetailRow
                label="Skip Breaks"
                value={displayUser.settings?.session?.skipBreaks ? 'Enabled' : 'Disabled'}
              />
              <DetailRow
                label="Sound Alerts"
                value={displayUser.settings?.session?.isSoundEnabled ? 'Enabled' : 'Disabled'}
              />
              <DetailRow
                label="Transition Sounds"
                value={displayUser.settings?.session?.soundOnTransition ? 'Enabled' : 'Disabled'}
              />
              <DetailRow
                label="Daily Streak Target"
                value={`${streak?.dailyTargetMinutes || 25} minutes/day`}
              />
              <DetailRow
                label="Streak Freeze Balance"
                value={`${streak?.freezeBalance || 0} freezes remaining`}
                valueClass="text-amber-400"
              />
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex items-center justify-between border-t border-border/30 bg-muted/10 px-6 py-3.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onClose();
              if (onNavigateToDevData) onNavigateToDevData(displayUser.id);
            }}
            className="h-8 font-mono text-[11px] text-primary hover:bg-primary/10 gap-1.5 cursor-pointer"
          >
            <Sparkles className="size-3.5" />
            Seed Developer Data
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(displayUser);
              }}
              className="h-8 font-mono text-[11px] gap-1.5 border-border/50 cursor-pointer"
            >
              <Edit className="size-3.5" />
              Edit Profile
            </Button>

            <DialogClose render={
              <Button size="sm" className="h-8 font-mono text-[11px] px-4 cursor-pointer" />
            }>
              Close
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
