import React, { useState } from "react";
import {
  X,
  Plus,
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { PLACEHOLDERS } from "@/constants/placeholders.js";

const STATUS_CONFIG = {
  "Not Started": {
    icon: Circle,
    color: "text-muted-foreground",
    bg: "bg-secondary/40",
    border: "border-border/50",
    label: "Not Started",
  },
  "In Progress": {
    icon: Clock,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    label: "In Progress",
  },
  "Completed": {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    label: "Completed",
  },
  "Cancelled": {
    icon: XCircle,
    color: "text-muted-foreground/60",
    bg: "bg-secondary/20",
    border: "border-border/30",
    label: "Cancelled",
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
        isExpanded ? "shadow-md scale-[1.01]" : "hover:border-border"
      } ${statusConfig.bg} ${statusConfig.border}`}
    >
      <div
        className="flex items-center justify-between gap-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <StatusIcon className={`w-5 h-5 flex-shrink-0 ${statusConfig.color}`} />
          <p
            className={`font-medium text-sm truncate transition-colors duration-300 ${
              todo.status === "Completed" || todo.status === "Cancelled"
                ? "text-muted-foreground line-through"
                : "text-foreground"
            }`}
          >
            {todo.title}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusConfig.color} bg-background/60 group-hover:opacity-0 transition-opacity`}
          >
            {statusConfig.label}
          </span>

          <div className="absolute right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-md transition-colors"
              title={isExpanded ? "Collapse" : "Change status"}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              title="Delete task"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded
            ? "grid-rows-[1fr] opacity-100 mt-3"
            : "grid-rows-[0fr] opacity-0 mt-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border/40">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const Icon = config.icon;
              const isActive = todo.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(status);
                    setIsExpanded(false);
                  }}
                  disabled={isActive}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? `${config.color} bg-background shadow-xs border border-border cursor-default`
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent hover:border-border/40"
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
  show = true,
  onClose,
  hideHeader = false,
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
    cancelled: todos.filter((t) => t.status === "Cancelled").length,
  };
  const progressCount = stats.completed + stats.cancelled;
  const progressPercent =
    stats.total > 0 ? Math.round((progressCount / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      {!hideHeader && (
        <div className="px-5 py-4 border-b border-border/40 bg-card/60 backdrop-blur-md shrink-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-black tracking-wide text-foreground flex items-center gap-2">
              Task List
            </h3>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {stats.total > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground tabular-nums w-8 text-right">
                {progressPercent}%
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0">
        <div className="space-y-2.5">
          {todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-60">
              <CheckCircle2 className="w-12 h-12 mb-3 stroke-[1.5]" />
              <p className="text-sm font-medium">You're all caught up!</p>
              <p className="text-xs mt-1">Add a task below to begin.</p>
            </div>
          ) : (
            todos.map((todo, idx) => {
              const todoId = todo.id || todo._id || `todo-${idx}`;
              return (
                <TodoItem
                  key={todoId}
                  todo={{ ...todo, id: todoId }}
                  onUpdateStatus={(status) => onUpdateStatus(todoId, status)}
                  onDelete={() => onDeleteTodo(todoId)}
                />
              );
            })
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border/40 bg-card/60 shrink-0">
        <div className="relative group">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") handleAddTodo();
            }}
            placeholder={PLACEHOLDERS.tasks.todoItem}
            className="w-full pl-4 pr-12 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
          />
          <button
            type="button"
            onClick={handleAddTodo}
            disabled={!newTodo.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square flex items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90 disabled:opacity-0 disabled:scale-90"
            title="Add task"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoList;
