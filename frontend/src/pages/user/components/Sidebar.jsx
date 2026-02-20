import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  Calendar,
  User,
  ChevronRight,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/focus-page", icon: Target, label: "Quick Focus" },
  { to: "/planner", icon: Calendar, label: "Planner" },
  { to: "/profile", icon: User, label: "Profile" },
];

const Sidebar = ({ expanded, setExpanded }) => {
  return (
    <aside
      className={`
        fixed left-0 top-0 h-full
        transition-all duration-300 ease-in-out
        ${expanded ? "w-56" : "w-20"}
        bg-card-background/95
        backdrop-blur-xl
        border-r border-border-primary/40
        shadow-xl shadow-black/20
        overflow-hidden
        flex flex-col
      `}
    >
      <div className="h-20 flex items-center justify-center border-b border-border-primary/30">
        <span
          className={`
            font-semibold text-lg tracking-wide
            transition-all duration-300
          `}
        >
          {expanded ? "Athena" : "A"}
        </span>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2 flex flex-col justify-center">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <div
                className={`
                  group relative flex items-center gap-3
                  h-12 rounded-xl
                  px-4
                  transition-all duration-300 ease-in-out
                  ${
                    isActive
                      ? "bg-brand-500/10 text-text-primary"
                      : "text-text-muted hover:text-text-primary hover:bg-brand-500/5"
                  }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-brand-500 rounded-r-full" />
                )}

                <Icon
                  className={`
                    flex-shrink-0 transition-all duration-300
                    ${isActive ? "text-brand-500 scale-110" : ""}
                  `}
                />

                <span
                  className={`
                    whitespace-nowrap text-sm font-medium
                    transition-all duration-300 ease-in-out
                    overflow-hidden
                    ${
                      expanded
                        ? "opacity-100 translate-x-0 max-w-[120px]"
                        : "opacity-0 -translate-x-2 max-w-0"
                    }
                  `}
                >
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="h-16 w-full border-t border-border-primary/40">
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="
            w-full h-full
            flex items-center justify-center
            text-text-muted
            transition-all duration-300 ease-in-out
            hover:text-text-primary
            hover:bg-brand-500/5
            active:scale-95
            focus:outline-none
          "
        >
          <ChevronRight
            className={`w-5 h-5 transition-transform duration-300 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-center h-16 p-2">
        <ThemeToggle expanded={expanded} />
      </div>
    </aside>
  );
};

export default Sidebar;
