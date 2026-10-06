import { Settings, RefreshCw, Terminal, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const SettingRow = ({ title, description, action }) => (
  <div className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/20">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">{title}</p>
      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{description}</p>
    </div>
    {action}
    <ChevronRight className="size-3.5 text-muted-foreground/30 shrink-0 group-hover:text-muted-foreground transition-colors" />
  </div>
);

export function SettingsTab() {
  return (
    <div className="max-w-2xl space-y-4">
      {/* System Settings */}
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-border/30 bg-muted/10 px-5 py-3.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
            <Settings className="size-3.5 text-primary" />
          </div>
          <div>
            <p className="text-[13px] font-bold tracking-tight">System Settings</p>
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">admin config</p>
          </div>
        </div>

        <div className="divide-y divide-border/20">
          <SettingRow
            title="Clear Admin Cache"
            description="// force refresh all cached admin data"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success('Cache cleared.')}
                className="h-7 gap-1.5 px-3 font-mono text-[11px] rounded-lg border-border/50"
              >
                <RefreshCw className="size-3" />
                run
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
