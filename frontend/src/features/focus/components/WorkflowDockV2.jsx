import React from "react";
import { FileText, Pin, Link2, Monitor, Code, X, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

const WORKFLOW_ITEMS = [
  { id: 1, title: "Project Spec", icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { id: 2, title: "Figma Design", icon: Pin, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  { id: 3, title: "API Docs", icon: Link2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { id: 4, title: "Landing Page", icon: Monitor, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { id: 5, title: "Refactor Auth", icon: Code, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
];

export const WorkflowDockV2 = ({ show, onClose }) => {
  if (!show) return null;

  const handleClick = (item) => {
    toast(`Opened ${item.title}`, { icon: "⚡" });
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-4 p-3 rounded-2xl bg-secondary/40 border border-border/50 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Workflow Quick Links
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Close Workflow Dock"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
        {WORKFLOW_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/50 hover:bg-background border border-border/40 hover:border-border/80 text-foreground transition-all duration-200 shrink-0 text-xs font-semibold group shadow-sm active:scale-95"
          >
            <div className={`p-1.5 rounded-lg border ${item.bg}`}>
              <item.icon size={14} className={item.color} />
            </div>
            <span>{item.title}</span>
            <ExternalLink size={11} className="text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
};
