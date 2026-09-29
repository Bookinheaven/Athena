import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Target,
  History,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { useMultiAccount } from "@contexts/MultiAccountContext";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Today" },
  { to: "/planner", icon: Calendar, label: "Plan" },
  { to: "/focus-page", icon: Target, label: "Focus" },
  { to: "/sessions", icon: History, label: "History" },
  { to: "/dashboard", icon: TrendingUp, label: "Insights", isSecondary: true },
];

const secondaryNavItems = [
  { to: "/settings", icon: Settings, label: "Settings" },
];

const getInitials = (name) => {
  if (!name) return "U";
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
};

export const Sidebar = ({ className }) => {
  const { user, logout } = useAuth();
  const { clearAccountToken } = useMultiAccount();
  const { sidebarCollapsed } = useUIStore();
  const userId = user?._id || user?.id;
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSwitcherModal, setShowSwitcherModal] = useState(false);

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      if (userId) clearAccountToken(userId);
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
              isActive
                ? "text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground"
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

  return (
    <>
      <aside
        className={cn(
          "relative h-full z-30 flex flex-col shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out will-change-[width] select-none overflow-hidden",
          sidebarCollapsed ? "w-14" : "w-56",
          className
        )}
      >
        {/* Brand Header */}
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
              <span className="text-[10px] text-sidebar-foreground/50 leading-none mt-1 font-normal">
                {APP_CONFIG.version}
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

        {/* User Identity Footer */}
        <div className="border-t border-sidebar-border shrink-0 overflow-hidden">
          {sidebarCollapsed ? (
            /* Collapsed: avatar + separator + logout icon */
            <div className="flex flex-col items-center py-2 gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate("/profile")}
                    className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-sidebar-accent/50 transition-colors cursor-pointer focus-visible:outline-none"
                    aria-label="Profile"
                  >
                    <Avatar className="h-6 w-6 border border-sidebar-border/60 bg-sidebar-accent">
                      <AvatarImage src={user?.avatar} alt={user?.fullName || "User"} />
                      <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-semibold text-[9px]">
                        {getInitials(user?.fullName || user?.username)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium text-xs">
                  {user?.fullName || user?.username || "Profile"}
                </TooltipContent>
              </Tooltip>

              <div className="w-5 h-px bg-sidebar-border/50 my-0.5" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    aria-label="Log out"
                    className="w-9 h-9 flex items-center justify-center rounded-md text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer focus-visible:outline-none"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium text-xs">
                  Log out
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            /* Expanded: user card + always-visible labeled logout row */
            <div className="p-2 space-y-0.5">
              {/* User identity → profile */}
              <button
                onClick={() => navigate("/profile")}
                aria-label="Go to profile"
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-sidebar-accent/40 transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring group/card"
              >
                <Avatar className="h-7 w-7 border border-sidebar-border/60 bg-sidebar-accent shrink-0">
                  <AvatarImage src={user?.avatar} alt={user?.fullName || "User"} />
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-semibold text-[10px]">
                    {getInitials(user?.fullName || user?.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-sidebar-foreground leading-none truncate group-hover/card:text-sidebar-accent-foreground transition-colors">
                    {user?.fullName || user?.username || "Account"}
                  </p>
                  <p className="text-[10px] text-sidebar-foreground/45 leading-none mt-1 truncate font-normal">
                    {user?.email || "workspace"}
                  </p>
                </div>
              </button>

              {/* Logout — always visible, labeled, styled as destructive action */}
              <button
                onClick={() => setShowLogoutModal(true)}
                aria-label="Log out"
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sidebar-foreground/45 hover:text-destructive hover:bg-destructive/10 transition-all duration-150 cursor-pointer group/logout focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive/40"
              >
                <div className="w-7 h-7 flex items-center justify-center rounded-md group-hover/logout:bg-destructive/10 transition-colors shrink-0">
                  <LogOut className="h-3.5 w-3.5 transition-transform duration-200 group-hover/logout:-translate-x-0.5" />
                </div>
                <span className="text-[12px] font-medium leading-none tracking-tight">
                  Log out
                </span>
              </button>
            </div>
          )}
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
