import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Target,
  History,
  TrendingUp,
  Settings,
  Users,
  Palette,
  LogOut,
  Command,
} from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { useMultiAccount } from "@contexts/MultiAccountContext";
import { useTheme } from "@contexts/ThemeContext";
import { useUIStore } from "@/stores/uiStore";
import { APP_CONFIG } from "@/config/branding";
import { ConfirmModal } from "@/components/ConfirmModal";
import AccountSwitcherModal from "@/components/AccountSwitcherModal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Today" },
  { to: "/planner", icon: Calendar, label: "Plan" },
  { to: "/focus-page", icon: Target, label: "Focus" },
  { to: "/sessions", icon: History, label: "History" },
  { to: "/dashboard", icon: TrendingUp, label: "Insights", isSecondary: true },
];

const secondaryNavItems = [
  { to: "/profile", icon: Settings, label: "Settings" },
];

export const Sidebar = ({ className }) => {
  const { user, logout } = useAuth();
  const { clearAccountToken } = useMultiAccount();
  const { setShowThemeModal } = useTheme();
  const { sidebarCollapsed } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSwitcherModal, setShowSwitcherModal] = useState(false);

  const handleLogoutConfirm = async () => {
    try {
      const userId = user?._id || user?.id;
      await logout();
      if (userId) {
        clearAccountToken(userId);
      }
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setShowLogoutModal(false);
    }
  };

  const renderNavItem = ({ to, icon: Icon, label, isSecondary }) => {
    const isActive =
      to === "/dashboard"
        ? location.pathname === "/dashboard" && (!isSecondary || location.hash === "#insights")
        : location.pathname.startsWith(to);

    const content = (
      <NavLink
        to={to}
        aria-label={label}
        className={cn(
          "group relative flex items-center h-9 w-full rounded-md transition-colors duration-150 cursor-pointer select-none overflow-hidden",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground font-normal"
        )}
      >
        <div className="w-9 h-9 flex items-center justify-center shrink-0">
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-colors duration-150",
              isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground"
            )}
          />
        </div>
        <span
          className={cn(
            "text-[13px] tracking-tight truncate whitespace-nowrap transition-opacity duration-150 ml-0.5",
            sidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
        >
          {label}
        </span>
      </NavLink>
    );

    if (sidebarCollapsed) {
      return (
        <Tooltip key={label + to}>
          <TooltipTrigger render={content} />
          <TooltipContent side="right" className="font-medium text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <React.Fragment key={label + to}>{content}</React.Fragment>;
  };

  const utilityItems = [
    {
      id: "accounts",
      icon: Users,
      label: "Work Accounts",
      onClick: () => setShowSwitcherModal(true),
    },
    {
      id: "theme",
      icon: Palette,
      label: "Theme",
      onClick: () => setShowThemeModal(true),
    },
    {
      id: "commands",
      icon: Command,
      label: "Commands",
      shortcut: "⌘K",
      onClick: () =>
        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true,
          })
        ),
    },
    {
      id: "logout",
      icon: LogOut,
      label: "Logout",
      destructive: true,
      onClick: () => setShowLogoutModal(true),
    },
  ];

  const renderUtilityButton = (item) => {
    const Icon = item.icon;
    const button = (
      <button
        key={item.id}
        onClick={item.onClick}
        aria-label={item.label}
        className={cn(
          "group relative flex items-center h-9 w-full rounded-md text-xs transition-colors duration-150 cursor-pointer select-none overflow-hidden",
          item.destructive
            ? "text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <div className="w-9 h-9 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 shrink-0" />
        </div>
        <span
          className={cn(
            "truncate whitespace-nowrap transition-opacity duration-150 ml-0.5",
            sidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
        >
          {item.label}
        </span>
        {item.shortcut && (
          <kbd
            className={cn(
              "ml-auto mr-2 text-[10px] font-mono text-sidebar-foreground/50 bg-sidebar-accent/50 border border-sidebar-border px-1 py-0.5 rounded leading-none transition-opacity duration-150",
              sidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
          >
            {item.shortcut}
          </kbd>
        )}
      </button>
    );

    if (sidebarCollapsed) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger render={button} />
          <TooltipContent side="right" className="font-medium text-xs">
            {item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

  return (
    <>
      <aside
        className={cn(
          "relative h-full z-30 flex flex-col shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out will-change-[width] select-none overflow-hidden",
          sidebarCollapsed ? "w-14" : "w-56",
          className
        )}
      >
        {/* Brand Header (Branding & Workspace identity only) */}
        <div className="h-12 flex items-center px-2.5 border-b border-sidebar-border shrink-0 overflow-hidden">
          <div className="flex items-center w-full min-w-0">
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
              <div className="w-6.5 h-6.5 rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-semibold flex items-center justify-center text-[11px] tracking-tight shrink-0 select-none">
                {APP_CONFIG.logoLetter}
              </div>
            </div>
            <div
              className={cn(
                "flex flex-col truncate ml-1.5 transition-opacity duration-150 whitespace-nowrap",
                sidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
            >
              <span className="font-semibold text-xs tracking-tight text-sidebar-foreground leading-none">
                {APP_CONFIG.name}
              </span>
              <span className="text-[10px] text-sidebar-foreground/70 leading-none mt-1 font-normal">
                Workspace
              </span>
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav
          aria-label="Main Navigation"
          className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden custom-scrollbar"
        >
          {mainNavItems.map(renderNavItem)}

          <div className="py-1.5">
            <Separator className="bg-sidebar-border" />
          </div>

          {secondaryNavItems.map(renderNavItem)}
        </nav>

        {/* Secondary / Utility Actions */}
        <div className="p-2.5 border-t border-sidebar-border shrink-0 space-y-0.5 overflow-hidden">
          {utilityItems.map(renderUtilityButton)}
        </div>
      </aside>

      {/* Account Switcher and Logout Modals */}
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
