import { useState, useEffect } from "react";
import { Play, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";

export default function DurationModal({
  open,
  onOpenChange,
  tasksToStart = [],
  onConfirmStart,
}) {
  const [duration, setDuration] = useState(25);

  useEffect(() => {
    if (open) {
      setDuration(25);
    }
  }, [open]);

  const handleStart = () => {
    if (duration >= 5 && duration <= 999) {
      onConfirmStart(duration, tasksToStart);
    }
  };

  const isMultiple = tasksToStart.length > 1;
  const singleTask = tasksToStart[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 bg-card border-border rounded-2xl shadow-lg">
        <DialogHeader className="space-y-1.5 text-left">
          <DialogTitle className="text-xl font-semibold text-card-foreground">
            Start Focus Session
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isMultiple
              ? `Focus on ${tasksToStart.length} selected tasks`
              : singleTask?.title
              ? `Focus on "${singleTask.title}"`
              : "Ready to enter deep focus"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Presets */}
          <div className="grid grid-cols-4 gap-2">
            {[15, 25, 45, 60].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDuration(m)}
                className={`py-3 px-2 rounded-xl text-center font-medium transition-all border ${
                  duration === m
                    ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                    : "bg-secondary/40 text-foreground border-border hover:bg-secondary"
                }`}
              >
                <div className="text-base">{m}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-80">
                  min
                </div>
              </button>
            ))}
          </div>

          {/* Custom Duration Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Custom Duration (minutes)
            </label>
            <div className="relative flex items-center">
              <Clock className="w-4 h-4 text-muted-foreground absolute left-3 pointer-events-none" />
              <Input
                type="number"
                min={5}
                max={999}
                value={duration || ""}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                className="pl-9 pr-12 h-10 rounded-xl"
              />
              <span className="text-xs font-medium text-muted-foreground absolute right-3 pointer-events-none">
                min
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="gap-2 rounded-xl font-semibold px-5 shadow-xs"
            disabled={!duration || duration < 5}
            onClick={handleStart}
          >
            <Play className="w-4 h-4 fill-current" />
            Start Focus
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
