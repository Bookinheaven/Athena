import React, { useMemo, useState, useEffect } from "react";
import {
  Smartphone,
  MessageSquare,
  Users,
  Volume2,
  Globe,
  Brain,
  Check,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Loader2,
  AlertCircle,
} from "lucide-react";

const MOOD_OPTIONS = [
  { level: 1, emoji: "😞", label: "Drained", desc: "Low energy, exhausted" },
  { level: 2, emoji: "😐", label: "Tired", desc: "Low motivation, sluggish" },
  { level: 3, emoji: "🙂", label: "Okay", desc: "Neutral, steady pace" },
  { level: 4, emoji: "😊", label: "Good", desc: "Accomplished & refreshed" },
  { level: 5, emoji: "🤩", label: "Energized", desc: "In the zone, supercharged" },
];

const FOCUS_LEVELS = [
  { level: 1, label: "Distracted", desc: "Frequent interruptions, hard to stay on track" },
  { level: 2, label: "Scattered", desc: "Low concentration, drifted often" },
  { level: 3, label: "Moderate", desc: "Steady progress with some wandering" },
  { level: 4, label: "Focused", desc: "Strong focus and smooth rhythm" },
  { level: 5, label: "Deep Flow", desc: "Peak immersion, completely in the zone" },
];

const PRESET_DISTRACTIONS = [
  { label: "Phone", icon: Smartphone },
  { label: "Messages", icon: MessageSquare },
  { label: "People", icon: Users },
  { label: "Noise", icon: Volume2 },
  { label: "Browsing", icon: Globe },
  { label: "Wandering", icon: Brain },
];

// Helper to cleanly separate preset tag chips from custom freeform notes
function parseDistractionString(raw) {
  if (!raw || typeof raw !== "string") {
    return { selectedTags: [], customNote: "" };
  }
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const selectedTags = [];
  const customParts = [];

  for (const part of parts) {
    const matched = PRESET_DISTRACTIONS.find(
      (p) => p.label.toLowerCase() === part.toLowerCase()
    );
    if (matched) {
      if (!selectedTags.includes(matched.label)) {
        selectedTags.push(matched.label);
      }
    } else {
      customParts.push(part);
    }
  }

  return { selectedTags, customNote: customParts.join(", ") };
}

export const SessionReview = ({
  reviewData,
  onUpdate,
  onDistractionToggle,
  onNewSession,
  isSubmitting = false,
  isDiscarded = false,
  onSkipReview,
}) => {
  const currentMood = reviewData?.mood || null;
  const currentFocus = reviewData?.focus || null;

  // Parse preset tags and custom note from reviewData.distractions
  const { selectedTags, customNote: parsedCustomNote } = useMemo(
    () => parseDistractionString(reviewData?.distractions),
    [reviewData?.distractions]
  );

  // Local state for custom text input to ensure smooth typing
  const [customInput, setCustomInput] = useState(parsedCustomNote);

  useEffect(() => {
    setCustomInput(parsedCustomNote);
  }, [parsedCustomNote]);

  const handleToggleTag = (tagLabel) => {
    const nextTags = selectedTags.includes(tagLabel)
      ? selectedTags.filter((t) => t !== tagLabel)
      : [...selectedTags, tagLabel];

    const parts = [...nextTags];
    if (customInput.trim()) {
      parts.push(customInput.trim());
    }
    onUpdate("distractions", parts.join(", "));
  };

  const handleCustomInputChange = (e) => {
    const text = e.target.value;
    setCustomInput(text);

    const parts = [...selectedTags];
    if (text.trim()) {
      parts.push(text.trim());
    }
    onUpdate("distractions", parts.join(", "));
  };

  const activeMoodObj = MOOD_OPTIONS.find((m) => m.level === currentMood);
  const activeFocusObj = FOCUS_LEVELS.find((f) => f.level === currentFocus);

  const isMoodSelected = Boolean(currentMood);
  const isFocusSelected = Boolean(currentFocus);
  const isSubmitEnabled = isMoodSelected && isFocusSelected && !isSubmitting;

  return (
    <div className="flex flex-col w-full max-w-full space-y-6 sm:space-y-8 select-none">
      {/* Header */}
      <div className="text-center space-y-2">
        {isDiscarded ? (
          <>
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/10 text-amber-500 mb-2 shadow-xs border border-amber-500/20">
              <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Session Ended Early
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-sm mx-auto">
              Take a moment to reflect on your focus and what caused you to stop.
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 text-primary mb-2 shadow-xs border border-primary/20">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Session Complete! 🎉
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-sm mx-auto">
              Take a moment to reflect on your energy and focus depth.
            </p>
          </>
        )}
      </div>

      <div className="space-y-6 sm:space-y-7">
        {/* Section 1: Mood */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <span>1. How are you feeling?</span>
              <span className="text-[11px] font-semibold text-primary">*</span>
            </label>
            <span className="text-[11px] font-medium text-muted-foreground">
              {isMoodSelected ? (
                <span className="text-primary font-semibold">Selected</span>
              ) : (
                <span className="text-amber-500">Required</span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
            {MOOD_OPTIONS.map(({ level, emoji, label }) => {
              const isActive = currentMood === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onUpdate("mood", level)}
                  className={`group relative flex flex-col items-center justify-center p-2 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-primary/15 border-primary shadow-sm ring-2 ring-primary/30 scale-[1.03]"
                      : "bg-secondary/40 border-border/60 hover:bg-secondary/80 hover:border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className={`text-2xl sm:text-3xl transition-transform duration-200 ${
                      isActive ? "scale-110" : "group-hover:scale-105"
                    }`}
                  >
                    {emoji}
                  </span>
                  <span
                    className={`mt-1 text-[10px] sm:text-xs font-semibold truncate w-full text-center ${
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dynamic feedback pill for Mood */}
          <div
            className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between border transition-all ${
              activeMoodObj
                ? "bg-primary/5 border-primary/20 text-foreground"
                : "bg-secondary/30 border-dashed border-border/60 text-muted-foreground"
            }`}
          >
            {activeMoodObj ? (
              <span className="flex items-center gap-1.5 font-medium">
                <span className="text-base">{activeMoodObj.emoji}</span>
                <span className="font-bold text-primary">{activeMoodObj.label}</span>
                <span className="text-muted-foreground">· {activeMoodObj.desc}</span>
              </span>
            ) : (
              <span className="text-muted-foreground text-[11px]">
                Tap an emoji above that best matches your current mental energy.
              </span>
            )}
          </div>
        </section>

        {/* Section 2: Rate Focus */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <span>2. Rate your focus depth</span>
              <span className="text-[11px] font-semibold text-primary">*</span>
            </label>
            <span className="text-[11px] font-medium text-muted-foreground">
              {isFocusSelected ? (
                <span className="text-primary font-semibold">Selected</span>
              ) : (
                <span className="text-amber-500">Required</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium px-1">
            <span>1 · Distracted</span>
            <span>5 · Deep Flow</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
            {FOCUS_LEVELS.map(({ level, label }) => {
              const isActive = currentFocus === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onUpdate("focus", level)}
                  className={`group flex flex-col items-center justify-center p-2 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-primary border-primary text-primary-foreground font-black shadow-md ring-2 ring-primary/40 scale-[1.03]"
                      : "bg-secondary/40 border-border/60 text-foreground hover:bg-secondary/80 hover:border-border hover:scale-[1.01]"
                  }`}
                >
                  <span className="text-lg sm:text-xl font-black">{level}</span>
                  <span
                    className={`text-[9px] sm:text-[10px] font-medium truncate w-full text-center ${
                      isActive ? "text-primary-foreground/90 font-bold" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dynamic feedback pill for Focus */}
          <div
            className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between border transition-all ${
              activeFocusObj
                ? "bg-primary/5 border-primary/20 text-foreground"
                : "bg-secondary/30 border-dashed border-border/60 text-muted-foreground"
            }`}
          >
            {activeFocusObj ? (
              <span className="flex items-center gap-1.5 font-medium">
                <span className="font-bold text-primary">Level {activeFocusObj.level}/5 · {activeFocusObj.label}</span>
                <span className="text-muted-foreground">· {activeFocusObj.desc}</span>
              </span>
            ) : (
              <span className="text-muted-foreground text-[11px]">
                Choose your focus level: 1 = many interruptions, 5 = effortless flow state.
              </span>
            )}
          </div>
        </section>

        {/* Section 3: Distractions (Optional) */}
        <section className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-secondary/20 space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              3. Any Distractions? <span className="text-muted-foreground font-normal lowercase">(optional)</span>
            </label>
            {selectedTags.length > 0 && (
              <span className="text-[11px] font-semibold text-primary">
                {selectedTags.length} selected
              </span>
            )}
          </div>

          {/* Quick preset chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_DISTRACTIONS.map(({ label, icon: Icon }) => {
              const isSelected = selectedTags.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleToggleTag(label)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-destructive/15 border-destructive/40 text-destructive shadow-2xs"
                      : "bg-background border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={isSelected ? 2.5 : 2} />
                  <span className="truncate">{label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-destructive" />}
                </button>
              );
            })}
          </div>

          {/* Custom note field */}
          <div>
            <input
              type="text"
              value={customInput}
              onChange={handleCustomInputChange}
              placeholder="Other distractions or thoughts (optional)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
            />
          </div>
        </section>
      </div>

      {/* Footer / Submit */}
      <div className="pt-2 space-y-3">
        {/* Requirements status helper */}
        <div className="text-center text-xs">
          {!isMoodSelected && !isFocusSelected ? (
            <p className="text-amber-500 font-medium flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Please select your mood and focus rating to continue.
            </p>
          ) : !isMoodSelected ? (
            <p className="text-amber-500 font-medium flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Step 1: Please select how you are feeling.
            </p>
          ) : !isFocusSelected ? (
            <p className="text-amber-500 font-medium flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Step 2: Please rate your focus depth (1–5).
            </p>
          ) : (
            <p className="text-emerald-500 font-semibold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Reflections complete. Ready to save!
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onNewSession}
          disabled={!isSubmitEnabled}
          className={`w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 shadow-md ${
            isSubmitEnabled
              ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              : "bg-muted text-muted-foreground opacity-60 cursor-not-allowed shadow-none"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              Saving Reflection...
            </>
          ) : (
            <>
              {isDiscarded ? "Save Reflection & Exit" : "Save & Continue"}
              <Check className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
            </>
          )}
        </button>

        {onSkipReview && (
          <div className="text-center pt-0.5">
            <button
              type="button"
              onClick={onSkipReview}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline py-1 cursor-pointer"
            >
              Skip reflection & exit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionReview;
