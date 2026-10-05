import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";

export default function TodayError({ onRetry }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] bg-background">
      <div className="text-center space-y-4 max-w-sm p-6">
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            Couldn't load today's work
          </h2>
          <p className="text-sm text-muted-foreground">
            An error occurred while connecting to Athena services.
          </p>
        </div>
        <Button
          onClick={onRetry}
          variant="outline"
          className="rounded-xl font-medium"
        >
          Retry
        </Button>
      </div>
    </div>
  );
}
