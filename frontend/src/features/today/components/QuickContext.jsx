import { Target, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { formatMinutes } from "../hooks/useTodayData.js";

export default function QuickContext({
  targetMinutes = 25,
  focusMinutes = 0,
  remainingMinutes = 0,
  completedTasksCount = 0,
  totalTasksCount = 0,
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Quick Context
      </h2>

      <Card className="border-border bg-card shadow-xs rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground/70" />
                Today's Target
              </span>
              <span className="font-semibold text-foreground">
                {formatMinutes(targetMinutes)}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground/70" />
                Focused Time
              </span>
              <span className="font-semibold text-foreground">
                {formatMinutes(focusMinutes)}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-muted-foreground/70" />
                Remaining Target
              </span>
              <span className="font-semibold text-foreground">
                {remainingMinutes > 0
                  ? formatMinutes(remainingMinutes)
                  : "Completed"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground/70" />
                Tasks Done
              </span>
              <span className="font-semibold text-foreground">
                {completedTasksCount} of {totalTasksCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
