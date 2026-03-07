import { useEffect, useState } from "react";
import { 
  Maximize, 
  Minimize,
  Flame, 
  ListTodo, 
  Volume2, 
  Settings, 
  Quote 
} from "lucide-react";

export default function HeaderNav({ isDeepFocus, toggleDeepFocus, getMotivation }) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) { 
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true }); 
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={`
        fixed top-6 left-1/2 z-50 flex -translate-x-1/2 items-center justify-between 
        rounded-full border border-border-primary/40 bg-card-background/80 
        px-2 py-1.5 shadow-lg shadow-black/20 backdrop-blur-xl 
        transition-all duration-300 ease-in-out w-[95%] sm:w-fit min-w-[320px]
        ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"} 
        hover:border-button-primary/50
      `}
    >
      <div className="flex items-center gap-1 border-r border-border-primary/40 pr-3 pl-1">
        <button 
          onClick={toggleDeepFocus}
          className={`
            p-2 rounded-full transition-colors duration-300
            ${isDeepFocus 
              ? "text-button-primary bg-button-primary/10 hover:bg-button-primary/20" 
              : "text-text-muted hover:text-button-primary hover:bg-button-primary/10"}
          `}
          title={isDeepFocus ? "Exit Deep Focus" : "Enter Deep Focus"}
        >
          {isDeepFocus ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
        
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-500" title="Current Streak">
          <Flame size={14} />
          <span className="text-xs font-bold tabular-nums">12</span>
        </div>
      </div>

      <div className="px-6 text-lg font-semibold text-text-primary tabular-nums tracking-wide">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>

      <div className="flex items-center gap-1 border-l border-border-primary/40 pl-3 pr-1">
        <button 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-colors"
          title="Get a motivational quote"
          onClick={getMotivation}
        >
          <Quote size={14} />
          <span className="hidden sm:inline">Inspire Me</span>
        </button>

        <button className="p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-background-secondary transition-colors" title="Tasks">
          <ListTodo size={18} />
        </button>

        <button className="p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-background-secondary transition-colors" title="Ambient Sounds">
          <Volume2 size={18} />
        </button>

        <button className="p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-background-secondary transition-colors" title="Focus Settings">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}