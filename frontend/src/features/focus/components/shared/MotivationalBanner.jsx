import React, { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Quote, X } from "lucide-react";
import generalService from "@services/generalService";

const FALLBACK_QUOTES = [
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The key is not to prioritize what's on your schedule but to schedule your priorities.", author: "Stephen Covey" },
  { text: "Concentrate all your thoughts upon the work in hand.", author: "Alexander Graham Bell" },
  { text: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
  { text: "Productivity is never an accident. It is always the result of a commitment to excellence.", author: "Paul J. Meyer" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The ability to concentrate and to use time well is everything.", author: "Lee Iacocca" },
  { text: "If you spend too much time thinking about a thing, you'll never get it done.", author: "Bruce Lee" },
  { text: "It's not always that we need to do more but rather that we need to focus on less.", author: "Nathan W. Morris" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
];

export const MotivationalBanner = ({ show, onClose }) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const lastFetchRef = useRef(0);

  const fetchQuote = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < 8000) {
      setIsInCooldown(true);
      return;
    }
    lastFetchRef.current = now;
    setIsInCooldown(false);
    setLoading(true);

    try {
      const response = await generalService.getQuote();
      if (response?.data?.text && response?.data?.author) {
        setQuote(response.data);
        setLoading(false);
        return;
      }
    } catch {
      // Fallback
    }

    const random = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    setQuote(random);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (show && !quote) fetchQuote();
  }, [show, quote, fetchQuote]);

  if (!show) return null;

  return (
    <div className="w-full max-w-xl mx-auto mt-6 p-4 rounded-2xl bg-secondary/30 border border-border/40 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 overflow-hidden">
          <Quote size={18} className="text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw size={13} className="animate-spin" />
                <span>Finding inspiration...</span>
              </div>
            ) : quote ? (
              <div>
                <p className="text-xs sm:text-sm font-medium text-foreground italic leading-relaxed">
                  "{quote.text}"
                </p>
                <p className="text-[11px] font-bold text-muted-foreground mt-1 tracking-wide">
                  — {quote.author}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={fetchQuote}
            disabled={loading || isInCooldown}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
            title={isInCooldown ? "Cooldown..." : "New Quote"}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Dismiss quote"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MotivationalBanner;
