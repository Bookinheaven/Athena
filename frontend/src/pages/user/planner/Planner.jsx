import { useAuth } from "../../../../contexts/AuthContext.jsx";
import { Plus, ListTodo, CalendarDays, StickyNote } from "lucide-react";

export default function Planner() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background-color text-text-primary pt-20 md:pt-10 pb-12 lg:pt-5">
      <div className="px-4 sm:px-6 lg:px-9 w-full">

        {/* TOP ACTION BAR */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-button-primary text-button-primary-text">
            <Plus size={16} /> Add Task
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-button-secondary text-button-secondary-text">
            <StickyNote size={16} /> Add Note
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-button-secondary text-button-secondary-text">
            <CalendarDays size={16} /> Schedule
          </button>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: TASKS + SCHEDULE */}
          <div className="lg:col-span-2 space-y-6">

            {/* TASKS CARD */}
            <div className="rounded-2xl p-5 bg-card-background border border-card-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ListTodo size={18} className="text-button-primary" />
                <h2 className="text-lg font-bold">Tasks</h2>
              </div>

              <div className="text-text-secondary text-sm">
                No tasks yet. Start by adding one.
              </div>
            </div>

            {/* SCHEDULE CARD */}
            <div className="rounded-2xl p-5 bg-card-background border border-card-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={18} className="text-button-primary" />
                <h2 className="text-lg font-bold">Schedule</h2>
              </div>

              <div className="text-text-secondary text-sm">
                No schedule planned.
              </div>
            </div>

          </div>

          {/* RIGHT: NOTES */}
          <div className="space-y-6">

            <div className="rounded-2xl p-5 bg-card-background border border-card-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <StickyNote size={18} className="text-button-primary" />
                <h2 className="text-lg font-bold">Notes</h2>
              </div>

              <div className="text-text-secondary text-sm">
                Capture ideas, thoughts, or plans.
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}