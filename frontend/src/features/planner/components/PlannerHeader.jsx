import { Plus, Calendar, Clock, CheckSquare, Target, FileText } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";

export default function PlannerHeader({
  activeTab = "today",
  onTabChange,
  todayCount = 0,
  timelineCount = undefined,
  tasksCount = 0,
  goalsCount = 0,
  notesCount = 0,
  onOpenCreateTask,
  onOpenCreateGoal,
}) {
  const tabs = [
    {
      id: "today",
      label: "Today",
      icon: Calendar,
      count: todayCount,
    },
    {
      id: "timeline",
      label: "Timeline",
      icon: Clock,
      count: timelineCount,
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: CheckSquare,
      count: tasksCount,
    },
    {
      id: "goals",
      label: "Goals",
      icon: Target,
      count: goalsCount,
    },
    {
      id: "notes",
      label: "Notes",
      icon: FileText,
      count: notesCount,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top row: Page title and primary create actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Plan
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Organize your goals, tasks, and today's work.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCreateGoal}
            className="rounded-xl font-medium text-xs h-9 px-3.5"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> New Goal
          </Button>
          <Button
            size="sm"
            onClick={onOpenCreateTask}
            className="rounded-xl font-semibold text-xs h-9 px-4 shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1" /> New Task
          </Button>
        </div>
      </div>

      {/* Primary view tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-secondary/40 rounded-xl w-full sm:w-fit border border-border/40 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                isActive
                  ? "bg-card text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? "bg-secondary text-foreground font-semibold"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
