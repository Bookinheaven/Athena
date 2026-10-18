import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { AlertTriangle } from "lucide-react";

export default function RoutineDeleteModal({
  open,
  onOpenChange,
  routine = null,
  onConfirm,
  isDeleting = false,
}) {
  if (!routine) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 bg-card border-border rounded-2xl shadow-xl">
        <DialogHeader className="space-y-3 text-left">
          <div className="w-10 h-10 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-lg font-semibold text-card-foreground">
              Delete Routine: "{routine.title}"?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              This will remove the routine definition and cancel all future unstarted
              occurrences.
              <br />
              <strong className="text-foreground">Historical records:</strong> Any
              previously completed or in-progress routine occurrences will remain
              preserved in your history.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="rounded-xl text-xs font-medium h-9 px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl font-semibold text-xs h-9 px-4 shadow-xs"
          >
            {isDeleting ? "Deleting..." : "Delete Routine"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
