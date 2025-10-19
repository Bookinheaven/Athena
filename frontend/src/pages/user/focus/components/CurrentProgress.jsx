import React from "react";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

const STATUS_ICON = {
  "In Progress": Clock,
  Completed: CheckCircle2,
  Skipped: XCircle,
};

export const CurrentProgress = ({ todos }) => {
  const inProgress = todos.filter(
    (t) => t.status === "In Progress"
  );

  if (inProgress.length === 0) {
    return (
      <div className="min-w-md max-w-md p-6 bg-card-background border border-card-border rounded-2xl shadow-md text-center">
        <p className="text-text-muted">No tasks in progress right now.</p>
      </div>
    );
  }

  return (
    <div className="lg:min-w-md lg:max-w-md flex flex-col lg:h-150 p-6 bg-card-background border border-card-border rounded-2xl shadow-md">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Current Tasks
      </h3>
      <div className="p-2 overflow-y-auto">
        <ul className="space-y-3">
            {inProgress.map((todo) => {
            const Icon = STATUS_ICON[todo.status];
            const badgeColor = "bg-yellow-100 text-yellow-700";
            return (
                <li
                key={todo.id}
                className="flex items-center justify-between p-3 bg-background-secondary rounded-lg"
                >
                <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-text-secondary" />
                    <span className="font-medium text-text-primary break-words">
                    {todo.text}
                    </span>
                </div>
                <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${badgeColor}`}
                >
                    {todo.status}
                </span>
                </li>
            );
            })}
        </ul>
      </div>
      <div className="mt-4 text-sm text-text-muted">
        {inProgress.length} task{inProgress.length > 1 ? "s" : ""} ongoing
      </div>
    </div>
  );
};

export default CurrentProgress;
