import { Smartphone, MessageSquare, Users, Music, Check, Sparkles } from "lucide-react";

const commonDistractions = [
  { label: "Phone", icon: Smartphone },
  { label: "Messages", icon: MessageSquare },
  { label: "People", icon: Users },
  { label: "Noise", icon: Music },
];

export const SessionReview = ({ reviewData, onUpdate, onDistractionToggle, onNewSession }) => {
  const isSubmitEnabled = reviewData.mood && reviewData.focus;

  return (
    <div className="flex flex-col h-full w-full min-w-[320px] sm:min-w-[480px] bg-transparent p-6 sm:p-8 overflow-y-auto custom-scrollbar">
      
      <div className="text-center mb-10 shrink-0">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-button-success/10 text-button-success mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <Sparkles className="w-7 h-7 animate-pulse" />
        </div>
        <h3 className="text-3xl font-black text-text-primary tracking-tight">
          Session Complete! <span className="pulses inline-block">🎉</span>
        </h3>
        <p className="text-base text-text-muted mt-2 font-medium">Take a moment to reflect on your focus.</p>
      </div>

      <div className="space-y-10 flex-1 min-h-0">
        
        <section>
          <label className="flex items-center justify-center text-sm font-bold text-text-muted uppercase tracking-wider mb-5">
            How are you feeling?
          </label>
          <div className="flex justify-center gap-3 sm:gap-5">
            {[
              { level: 1, emoji: "😞" },
              { level: 2, emoji: "😐" },
              { level: 3, emoji: "🙂" },
              { level: 4, emoji: "😊" },
              { level: 5, emoji: "🤩" },
            ].map(({ level, emoji }) => {
              const isActive = reviewData.mood === level;
              return (
                <button
                  key={level}
                  onClick={() => onUpdate("mood", level)}
                  className={`relative w-12 sm:w-14 h-12 sm:h-14 text-2xl sm:text-3xl rounded-full transition-all duration-300 flex items-center justify-center ${
                    isActive
                      ? "bg-button-primary/20 scale-110 shadow-[0_0_15px_rgba(99,102,241,0.3)] z-10"
                      : "bg-background-secondary/50 grayscale-[50%] hover:grayscale-0 hover:bg-background-secondary hover:scale-105"
                  }`}
                >
                  <span className="relative z-10">{emoji}</span>
                  {isActive && (
                    <span className="absolute inset-0 rounded-full border-2 border-button-primary animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_1] opacity-0" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <label className="flex items-center justify-center text-sm font-bold text-text-muted uppercase tracking-wider mb-5">
            Rate your focus
          </label>
          <div className="flex justify-center gap-3 sm:gap-5">
            {[1, 2, 3, 4, 5].map((level) => {
              const isActive = reviewData.focus === level;
              return (
                <button
                  key={level}
                  onClick={() => onUpdate("focus", level)}
                  className={`w-12 sm:w-14 h-12 sm:h-14 rounded-2xl font-black text-xl transition-all duration-300 flex items-center justify-center border ${
                    isActive
                      ? "bg-button-primary border-button-primary text-white shadow-lg scale-110 z-10"
                      : "bg-background-secondary/50 border-border-secondary text-text-secondary hover:text-text-primary hover:bg-background-secondary hover:border-border-primary hover:scale-105"
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-background-secondary/30 p-5 rounded-3xl border border-border-secondary">
          <label className="flex items-center text-xs font-bold text-text-muted uppercase tracking-wider mb-4">
            Any Distractions?
          </label>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {commonDistractions.map(({ label, icon: Icon }) => {
              const isActive = (reviewData.distractions || "").toLowerCase().includes(label.toLowerCase());
              return (
                <button
                  key={label}
                  onClick={() => onDistractionToggle(label)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 border ${
                    isActive
                      ? "bg-red-500/10 border-red-500/30 text-red-500 shadow-sm"
                      : "bg-background-primary border-border-secondary text-text-secondary hover:text-text-primary hover:border-border-primary"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm font-bold">{label}</span>
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={reviewData.distractions || ""}
            onChange={(e) => onUpdate("distractions", e.target.value)}
            placeholder="Type other distractions..."
            className="w-full px-4 py-3 rounded-xl bg-input-background border border-input-border text-sm text-text-primary placeholder:text-input-placeholder focus:border-button-primary focus:outline-none focus:ring-2 focus:ring-button-primary/20 transition-all shadow-sm"
          />
        </section>
      </div>
      
      <div className="mt-10 shrink-0">
        <button
          onClick={onNewSession}
          disabled={!isSubmitEnabled}
          className={`w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-bold text-base transition-all duration-300 shadow-lg ${
            isSubmitEnabled 
              ? "bg-button-primary text-white hover:bg-button-primary-hover hover:scale-[1.02] active:scale-[0.98]"
              : "bg-background-secondary text-text-muted cursor-not-allowed opacity-60 shadow-none"
          }`}
        >
          Save & Continue <Check className="w-5 h-5" strokeWidth={3} />
        </button>
        {!isSubmitEnabled && (
          <p className="text-[11px] text-center text-text-muted mt-3 uppercase tracking-wider">
            Select mood and focus to continue
          </p>
        )}
      </div>

    </div>
  );
};