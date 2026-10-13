import { Users, UserCheck, Timer, Target, Activity, RefreshCw, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '../components/StatCard';
import { cn } from '@/lib/utils';

export function OverviewTab({ stats, lastLoginUsers, fetchUsers }) {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Users"    value={stats.totalUsers}          icon={Users}      color="blue"   delay={0}    />
        <StatCard label="Active Users"   value={stats.activeUsers}         icon={UserCheck}  color="green"  delay={0.05} />
        <StatCard label="Sessions"       value={stats.totalFocusSessions}  icon={Timer}      color="purple" delay={0.1}  />
        <StatCard label="Live"           value={stats.activeFocusSessions} icon={Target}     color="orange" delay={0.15} />
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
              <Activity className="size-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[13px] font-bold tracking-tight">Recent Activity</p>
              <p className="text-[10px] font-medium text-muted-foreground font-mono">sorted by last login</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchUsers}
            className="h-7 gap-1.5 px-3 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
          >
            <RefreshCw className="size-3" />
            refresh
          </Button>
        </div>

        {/* list */}
        {lastLoginUsers.length > 0 ? (
          <div className="divide-y divide-border/30">
            {lastLoginUsers.map((u, i) => (
              <div
                key={u.id || u._id}
                className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/20"
              >
                {/* index */}
                <span className="w-5 shrink-0 font-mono text-[10px] font-bold text-muted-foreground/40 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* avatar */}
                <div className="relative shrink-0">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/70 to-primary text-[13px] font-black text-primary-foreground ring-1 ring-primary/20">
                    {u.fullName.charAt(0).toUpperCase()}
                  </div>
                  {u.isActive && (
                    <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-[2px] border-card bg-emerald-500" />
                  )}
                </div>

                {/* info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight group-hover:text-primary transition-colors">{u.fullName}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">@{u.username}</p>
                </div>

                {/* meta */}
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {u.isActive && (
                    <Badge className="h-4 gap-1 px-1.5 text-[9px] font-bold bg-emerald-500/15 text-emerald-500 border-emerald-500/25 hover:bg-emerald-500/20">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE
                    </Badge>
                  )}
                  {u.lastLogin && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {new Date(u.lastLogin).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
            <Users className="mb-3 size-8 opacity-20" />
            <p className="font-mono text-sm">// no recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
