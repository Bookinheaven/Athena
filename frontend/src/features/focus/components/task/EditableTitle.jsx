import React, { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Returns an adaptive responsive typography class based on character count
 * so large/long titles scale elegantly without awkward overflowing.
 */
function getTypographyClass(text) {
  const len = text?.length || 0;
  if (len <= 24) {
    return "text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight";
  }
  if (len <= 48) {
    return "text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight";
  }
  if (len <= 75) {
    return "text-lg sm:text-xl md:text-2xl font-semibold";
  }
  return "text-base sm:text-lg font-medium";
}

export const EditableTitle = ({
  title,
  setTitle,
  className = "",
  titleSet,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title || "");
  const [originalTitle, setOriginalTitle] = useState(title || "");
  const textareaRef = useRef(null);

  // Sync draft title whenever incoming title changes while not editing
  useEffect(() => {
    if (!isEditing) {
      setDraftTitle(title || "");
      setOriginalTitle(title || "");
    }
  }, [title, isEditing]);

  // Focus and select when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const saveTitle = async () => {
    const trimmedTitle = draftTitle ? draftTitle.trim() : "";

    if (!trimmedTitle) {
      setDraftTitle(originalTitle);
      setIsEditing(false);
      toast.error("Title cannot be empty.");
      return;
    }

    setIsEditing(false);

    if (trimmedTitle !== originalTitle) {
      const prevTitle = originalTitle;
      try {
        setOriginalTitle(trimmedTitle);
        setTitle(trimmedTitle);
        if (titleSet) {
          await titleSet(trimmedTitle);
        }
        toast.success("Title updated!");
      } catch (err) {
        console.error("Failed to update title:", err);
        setDraftTitle(prevTitle);
        setOriginalTitle(prevTitle);
        setTitle(prevTitle);
        toast.error("Failed to update title");
      }
    }
  };

  const handleEscape = () => {
    setDraftTitle(originalTitle);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    // Stop propagation so global Focus shortcuts (Space to toggle, R to reset, etc.) don't fire
    e.stopPropagation();

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveTitle();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleEscape();
    }
  };

  const typographyClass = getTypographyClass(title || "Focus Session");
  const displayTitle = title || "Focus Session";
  const isLargeTitle = displayTitle.length > 40;

  return (
    <div
      className={`w-full flex items-center justify-center relative min-h-[3rem] ${className}`}
    >
      {isEditing ? (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border border-primary/40 bg-card/95 shadow-xl backdrop-blur-md ring-2 ring-primary/20 transition-all animate-in fade-in zoom-in-95">
          <div className="w-full relative flex items-center">
            <textarea
              ref={textareaRef}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={draftTitle.length > 50 ? 2 : 1}
              maxLength={150}
              placeholder="What are you focusing on?"
              aria-label="Edit session title"
              className="w-full resize-none text-center bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none font-semibold text-lg sm:text-xl md:text-2xl leading-snug px-3 py-1.5"
            />
          </div>

          <div className="w-full flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2 px-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-muted-foreground/80">
                {draftTitle.length}/150
              </span>
              <span className="hidden sm:inline text-muted-foreground/40">•</span>
              <span className="hidden sm:inline text-muted-foreground/70">
                Press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground font-mono text-[10px]">↵ Enter</kbd> to save
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleEscape}
                className="px-2.5 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer flex items-center gap-1"
                title="Cancel changes (Esc)"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={saveTitle}
                className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-xs cursor-pointer flex items-center gap-1"
                title="Save title (Enter)"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsEditing(true);
            }
          }}
          className="group inline-flex items-center justify-center gap-2.5 px-4 py-2 rounded-2xl transition-all duration-200 cursor-pointer hover:bg-muted/40 hover:ring-1 hover:ring-border/60 max-w-2xl select-text"
          title="Click to rename timer title"
        >
          <div className="flex flex-col items-center max-w-full">
            <h1
              className={`${typographyClass} text-foreground text-center line-clamp-2 leading-snug break-words transition-colors group-hover:text-primary`}
            >
              {displayTitle}
            </h1>
            {isLargeTitle && (
              <span className="text-[10px] text-muted-foreground/60 tracking-wider font-mono uppercase mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                Click to edit full title
              </span>
            )}
          </div>
          {/* <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/40 group-hover:text-primary group-hover:bg-primary/10 transition-all shrink-0"
            aria-hidden="true"
          >
            <Pencil className="w-3.5 h-3.5" />
          </div> */}
        </div>
      )}
    </div>
  );
};

export default EditableTitle;
