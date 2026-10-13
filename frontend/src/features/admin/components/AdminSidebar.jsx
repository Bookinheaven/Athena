import { Home, Users, Timer, Settings, Shield, PanelLeftClose, PanelLeft, LogOut, ArrowLeft, Database, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '../../../../contexts/AuthContext';

const NAV_ITEMS = [
  { id: 'dashboard',      icon: Home,     label: 'Overview',   shortcut: '01' },
  { id: 'users',          icon: Users,    label: 'Users',      shortcut: '02' },
  { id: 'user-sessions',  icon: Timer,    label: 'Sessions',   shortcut: '03' },
  { id: 'settings',       icon: Settings, label: 'Settings',   shortcut: '04' },
  { id: 'developer-data', icon: Database, label: 'Dev Data',   shortcut: '05' },
];

export function AdminSidebar({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, stats, usersCount }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Sign out of the admin panel?')) {
      logout();
      navigate('/login');
    }
  };

  const NavBtn = ({ item }) => {
    const isActive = activeTab === item.id;
    const badgeCount =
      item.id === 'users' ? usersCount
      : item.id === 'user-sessions' ? stats?.activeFocusSessions
      : null;

    const btn = (
      <button
        onClick={() => setActiveTab(item.id)}
        className={cn(
          'group relative flex w-full items-center rounded-lg transition-all duration-150 overflow-hidden',
          sidebarOpen ? 'gap-3 px-3 py-2' : 'justify-center p-2.5',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        )}
      >
        {/* active bar */}
        {isActive && <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-primary rounded-r-full" />}

        <item.icon className={cn('size-4 shrink-0 transition-transform duration-150 group-hover:scale-110', isActive && 'text-primary')} />

        {sidebarOpen && (
          <>
            <span className="flex-1 text-left text-[13px] font-medium">{item.label}</span>
            <div className="flex items-center gap-1.5">
              {badgeCount > 0 && (
                <span className="font-mono text-[9px] font-black bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                  {badgeCount}
                </span>
              )}
              <span className="font-mono text-[9px] text-muted-foreground/30">{item.shortcut}</span>
            </div>
          </>
        )}
      </button>
    );

    if (!sidebarOpen) {
      return (
        <Tooltip key={item.id} delayDuration={0}>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-xs">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return <div key={item.id}>{btn}</div>;
  };

  return (
    <aside className={cn(
      'flex flex-col border-r border-border/40 bg-card/70 backdrop-blur-xl text-foreground transition-all duration-250 ease-in-out overflow-hidden shrink-0',
      sidebarOpen ? 'w-56' : 'w-[52px]'
    )}>
      {/* header */}
      <div className={cn(
        'flex h-12 shrink-0 items-center border-b border-border/30',
        sidebarOpen ? 'justify-between px-4' : 'justify-center px-2'
      )}>
        {sidebarOpen && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Shield className="size-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-[12px] font-bold tracking-tight text-foreground">ADMIN</p>
              <p className="truncate font-mono text-[8px] font-medium text-muted-foreground/60 uppercase tracking-widest">athena sys</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <PanelLeftClose className="size-3.5" /> : <PanelLeft className="size-3.5" />}
        </Button>
      </div>

      {/* nav label */}
      {sidebarOpen && (
        <div className="px-4 pt-4 pb-1">
          <p className="font-mono text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">Navigation</p>
        </div>
      )}

      {/* nav */}
      <nav className={cn('flex-1 overflow-y-auto space-y-0.5', sidebarOpen ? 'px-2 py-1' : 'px-1.5 py-2')}>
        {NAV_ITEMS.map((item) => <NavBtn key={item.id} item={item} />)}

        {/* divider */}
        <div className={cn('my-3', sidebarOpen ? 'border-t border-border/20 mx-1' : 'border-t border-border/20')} />

        {/* back to app */}
        {sidebarOpen ? (
          <button
            onClick={() => navigate('/dashboard')}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
          >
            <ArrowLeft className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to App</span>
          </button>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate('/dashboard')}
                className="group flex w-full items-center justify-center rounded-lg p-2.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
              >
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-mono text-xs">Back to App</TooltipContent>
          </Tooltip>
        )}
      </nav>

      {/* footer */}
      <div className={cn('border-t border-border/30 p-2.5')}>
        <div className={cn('flex items-center gap-2.5 rounded-lg bg-muted/20 p-2', !sidebarOpen && 'justify-center')}>
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-[11px] font-black text-primary ring-1 ring-primary/20">
            {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold leading-tight">{user?.fullName || 'Admin'}</p>
              <p className="truncate font-mono text-[9px] text-muted-foreground">{user?.email || ''}</p>
            </div>
          )}
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
