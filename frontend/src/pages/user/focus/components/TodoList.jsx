import { useState } from "react";
import {
  X,
  Plus,
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown
} from "lucide-react";

const STATUS_CONFIG = {
  "Not Started": {
    icon: Circle,
    color: "text-gray-500",
    bg: "bg-gray-100 dark:bg-gray-800/50",
    border: "border-gray-300 dark:border-gray-600",
    label: "Not Started",
  },
  "In Progress": {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-300 dark:border-amber-500/30",
    label: "In Progress",
  },
  "Completed": {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-300 dark:border-emerald-500/30",
    label: "Completed",
  },
  "Skipped": {
    icon: XCircle,
    color: "text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-900/40",
    border: "border-gray-200 dark:border-gray-700",
    label: "Skipped",
  },
};

const TodoItem = ({ todo, onUpdateStatus, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = STATUS_CONFIG[todo.status] || STATUS_CONFIG["Not Started"];
  if (!statusConfig) return null;
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={`group relative p-3 rounded-xl border transition-all duration-300 ${
        isExpanded ? "shadow-md scale-[1.02]" : "hover:border-text-muted/30"
      } ${statusConfig.bg} ${statusConfig.border}`}
    >
      <div 
        className="flex items-center justify-between gap-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <StatusIcon className={`w-5 h-5 flex-shrink-0 ${statusConfig.color}`} />
          <p className={`font-medium truncate transition-colors duration-300 ${
            todo.status === "Completed" || todo.status === "Skipped" 
              ? "text-text-muted line-through" 
              : "text-text-primary"
          }`}>
            {todo.title}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusConfig.color} bg-background-primary/50 group-hover:opacity-0 transition-opacity`}>
            {statusConfig.label}
          </span>

          <div className="absolute right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-background-primary/50 rounded-md transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 text-text-muted hover:text-button-danger hover:bg-button-danger/10 rounded-md transition-colors"
              title="Delete task"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border-secondary/50">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const Icon = config.icon;
              const isActive = todo.status === status;
              return (
                <button
                  key={status}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(status);
                    setIsExpanded(false); // Auto-close after selection
                  }}
                  disabled={isActive}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? `${config.color} bg-background-primary shadow-sm border border-[${config.border}] cursor-default`
                      : "text-text-muted hover:text-text-primary hover:bg-background-primary/50 border border-transparent hover:border-border-secondary"
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
    </div>
  );
};

export const TodoList = ({
  show,
  onClose,
  todos = [],
  newTodo,
  setNewTodo,
  onAddTodo,
  onUpdateStatus,
  onDeleteTodo,
}) => {
  if (!show) return null;

  const handleAddTodo = () => {
    if (!newTodo.trim()) return;
    onAddTodo();
    setNewTodo("");
  };

  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.status === "Completed").length,
    skipped: todos.filter((t) => t.status === "Skipped").length,
  };
  const progressCount = stats.completed + stats.skipped;
  const progressPercent = stats.total > 0 ? Math.round((progressCount / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      
      <div className="px-5 py-4 border-b border-border-secondary shrink-0">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
            Tasks 
            <span className="bg-background-secondary text-text-muted text-xs px-2 py-0.5 rounded-full font-medium">
              {stats.total}
            </span>
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-background-secondary rounded-md transition text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sleek Progress Bar */}
        {stats.total > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-background-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-button-primary transition-all duration-700 ease-out rounded-full" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-text-muted tabular-nums w-8 text-right">
              {progressPercent}%
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0">
        <div className="space-y-2.5">
          {todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-text-muted opacity-60">
              <CheckCircle2 className="w-12 h-12 mb-3 stroke-[1.5]" />
              <p className="text-sm font-medium">You're all caught up!</p>
              <p className="text-xs mt-1">Add a task below to begin.</p>
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

      <div className="p-4 border-t border-border-secondary bg-background-primary/30 shrink-0">
        <div className="relative group">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") handleAddTodo();
            }}
            placeholder="Add a new task..."
            className="w-full pl-4 pr-12 py-3 rounded-xl bg-input-background border border-input-border text-sm text-text-primary placeholder:text-input-placeholder focus:border-button-primary focus:outline-none focus:ring-2 focus:ring-button-primary/20 transition-all shadow-sm"
          />
          <button
            onClick={handleAddTodo}
            disabled={!newTodo.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square flex items-center justify-center rounded-lg bg-button-primary text-white transition-all duration-300 hover:bg-button-primary-hover disabled:opacity-0 disabled:scale-90"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};