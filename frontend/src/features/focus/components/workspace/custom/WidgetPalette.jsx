import React from "react";
import {
  Clock,
  Target,
  Play,
  ListTodo,
  NotebookPen,
  Activity,
  AlertCircle,
  Quote,
  BarChart3,
  Plus,
  Check,
} from "lucide-react";

export const WIDGET_METADATA = {
  task: {
    title: "Current Task",
    icon: Target,
    description: "Task title, goal context & schedule block",
    minWidth: 320,
    minHeight: 144,
    defaultWidth: 720,
    defaultHeight: 176,
  },
  timer: {
    title: "Timer Countdown",
    icon: Clock,
    description: "Circular SVG timer and countdown dial",
    minWidth: 288,
    minHeight: 336,
    defaultWidth: 352,
    defaultHeight: 416,
  },
  controls: {
    title: "Session Controls",
    icon: Play,
    description: "Start, Pause, Resume, Stop and Pause Reasons",
    minWidth: 288,
    minHeight: 176,
    defaultWidth: 352,
    defaultHeight: 192,
  },
  checklist: {
    title: "Checklist",
    icon: ListTodo,
    description: "Interactive tasks and todo items",
    minWidth: 288,
    minHeight: 256,
    defaultWidth: 352,
    defaultHeight: 384,
  },
  notes: {
    title: "Focus Notes",
    icon: NotebookPen,
    description: "TipTap rich text scratchpad",
    minWidth: 304,
    minHeight: 256,
    defaultWidth: 432,
    defaultHeight: 416,
  },
  progress: {
    title: "Active Focus",
    icon: Activity,
    description: "Currently in-progress tasks summary",
    minWidth: 288,
    minHeight: 192,
    defaultWidth: 352,
    defaultHeight: 256,
  },
  distractions: {
    title: "Distraction Logger",
    icon: AlertCircle,
    description: "Quick distraction tagging and capture",
    minWidth: 288,
    minHeight: 192,
    defaultWidth: 432,
    defaultHeight: 256,
  },
  motivation: {
    title: "Daily Inspiration",
    icon: Quote,
    description: "Inspirational quote banner with author",
    minWidth: 320,
    minHeight: 80,
    defaultWidth: 1168,
    defaultHeight: 96,
  },
  stats: {
    title: "Session Metrics",
    icon: BarChart3,
    description: "Completed segments, pauses, and elapsed time",
    minWidth: 288,
    minHeight: 144,
    defaultWidth: 432,
    defaultHeight: 176,
  },
};

export const WidgetPalette = ({ layout, onToggleWidget, onClose }) => {
  return (
    <div className="p-4 bg-background/95 backdrop-blur-xl border border-border/80 rounded-3xl shadow-2xl w-80 max-h-[80vh] overflow-y-auto custom-scrollbar select-none">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/40">
        <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
          Widget Palette
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground font-bold cursor-pointer"
        >
          Close
        </button>
      </div>

      <div className="space-y-1.5">
        {Object.entries(WIDGET_METADATA).map(([key, meta]) => {
          const item = layout.find((w) => w.id === key);
          const isVisible = item?.visible;
          const Icon = meta.icon;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggleWidget(key)}
              className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all border cursor-pointer ${
                isVisible
                  ? "bg-secondary/40 border-border/40 text-foreground"
                  : "bg-background border-border/20 text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div
                  className={`p-1.5 rounded-xl ${
                    isVisible
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Icon size={15} />
                </div>
                <div className="flex-1 truncate">
                  <p className="text-xs font-bold truncate">{meta.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {meta.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                {isVisible ? (
                  <span className="p-1 rounded-full bg-emerald-500/10 text-emerald-400 inline-flex">
                    <Check size={12} />
                  </span>
                ) : (
                  <span className="p-1 rounded-full bg-secondary text-muted-foreground inline-flex">
                    <Plus size={12} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WidgetPalette;
