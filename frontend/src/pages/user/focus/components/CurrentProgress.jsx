import React from "react";
import { Clock, Activity, CheckCircle2, X } from "lucide-react";

export const CurrentProgress = ({ todos = [], show, onClose }) => {
  if (!show) return null;

  const inProgress = todos.filter((t) => t.status === "In Progress");

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      
      <div className="flex justify-between items-center px-5 py-4 border-b border-border-secondary shrink-0">
        <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Activity className="w-4 h-4 text-button-primary" />
          Current Focus
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-background-secondary rounded-md transition text-text-muted hover:text-text-primary"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-0">
        {inProgress.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-60">
            <CheckCircle2 className="w-12 h-12 mb-3 stroke-[1.5]" />
            <p className="text-sm font-medium">No active tasks</p>
            <p className="text-xs mt-1 text-center">Set a task to "In Progress" <br/> from your Todo list.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inProgress.map((todo) => (
              <div
                key={todo.id}
                className="group relative p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 transition-all duration-300 hover:bg-amber-500/10 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-4">
                  
                  <div className="flex items-center gap-4 overflow-hidden flex-1">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 shrink-0">
                      <Clock className="w-5 h-5 relative z-10" />
                      <span className="absolute inset-0 rounded-full border border-amber-500 animate-ping opacity-30"></span>
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-semibold text-text-primary text-base truncate">
                        {todo.title || todo.text}
                      </h4>
                      <p className="text-xs text-amber-500/80 font-medium uppercase tracking-wider mt-0.5">
                        In Progress
                      </p>
                    </div>
                  </div>

                </div>
                
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {inProgress.length > 0 && (
        <div className="px-5 py-3 border-t border-border-secondary bg-background-secondary/30 shrink-0">
          <div className="flex justify-between items-center text-[11px] font-medium text-text-muted uppercase tracking-wider">
            <span>
              {inProgress.length} task{inProgress.length !== 1 && "s"} ongoing
            </span>
            <span className="flex items-center gap-1.5 text-amber-500">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Active
            </span>
          </div>
        </div>
      )}

    </div>
  );
};

export default CurrentProgress;