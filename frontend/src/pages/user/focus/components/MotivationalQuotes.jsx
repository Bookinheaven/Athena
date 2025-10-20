import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Quote, X } from "lucide-react";

const FALLBACK_QUOTES = [
  {
    text: "Focus on being productive instead of busy.",
    author: "Tim Ferriss",
  },
  {
    text: "The key is not to prioritize what's on your schedule but to schedule your priorities.",
    author: "Stephen Covey",
  },
  {
    text: "Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.",
    author: "Alexander Graham Bell",
  },
  {
    text: "Either you run the day, or the day runs you.",
    author: "Jim Rohn",
  },
  {
    text: "Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.",
    author: "Paul J. Meyer",
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
  },
  {
    text: "The ability to concentrate and to use time well is everything.",
    author: "Lee Iacocca",
  },
  {
    text: "If you spend too much time thinking about a thing, you'll never get it done.",
    author: "Bruce Lee",
  },
  {
    text: "It's not always that we need to do more but rather that we need to focus on less.",
    author: "Nathan W. Morris",
  },
  {
    text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.",
    author: "Stephen King",
  },
];

const QUOTE_APIS = [
  {
    url: "https://zenquotes.io/api/random",
    transform: (data) => ({
      text: data[0]?.q || "",
      author: data[0]?.a || "Unknown",
    }),
  },
  {
    url: "https://api.realinspire.live/v1/quotes/random",
    transform: (data) => ({
      text: data[0]?.content || "",
      author: data[0]?.author || "Unknown",
    }),
  },
];

const MotivationalQuotes = ({ show, onClose }) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const lastFetchRef = useRef(0);
  const FETCH_COOLDOWN_MS = 10000; // 10sec cooldown

  const fetchQuote = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < FETCH_COOLDOWN_MS) {
      setIsInCooldown(true);
      return;
    }

    lastFetchRef.current = now;
    setIsInCooldown(false);

    setLoading(true);
    setError(null);

    for (const api of QUOTE_APIS) {
      try {
        const response = await fetch(api.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const transformedQuote = api.transform(data);

        if (transformedQuote.text && transformedQuote.author) {
          setQuote(transformedQuote);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn(`API ${api.url} failed:`, err.message);
        continue;
      }
    }

    const randomQuote =
      FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    setQuote(randomQuote);
    setLoading(false);
    setError("Failed to fetch online quotes. Showing fallback.");
  }, []);

  useEffect(() => {
    if (!show) return;

    const checkCooldown = () => {
      const now = Date.now();
      if (now - lastFetchRef.current < FETCH_COOLDOWN_MS) {
        setIsInCooldown(true);
      } else {
        setIsInCooldown(false);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);

    return () => clearInterval(interval);
  }, [show, FETCH_COOLDOWN_MS]);

  useEffect(() => {
    if (show && !quote) {
      fetchQuote();
    }
  }, [show, quote, fetchQuote]);

  const handleRefresh = () => {
    fetchQuote();
  };

  if (!show) return null;

  return (
    <div
      className="w-full max-w-2xl mt-4 relative z-10 overflow-hidden transition-all duration-300 ease-in-out"
      style={{
        display: show ? "block" : "none",
      }}
    >
      <div className="p-6 rounded-2xl shadow-lg bg-card-background border border-card-border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2 select-none">
            <Quote className="w-6 h-6 text-text-accent" />
            Daily Inspiration
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading || isInCooldown}
              className="p-2 rounded-lg transition-all duration-300 bg-button-secondary text-button-secondary-text hover:bg-button-secondary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                isInCooldown ? "Please wait before refreshing" : "Get new quote"
              }
            >
              <RefreshCw
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all duration-300 text-text-secondary hover:text-text-primary shadow-none hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="min-h-32 flex items-center justify-center">
          {loading ? (
            <div className="flex items-center gap-3 text-text-muted">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Finding inspiration...</span>
            </div>
          ) : quote ? (
            <div className="text-center space-y-4">
              <blockquote className="text-lg font-medium text-text-primary leading-relaxed px-4">
                "{quote.text}"
              </blockquote>
              <cite className="text-text-secondary font-semibold block">
                — {quote.author}
              </cite>
              <div className="flex justify-center pt-2">
                <div className="w-12 h-1 bg-text-accent rounded-full opacity-30"></div>
              </div>
            </div>
          ) : (
            <div className="text-center text-text-muted">
              <Quote className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Unable to load quote</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-text-accent hover:underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {error && <div className="mt-4 text-center text-red-600">{error}</div>}
      </div>
    </div>
  );
};

export default MotivationalQuotes;
