import { useTheme } from "../../../../contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = ({ expanded = false }) => {
  const { theme, toggleTheme } = useTheme();

  const isLight = theme === "light";

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
      className={`
        bg-card-background
        border border-card-border
        text-text-primary
        transition-all duration-300 ease-in-out
        focus:outline-none
        focus:ring-2 focus:ring-button-primary focus:ring-offset-2
        focus:ring-offset-background-color
        hover:shadow-lg
        hover:shadow-shadow-hover
        active:scale-95
        ${
          !expanded
            ? "p-2 rounded-full hover:scale-110"
            : "w-full px-3 py-2 rounded-xl flex items-center justify-between"
        }
      `}
    >
      <span
        className={`
          absolute inset-0 rounded-inherit
          opacity-0 hover:opacity-100
          transition-opacity duration-300
          bg-gradient-to-r from-brand-500/10 via-transparent to-brand-600/10
          pointer-events-none
        `}
      />

      <div className={`relative flex items-center justify-center overflow-hidden ${expanded && "gap-2"}`}>
        <div className="w-5 h-5 flex items-center justify-center transition-transform duration-500">
          {isLight ? (
            <Sun className="w-5 h-5 text-brand-500 transition-all duration-500" />
          ) : (
            <Moon className="w-5 h-5 text-text-accent transition-all duration-500" />
          )}
        </div>

        <span
          className={`
      text-sm font-medium tracking-wide whitespace-nowrap
      transition-all duration-300 ease-in-out
      ${
        expanded
          ? "opacity-100 translate-x-0 max-w-[120px]"
          : "opacity-0 -translate-x-2 max-w-0"
      }
    `}
        >
          {isLight ? "Light Mode" : "Dark Mode"}
        </span>
      </div>
    </button>
  );
};

export default ThemeToggle;
