import {
  Timer,
  Layers,
  Zap,
  AlertTriangle,
} from "lucide-react";

export default function TodaysInsights({
  sessions = 0,
  focusBlocks = 0,
  longestFocus = "—",
  distractions = "—",
}) {
  return (
    <div
      className="
        rounded-xl p-6
        bg-card-background
        border border-card-border/60
        hover:border-orange-400/40
        shadow-sm
        transition-colors
      "
    >
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Today Insights
        </p>
        <p className="text-xs text-text-secondary/70">
          Your activity so far today
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <InsightRow
          icon={Timer}
          label="Sessions"
          value={sessions}
        />

        <InsightRow
          icon={Layers}
          label="Focus blocks"
          value={focusBlocks}
        />

        <InsightRow
          icon={Zap}
          label="Longest focus"
          value={longestFocus}
        />

        <InsightRow
          icon={AlertTriangle}
          label="Distractions"
          value={distractions}
          valueClass={
            distractions === "Low"
              ? "text-green-400"
              : distractions === "Medium"
                ? "text-yellow-400"
                : "text-red-400"
          }
        />
      </div>
    </div>
  );
}

function InsightRow({
  icon: Icon,
  label,
  value,
  valueClass = "text-white",
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-button-primary/10 text-button-primary">
          <Icon size={18} />
        </div>
        <span className="text-neutral-400 text-base">
          {label}
        </span>
      </div>

      <span className={`font-semibold text-lg ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}
