import React from "react";
import {
  X,
  PlusCircle,
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  "Not Started": {
    icon: Circle,
    color: "text-gray-500",
    bg: "bg-gray-100 dark:bg-gray-800",
    border: "border-gray-300 dark:border-gray-600",
    label: "Not Started",
  },
  "In Progress": {
    icon: Clock,
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-300 dark:border-yellow-600",
    label: "In Progress",
  },
  Completed: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-300 dark:border-green-600",
    label: "Completed",
  },
  Skipped: {
    icon: XCircle,
    color: "text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-900/20",
    border: "border-gray-200 dark:border-gray-700",
    label: "Skipped",
  },
};

const TodoItem = ({ todo, onUpdateStatus, onDelete }) => {
  const [showActions, setShowActions] = React.useState(false);
  const statusConfig = STATUS_CONFIG[todo.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-500 transform hover:scale-[1.0] hover:shadow-lg ${statusConfig.bg} ${statusConfig.border}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        transitionProperty: "all, transform, box-shadow",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <StatusIcon
            className={`w-5 h-5 mt-0.5 flex-shrink-0 ${statusConfig.color}`}
          />
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <p className="font-medium text-text-primary break-all pr-2">
                {todo.text}
              </p>
              {/* <div className="flex-shrink-0 px-1.5 py-0.5 text-xs font-mono rounded bg-background-secondary text-text-muted border border-border-secondary">
                ID: {todo.id}
              </div> */}
          </div>
            <span className={`text-xs ${statusConfig.color} font-medium`}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        <button
          onClick={onDelete}
          className={`text-button-danger transition-all duration-500 opacity-0 translate-x-2 ${
            showActions ? "opacity-100 translate-x-0" : ""
          }`}
          title="Delete task"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          showActions
            ? "max-h-40 opacity-100 mt-3 pt-3 border-t border-border-secondary"
            : "max-h-0 opacity-0 mt-0 pt-0 border-transparent"
        }`}
      >
        <div className="flex flex-wrap gap-2 overflow-y-hidden">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={status}
                onClick={() => onUpdateStatus(status)}
                disabled={todo.status === status}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                  todo.status === status
                    ? `${config.bg} ${config.color} border ${config.border} cursor-not-allowed`
                    : "bg-background-secondary text-text-secondary hover:bg-background-secondary-contrast border border-border-secondary"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const TodoList = ({
  show,
  onClose,
  todos,
  newTodo,
  setNewTodo,
  onAddTodo,
  onUpdateStatus,
  onDeleteTodo,
}) => {
  const handleAddTodo = () => {
    onAddTodo();
    setNewTodo("");
  };

  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.status === "Completed").length,
    inProgress: todos.filter((t) => t.status === "In Progress").length,
    notStarted: todos.filter((t) => t.status === "Not Started").length,
    skipped: todos.filter((t) => t.status === "Skipped").length,
  };
  const progressCount = stats.completed + stats.skipped;
  const progressPercent =
    stats.total > 0 ? Math.round((progressCount / stats.total) * 100) : 0;

  return (
    <div
      className={`w-full h-full fixed inset-0 z-50 transition-all duration-300 ease-in-out ${
        show ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`flex flex-col absolute right-0 top-0 h-full w-full max-w-md bg-card-background border-l border-card-border shadow-2xl transform transition-transform duration-300 ease-in-out ${
          show ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-card-border">
          <h3 className="text-xl font-semibold text-text-primary">Tasks</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-300 text-text-secondary hover:text-text-primary shadow-none hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-card-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => {e.stopPropagation(); e.key === "Enter" && handleAddTodo();}}
              placeholder="Add a new task..."
              className="flex-1 px-4 py-3 rounded-xl focus-ring-primary bg-input-background border border-input-border text-text-primary placeholder:text-input-placeholder"
            />
            <button
              onClick={handleAddTodo}
              className="px-5 py-3 rounded-xl font-semibold transition-all duration-300 bg-button-primary text-button-primary-text hover:bg-button-primary-hover"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {todos.length > 0 && (
          <div className="p-6 pb-4 border-b border-card-border">
            <div className="flex gap-2 flex-wrap">
              <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                Total: {stats.total}
              </div>
              {stats.notStarted > 0 && (
                <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  <Circle className="w-3 h-3 inline mr-1" />
                  {stats.notStarted} Not Started
                </div>
              )}
              {stats.inProgress > 0 && (
                <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {stats.inProgress} In Progress
                </div>
              )}
              {stats.completed > 0 && (
                <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-500">
                  <CheckCircle2 className="w-3 h-3 inline mr-1" />
                  {stats.completed} Completed
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-3">
              {todos.length === 0 ? (
                <div className="text-center py-12 text-text-muted">
                  <Circle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No tasks yet. Add one to get started!</p>
                </div>
              ) : (
                todos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onUpdateStatus={(status) => onUpdateStatus(todo.id, status)}
                    onDelete={() => onDeleteTodo(todo.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {todos.length > 0 && (
          <div className="p-4 border-t border-card-border bg-background-secondary/50">
            <div className="flex justify-between text-xs text-text-muted">
              <span>
                {progressCount} of {stats.total} done
              </span>
              <span>{progressPercent}% done</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};