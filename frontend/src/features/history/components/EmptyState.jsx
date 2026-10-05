import { CalendarX2, Coffee, CheckCircle2, Clock } from "lucide-react";

/**
 * Context-aware empty states for History.
 * Neutral days and empty days look intentional, calm, and trustworthy—never broken.
 */
export function EmptyState({ type = "completely_empty", message, action }) {
  const configs = {
    no_plan: {
      icon: Coffee,
      iconColor: "text-muted-foreground/60",
      bgColor: "bg-muted/30",
      title: "Neutral Day",
      description:
        message ||
        "No intentional work was scheduled for this day. Streak remains neutral and unaffected.",
    },
    plan_no_sessions: {
      icon: Clock,
      iconColor: "text-amber-500/70",
      bgColor: "bg-amber-500/10",
      title: "No Sessions Executed",
      description:
        message ||
        "Tasks were planned for this product day, but no Focus sessions were run.",
    },
    sessions_no_tasks: {
      icon: CheckCircle2,
      iconColor: "text-blue-500/70",
      bgColor: "bg-blue-500/10",
      title: "Ad-Hoc Focus",
      description:
        message ||
        "Focus sessions were completed on this day without formal task planning.",
    },
    no_tasks: {
      icon: CalendarX2,
      iconColor: "text-muted-foreground/50",
      bgColor: "bg-muted/20",
      title: "No Planned Tasks",
      description:
        message || "No tasks were scheduled for this product day.",
    },
    no_sessions: {
      icon: Clock,
      iconColor: "text-muted-foreground/50",
      bgColor: "bg-muted/20",
      title: "No Focus Sessions",
      description:
        message || "No focus sessions were recorded on this day.",
    },
    completely_empty: {
      icon: CalendarX2,
      iconColor: "text-muted-foreground/40",
      bgColor: "bg-muted/10",
      title: "No Activity Recorded",
      description:
        message ||
        "No planned tasks or focus sessions exist for this day.",
    },
  };

  const config = configs[type] || configs.completely_empty;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-border/40 bg-card/40 text-center animate-in fade-in duration-200">
      <div className={`p-3 rounded-2xl ${config.bgColor} mb-3`}>
        <Icon className={`w-6 h-6 ${config.iconColor}`} />
      </div>
      <h4 className="text-sm font-semibold text-foreground mb-1">
        {config.title}
      </h4>
      <p className="text-xs text-muted-foreground max-w-sm">
        {config.description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
