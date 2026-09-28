import { useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";

export default function TimelineHeader({
  selectedDate,
  dateNav,
  blocks = [],
  isSaving = false,
}) {
  const isToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return selectedDate === today;
  }, [selectedDate]);

  const formattedDate = useMemo(() => {
    if (!selectedDate) return "";
    const [year, month, day] = selectedDate.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  const totalScheduledMinutes = useMemo(() => {
    return blocks.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);
  }, [blocks]);

  const formattedTotalTime = useMemo(() => {
    const hours = Math.floor(totalScheduledMinutes / 60);
    const mins = totalScheduledMinutes % 60;
    if (hours === 0 && mins === 0) return "0h";
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }, [totalScheduledMinutes]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card/60 border border-border/60 rounded-2xl backdrop-blur-xs">
      {/* Date Navigation */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-secondary/60 rounded-xl p-1 border border-border/40">
          <Button
            variant="ghost"
            size="icon"
            onClick={dateNav.goToPrevDay}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant={isToday ? "secondary" : "ghost"}
            size="sm"
            onClick={dateNav.goToToday}
            className={`h-8 px-3 text-xs font-semibold rounded-lg ${
              isToday ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
            }`}
          >
            Today
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={dateNav.goToNextDay}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative flex items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => dateNav.goToDate(e.target.value)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
            title="Jump to date"
          />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/40 hover:bg-secondary/70 border border-border/40 rounded-xl transition-colors cursor-pointer text-xs font-medium text-foreground">
            <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold">{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Stats and Saving State */}
      <div className="flex items-center gap-3">
        {isSaving && (
          <span className="text-[11px] text-muted-foreground animate-pulse font-medium">
            Saving changes...
          </span>
        )}
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary/40 border border-border/40 px-3 py-1.5 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>
            <strong className="text-foreground font-semibold">{blocks.length}</strong> {blocks.length === 1 ? "block" : "blocks"}
          </span>
          <span className="text-border">•</span>
          <span>
            <strong className="text-foreground font-semibold">{formattedTotalTime}</strong> planned
          </span>
        </div>
      </div>
    </div>
  );
}
