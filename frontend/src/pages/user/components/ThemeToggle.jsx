import { useTheme } from "../../../../contexts/ThemeContext";
import { Palette, Sparkles } from "lucide-react";

const ThemeToggle = ({ expanded = false }) => {
    const { theme, setShowThemeModal, availableThemes } = useTheme();

    const currentThemeObj = availableThemes?.find(t => t.id === theme);

    return (
        <button
            onClick={() => setShowThemeModal(true)}
            title={!expanded ? `Theme: ${currentThemeObj?.name || "Themes"}` : ""}
            className={`
                relative flex items-center h-11 rounded-xl px-3
                transition-all duration-200 border border-transparent
                text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.06] hover:text-neutral-900 dark:hover:text-white
                focus:outline-none overflow-hidden cursor-pointer
                ${expanded ? "w-full" : "w-11"}
            `}
        >
            <Palette size={20} className="flex-shrink-0 text-neutral-500 dark:text-neutral-400" />
            
            <span
                className={`
                    whitespace-nowrap text-xs font-medium ml-3.5
                    transition-all duration-300 ease-in-out overflow-hidden truncate
                    ${expanded ? "max-w-[130px] opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-2"}
                `}
            >
                {currentThemeObj?.name || "Themes"}
            </span>

            {expanded && currentThemeObj?.isPremium && (
                <span className="ml-auto text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                    <Sparkles size={9} /> PRO
                </span>
            )}
        </button>
    );
};

export default ThemeToggle;
