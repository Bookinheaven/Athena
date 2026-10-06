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
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
            className="text-muted-foreground/50 hover:text-foreground transition-colors p-0.5 rounded"
            title="Copy to clipboard"
          >
            {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
          </button>
        )}
      </div>
    </div>
  );
};

export function UserDetailModal({ user, open, onClose, onEdit, onNavigateToDevData }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'activity' | 'config'
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && user?.id) {
      fetchFullUserDetails(user.id);
    } else {
      setDetails(null);
    }
  }, [open, user?.id]);

  const fetchFullUserDetails = async (userId) => {
    setIsLoading(true);
    try {
      const res = await adminService.getUserDetails(userId);
      if (res?.success) {
        setDetails(res);
      }
    } catch (err) {
      console.warn("Could not fetch extended user details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const displayUser = details?.user || user;
  const streak = details?.streak;
  const stats = details?.stats;
  const recentSessions = details?.recentSessions || [];
  const recentTasks = details?.recentTasks || [];

  const focusHours = stats?.totalFocusMinutes ? (stats.totalFocusMinutes / 60).toFixed(1) : '0';
  const taskCompletionRate = stats?.totalTasks && stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden border-border/50 max-h-[90vh] flex flex-col">
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
            <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-1 border-b border-border/30 bg-background/50 px-6 py-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={cn(
              'px-3 py-1 font-mono text-xs rounded-md font-semibold transition-all flex items-center gap-1.5',
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
            onClick={() => setActiveTab('activity')}
            className={cn(
              'px-3 py-1 font-mono text-xs rounded-md font-semibold transition-all flex items-center gap-1.5',
              activeTab === 'activity'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Clock className="size-3" />
            Recent Activity ({recentSessions.length + recentTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={cn(
              'px-3 py-1 font-mono text-xs rounded-md font-semibold transition-all flex items-center gap-1.5',
              activeTab === 'config'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sliders className="size-3" />
            Timer Preferences
          </button>

          {isLoading && (
            <div className="ml-auto font-mono text-[10px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="size-3 animate-spin text-primary" /> syncing...
            </div>
          )}
        </div>

        {/* ── Body Content (Scrollable) ── */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: OVERVIEW & TELEMETRY */}
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
                  value={stats?.totalSessions ?? '0'}
                  subtext="Focus sessions logged"
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
                  value={`${stats?.completedTasks || 0}/${stats?.totalTasks || 0}`}
                  subtext={`${taskCompletionRate}% completed`}
                  color="text-emerald-400"
                />
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

          {/* TAB 2: RECENT ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Recent Sessions */}
              <div className="space-y-2">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                  <Timer className="size-3 text-primary" />
                  Recent Focus Sessions ({recentSessions.length})
                </div>
                {recentSessions.length === 0 ? (
                  <p className="font-mono text-xs text-muted-foreground/60 py-3 text-center border border-dashed border-border/40 rounded-lg">
                    No sessions recorded yet for this user.
                  </p>
                ) : (
                  <div className="rounded-lg border border-border/40 divide-y divide-border/20 overflow-hidden bg-muted/5 font-mono text-xs">
                    {recentSessions.map((s) => (
                      <div key={s.id} className="p-2.5 flex items-center justify-between hover:bg-muted/15 transition-colors">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-foreground truncate text-[11px]">{s.title}</p>
                          <p className="text-[10px] text-muted-foreground/60">
                            {s.startedAt ? new Date(s.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-primary font-bold">
                            {Math.round((s.durationSeconds || s.totalFocusMinutes * 60 || 0) / 60)}m
                          </span>
                          <span className={cn(
                            'text-[9px] uppercase px-1.5 py-0.5 rounded font-bold',
                            s.status === 'completed' || s.completionType === 'completed'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-destructive/10 text-destructive'
                          )}>
                            {s.completionType || s.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Tasks */}
              <div className="space-y-2 pt-2">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                  <CheckSquare className="size-3 text-emerald-400" />
                  Recent Tasks ({recentTasks.length})
                </div>
                {recentTasks.length === 0 ? (
                  <p className="font-mono text-xs text-muted-foreground/60 py-3 text-center border border-dashed border-border/40 rounded-lg">
                    No tasks found for this user.
                  </p>
                ) : (
                  <div className="rounded-lg border border-border/40 divide-y divide-border/20 overflow-hidden bg-muted/5 font-mono text-xs">
                    {recentTasks.map((t) => (
                      <div key={t.id} className="p-2.5 flex items-center justify-between hover:bg-muted/15 transition-colors">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-foreground truncate text-[11px]">{t.title}</p>
                          <p className="text-[10px] text-muted-foreground/60">
                            Priority: <span className="text-foreground">{t.priority || 'medium'}</span>
                          </p>
                        </div>
                        <span className={cn(
                          'text-[9px] uppercase px-1.5 py-0.5 rounded font-bold shrink-0',
                          t.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TIMER PREFERENCES */}
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
            className="h-8 font-mono text-[11px] text-primary hover:bg-primary/10 gap-1.5"
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
              className="h-8 font-mono text-[11px] gap-1.5 border-border/50"
            >
              <Edit className="size-3.5" />
              Edit Profile
            </Button>

            <DialogClose render={
              <Button size="sm" className="h-8 font-mono text-[11px] px-4" />
            }>
              Close
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
