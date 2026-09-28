import { Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.jsx";

export default function TodayInsight({ insight }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Insight
      </h2>

      <Card className="border-border bg-card shadow-xs rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0 mt-0.5">
              <Brain className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
              {insight?.longest_focus && insight.longest_focus > 0
                ? `Your longest focus session today was ${Math.round(
                    insight.longest_focus / 60
                  )} minutes. Great sustained effort.`
                : insight?.sessions && insight.sessions > 0
                ? `You completed ${insight.sessions} focus ${
                    insight.sessions === 1 ? "session" : "sessions"
                  } today.`
                : "Complete a focus session today to start building today's behavioral picture."}
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
