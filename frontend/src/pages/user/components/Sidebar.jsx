import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  Calendar,
  User,
  ChevronRight,
} from "lucide-react";

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
        transition-[width] duration-300 ease-in-out
        ${expanded ? "w-56" : "w-20"}
        bg-card-background/95
        backdrop-blur-xl
        border-r border-border-primary/40
        shadow-xl shadow-black/40
        overflow-hidden
        flex flex-col
      `}
    >
      <div className="h-20 flex items-center justify-center border-b border-border-primary/30">
        <span className="font-semibold text-lg tracking-wide">
          {expanded ? "Athena" : "A"}
        </span>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2 flex flex-col justify-center">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <div
                className={`
            relative flex items-center gap-3 py-3 pl-4 rounded-full
            transition-all duration-200 hover:bg-blue-900
            ${
              isActive
                ? "text-text-primary px-[0.65rem] pl-[0.845rem]"
                : "text-text-muted hover:text-text-primary px-3 pl-4"
            }
          `}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-accent-primary rounded-r-full" />
                )}

                <Icon
                  className={`flex-shrink-0 transition-all ${
                    isActive ? "text-accent-primary w-7 h-7" : "w-5 h-5"
                  }`}
                />

                <span
                  className={`
              whitespace-nowrap text-sm font-medium
              transition-all duration-200
              ${
                expanded
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-2"
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

      <div className="p-4 border-t border-border-primary/30">
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="
      w-full flex items-center justify-center
      rounded-xl p-2
      text-text-muted
      focus:outline-none focus:ring-0
      active:scale-95
    "
        >
          <ChevronRight
            className={`w-5 h-5 transition-transform duration-300 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
