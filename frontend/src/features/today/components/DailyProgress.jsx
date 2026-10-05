import { Card, CardContent } from "@/components/ui/card.jsx";
import { formatMinutes } from "../hooks/useTodayData.js";

export default function DailyProgress({
  focusMinutes = 0,
  targetMinutes = 25,
  progressPercent = 0,
  remainingMinutes = 0,
}) {
  return (
    <Card className="md:col-span-7 lg:col-span-8 border-border bg-card shadow-xs rounded-2xl">
      <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Today's Progress
          </span>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {formatMinutes(focusMinutes)} / {formatMinutes(targetMinutes)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="h-3 w-full bg-secondary/80 rounded-full overflow-hidden border border-border/40 p-0.5">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>{progressPercent}% of daily target</span>
            <span>
              {remainingMinutes > 0
                ? `${formatMinutes(remainingMinutes)} remaining`
                : "Target completed"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
