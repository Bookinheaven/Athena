import { NavLink, useNavigate } from "react-router-dom";
import { APP_CONFIG } from "@/config/branding";
import {
  LayoutDashboard,
  Target,
  Calendar,
  User,
  ChevronRight,
  LogOut,
  Users,
  Command,
  Palette,
} from "lucide-react";
import { useTheme } from "@contexts/ThemeContext";
import { useAuth } from "../../../../contexts/AuthContext";
import { ConfirmModal } from "../../../components/ConfirmModal";
import AccountSwitcherModal from "@/components/AccountSwitcherModal";
import { useMultiAccount } from "@contexts/MultiAccountContext";
import { useState } from "react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/focus-page", icon: Target, label: "Quick Focus" },
  { to: "/planner", icon: Calendar, label: "Planner" },
  { to: "/profile", icon: User, label: "Profile" },
];

const Sidebar = ({ expanded, setExpanded }) => {
  const { user, logout } = useAuth();
  const { setShowThemeModal } = useTheme();
  const { clearAccountToken } = useMultiAccount();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSwitcherModal, setShowSwitcherModal] = useState(false);

  const handleLogoutConfirm = async () => {
    try {
      if (user?.id) {
        clearAccountToken(user.id);
      }
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      <aside
        className={`
          relative h-full z-40 flex flex-col shrink-0
          transition-[width] duration-300 ease-in-out will-change-[width] transform-gpu
          ${expanded ? "w-64" : "w-20"}
          bg-background-primary
          border-r border-border-secondary
          shadow-lg
          overflow-hidden font-sans select-none
        `}
      >
        {/* Top Brand Area */}
        <div className="h-20 flex items-center px-5 border-b border-border-secondary relative overflow-hidden shrink-0">
          <div className="flex items-center gap-3 min-w-max">
            <div className="w-9 h-9 rounded-xl bg-button-primary text-button-primary-text font-bold flex items-center justify-center text-sm tracking-tighter shadow-sm shrink-0">
              {APP_CONFIG.logoLetter}
            </div>
            <div
              className={`
                flex flex-col transition-all duration-300 ease-in-out
                ${expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"}
              `}
            >
              <span className="font-semibold text-sm tracking-tight text-text-primary leading-tight">
                {APP_CONFIG.name}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted leading-tight mt-0.5">
                Desktop Ed.
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 flex flex-col overflow-y-auto custom-scrollbar">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} title={!expanded ? label : ""}>
              {({ isActive }) => (
                <div
                  className={`
                    group relative flex items-center h-11 rounded-xl px-3
                    transition-all duration-200 border cursor-pointer
                    ${isActive
                      ? "bg-button-primary/10 text-button-primary font-semibold border-button-primary/20 shadow-sm"
                      : "bg-transparent text-text-muted hover:bg-background-secondary hover:text-text-primary font-medium border-transparent"
                    }
                  `}
                >
                  <Icon
                    size={20}
                    className={`
                      flex-shrink-0 transition-transform duration-200
                      ${isActive ? "text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200"}
                    `}
                  />

                  <span
                    className={`
                      whitespace-nowrap text-xs font-medium ml-3.5
                      transition-all duration-300 ease-in-out overflow-hidden
                      ${expanded ? "max-w-[140px] opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-2"}
                    `}
                  >
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Action Controls */}
        <div className="mt-auto flex flex-col items-start justify-center p-3 gap-1.5 shrink-0 border-t border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-white/[0.01]">
          <button
            onClick={() => setShowSwitcherModal(true)}
            title={!expanded ? "Switch Workspace Account" : ""}
            className={`
              relative flex items-center h-11 rounded-xl px-3
              transition-all duration-200 border border-transparent
              text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.06] hover:text-neutral-900 dark:hover:text-white
              focus:outline-none overflow-hidden cursor-pointer
              ${expanded ? "w-full" : "w-11"}
            `}
          >
            <Users size={20} className="flex-shrink-0 text-neutral-500 dark:text-neutral-400" />

            <span
              className={`
                whitespace-nowrap text-xs font-medium ml-3.5
                transition-all duration-300 ease-in-out overflow-hidden
                ${expanded ? "max-w-[130px] opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-2"}
              `}
            >
              Accounts
            </span>
          </button>

          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
            title={!expanded ? "Command Palette (⌘K)" : ""}
            className={`
              relative flex items-center h-11 rounded-xl px-3
              transition-all duration-200 border border-transparent
              text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.06] hover:text-neutral-900 dark:hover:text-white
              focus:outline-none overflow-hidden cursor-pointer
              ${expanded ? "w-full" : "w-11"}
            `}
          >
            <Command size={20} className="flex-shrink-0 text-neutral-500 dark:text-neutral-400" />

            <span
              className={`
                whitespace-nowrap text-xs font-medium ml-3.5
                transition-all duration-300 ease-in-out overflow-hidden
                ${expanded ? "max-w-[130px] opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-2"}
              `}
            >
              Commands
            </span>
            {expanded && (
              <span className="ml-auto text-[10px] font-mono bg-neutral-200/80 dark:bg-white/[0.08] border border-neutral-300/60 dark:border-white/10 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-400">
                ⌘K
              </span>
            )}
          </button>

          <button
            onClick={() => setShowThemeModal(true)}
            title={!expanded ? "Appearance & Themes" : ""}
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
                transition-all duration-300 ease-in-out overflow-hidden
                ${expanded ? "max-w-[130px] opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-2"}
              `}
            >
              Themes
            </span>
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            title={!expanded ? "Logout" : ""}
            className={`
              relative flex items-center h-11 rounded-xl px-3
              transition-all duration-200 border border-transparent
              text-neutral-500 dark:text-neutral-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/20
              focus:outline-none overflow-hidden cursor-pointer
              ${expanded ? "w-full" : "w-11"}
            `}
          >
            <LogOut size={20} className="flex-shrink-0" />

            <span
              className={`
                whitespace-nowrap text-xs font-medium ml-3.5
                transition-all duration-300 ease-in-out overflow-hidden
                ${expanded ? "max-w-[100px] opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-2"}
              `}
            >
              Logout
            </span>
          </button>
        </div>

        {/* Collapse / Expand Trigger */}
        <div className="h-14 w-full border-t border-neutral-200 dark:border-neutral-800/80 shrink-0 bg-white dark:bg-[#09090b]">
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="
              w-full h-full flex items-center justify-center
              text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-white/[0.04]
              transition-colors duration-200 focus:outline-none cursor-pointer
            "
          >
            <ChevronRight
              size={18}
              className={`transition-transform duration-300 transform-gpu ${expanded ? "rotate-180" : ""
                }`}
            />
          </button>
        </div>
      </aside>

      <ConfirmModal
        isOpen={showLogoutModal}
        title={`Logout ${APP_CONFIG.shortName}`}
        message="Are you sure you want to log out? Any unsaved focus session progress might be lost."
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
        type="danger"
      />

      <AccountSwitcherModal
        isOpen={showSwitcherModal}
        onClose={() => setShowSwitcherModal(false)}
      />
    </>
  );
};

export default Sidebar;