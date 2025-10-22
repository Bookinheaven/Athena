import React from "react";
import { Clock, CheckCircle2, XCircle, X } from "lucide-react";

const STATUS_ICON = {
  "In Progress": Clock,
  Completed: CheckCircle2,
  Skipped: XCircle,
};

export const CurrentProgress = ({ todos, show, onClose }) => {
  const inProgress = todos.filter(
    (t) => t.status === "In Progress"
  );

  if (inProgress.length === 0) {
    return (
      <div className="min-w-md max-w-md h-170 p-6 bg-card-background border border-card-border rounded-2xl shadow-md text-center"
      style={{
        display: show ? "block" : "none",
      }}>
        <div className="flex justify-between">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Current Tasks
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-300 text-text-secondary hover:text-text-primary shadow-none hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>
      </div>
        <p className="text-text-muted">No tasks in progress right now.</p>
      </div>
    );
  }

  return (
    <div className="min-w-md max-w-md h-170 flex flex-col p-6 bg-card-background border border-card-border rounded-2xl shadow-md"
    style={{
        display: show ? "flex" : "none",
    }}>
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Current Tasks
        </h3>
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-all duration-300 text-text-secondary hover:text-text-primary shadow-none hover:scale-110"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
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
