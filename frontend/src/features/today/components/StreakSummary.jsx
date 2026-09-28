import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { formatMinutes } from "../hooks/useTodayData.js";

export default function StreakSummary({
  streakDays = 0,
  focusMinutes = 0,
  targetMinutes = 25,
}) {
  return (
    <Card className="md:col-span-5 lg:col-span-4 border-border bg-card shadow-xs rounded-2xl">
      <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Streak
          </span>
          <Badge
            variant="secondary"
            className="text-[11px] font-medium px-2 py-0.5 rounded-md"
          >
            Daily target {formatMinutes(targetMinutes)}
          </Badge>
        </div>

        <div className="flex items-baseline gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500 fill-amber-500/20 shrink-0" />
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {streakDays} {streakDays === 1 ? "day" : "days"}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-medium">
          {focusMinutes >= targetMinutes
            ? "Today's goal completed"
            : `${formatMinutes(focusMinutes)} focused toward today's streak`}
        </p>
      </CardContent>
    </Card>
  );
}
