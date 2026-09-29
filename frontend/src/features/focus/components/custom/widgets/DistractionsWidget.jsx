import React, { useState } from "react";
import {
  AlertCircle,
  Smartphone,
  MessageSquare,
  Users,
  Music,
  Globe,
  CloudRain,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";

const DISTRACTION_OPTIONS = [
  { label: "Phone", icon: Smartphone },
  { label: "Messages", icon: MessageSquare },
  { label: "People", icon: Users },
  { label: "Noise", icon: Music },
  { label: "Web", icon: Globe },
  { label: "Mind", icon: CloudRain },
];

export const DistractionsWidget = ({ sessionReview, onDistractionToggle }) => {
  const [customInput, setCustomInput] = useState("");

  const distractionsList = (sessionReview?.distractions || "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  const handleAddCustom = () => {
    if (!customInput.trim()) return;
    onDistractionToggle(customInput.trim());
    toast.success(`Logged: "${customInput.trim()}"`);
    setCustomInput("");
  };

  return (
    <div className="p-4 sm:p-5 flex flex-col h-full bg-transparent">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Distraction Log
          </span>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-foreground">
          {distractionsList.length} logged
        </span>
      </div>

      {/* Preset Quick Chips */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {DISTRACTION_OPTIONS.map(({ label, icon: Icon }) => {
          const isTagged = distractionsList.some(
            (d) => d.toLowerCase() === label.toLowerCase()
          );

          return (
            <button
              key={label}
              onClick={() => {
                onDistractionToggle(label);
                toast.success(isTagged ? `Removed ${label}` : `Logged ${label}`);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all border ${
                isTagged
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-sm"
                  : "bg-secondary/40 border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon size={13} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Distraction Input */}
      <div className="flex items-center gap-2 mt-auto pt-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddCustom();
          }}
          placeholder="Log distraction..."
          className="flex-1 px-3 py-1.5 rounded-xl bg-secondary/40 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={handleAddCustom}
          disabled={!customInput.trim()}
          className="p-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
          title="Add distraction"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};
